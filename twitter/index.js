require('dotenv').config({ silent: true });
const Twitter = require('twitter');
const redis = require('redis');
const redisClient = redis.createClient(process.env.REDIS_URL);

const client = new Twitter({
    consumer_key: process.env.TWITTER_CONSUMER_KEY,
    consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
    access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
    access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
});

const channels = [
    { name: 'chuck_facts', likesThreshold: 0 },
    { name: 'medievalreacts', likesThreshold: 0 },
    { name: 'ohwonka', likesThreshold: 0 },
    { name: 'memecenter', likesThreshold: 0 },
    { name: 'runetmemes', likesThreshold: 0 },
    { name: 'freememeskids', likesThreshold: 0 },
    { name: 'memesonhistory', likesThreshold: 0 },
];

setTimeout(() => {
    getTweetsAndScheduleNext();
}, parseInt(process.env.START_TIMEOUT_MIN) * 60 * 1000);

function getTweetsAndScheduleNext() {
    const channel = channels[Math.floor(Math.random() * channels.length)];

    client.get('statuses/user_timeline',
        {
            screen_name: channel.name,
            count: 20,
            trim_user: true,
            exclude_replies: true,
        })
        .then((tweets) => {
            return getTopTweet(tweets, channel);
        })
        .then((topTweet) => {
            if (topTweet) {
                redisClient.publish(
                    process.env.REDIS_CHANNEL,
                    JSON.stringify(
                        {
                            text: `https://twitter.com/${channel.name}/status/${topTweet.id_str}`,
                            source: 'twitter',
                            channel: channel.name,
                        }
                    )
                );
            }

            setTimeout(() => {
                getTweetsAndScheduleNext();
            }, parseInt(process.env.REQUEST_INTERVAL_MIN) * 60 * 1000);
        })
        .catch((err) => {
            console.error(err);
        });
}

function getTopTweet(tweets, source) {
    tweets = tweets
        .filter((tweet) => {
            return countRating(tweet) >= source.likesThreshold;
        })
        .sort((a, b) => {
            return countRating(a) - countRating(b);
        });

    const topTweet = tweets.pop();

    if (!topTweet) {
        return Promise.resolve();
    }

    const tweetKey = `twitter-source-sent-tweets:${topTweet.id_str}`;

    return new Promise((resolve, reject) => {
        redisClient.get(
            tweetKey,
            (err, cachedTopTweet) => {
                if (err) {
                    reject(err);
                }

                if (cachedTopTweet) {
                    return resolve(getTopTweet(tweets, source));
                }

                redisClient.set(tweetKey, '1');
                redisClient.expire(tweetKey, 60 * 60 * 24);
                return resolve(topTweet);
            }
        );
    });
}

function countRating(tweet) {
    return tweet.favorite_count + tweet.retweet_count * 1.5;
}