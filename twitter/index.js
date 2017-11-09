require('dotenv').config({ silent: true });
const Twitter = require('twitter');
const stringToNumber = require('../tools/stringToNumber');
const redis = require('../tools/redisWorker');

const client = new Twitter({
    consumer_key: process.env.TWITTER_CONSUMER_KEY,
    consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
    access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
    access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
});

const redisClient = new redis(process.env.REDIS_URL, stringToNumber(process.env.REDIS_TTL) || 24);

setTimeout(() => {
    getTweetsAndScheduleNext();
}, parseInt(process.env.START_TIMEOUT_MIN, 10) * 60 * 1000);

function getTweetsAndScheduleNext() {
    redisClient.getSources('twitter')
        .then((sources) => {
            if (!sources || !sources.length) {
                return;
            }

            const channel = sources[Math.floor(Math.random() * sources.length)];
            const button = {
                screen_name: channel.name,
                count: 20,
                trim_user: true,
                exclude_replies: true,
            };

            client
                .get('statuses/user_timeline', button)
                .then((tweets) => {
                    return getTopTweet(tweets, channel);
                })
                .then((topTweet) => {
                    if (topTweet) {
                        redisClient.publish(
                            process.env.REDIS_CHANNEL,
                            {
                                text: `https://twitter.com/${channel.name}/status/${topTweet.id_str}`,
                                source: 'twitter',
                                channel: channel.name,
                            },
                        );
                    }

                    setTimeout(() => {
                        getTweetsAndScheduleNext();
                    }, parseInt(process.env.REQUEST_INTERVAL_MIN, 10) * 60 * 1000);
                })
                .catch((err) => {
                    console.error(err);
                });
        });
}

function getTopTweet(tweets, source) {
    tweets = tweets
        .sort((a, b) => {
            return countRating(a) - countRating(b);
        });

    const topTweet = tweets.pop();

    if (!topTweet) {
        return Promise.resolve();
    }

    const tweetKey = `twitter-source-sent-tweets:${topTweet.id_str}`;

    redisClient.exists(tweetKey)
        .then((cachedTopTweet) => {
            if (cachedTopTweet) {
                return Promise.resolve(getTopTweet(tweets, source));
            }

            redisClient.cache(tweetKey, '1');
            return Promise.resolve(topTweet);
        });
}

function countRating(tweet) {
    return tweet.favorite_count + (tweet.retweet_count * 1.5);
}

const bodyParser = require('body-parser');
const express = require('express');
const app = express();

app.use(bodyParser.json());
app.post('/validate', (req, res) => {
    let params = {
        screen_name: req.body.source,
        count: 1,
        trim_user: true,
        exclude_replies: true,
    };

    return client
        .get('statuses/user_timeline', params)
        .then((result) => {
            let responseData = {
                exists: !!result.length,
                source: null,
            };

            if (result) {
                responseData.source = req.body.source;
            }

            res.json(responseData).end();
        });
});

app.listen(9002, () => {
    console.log('Twitter Web App 9002');
});

