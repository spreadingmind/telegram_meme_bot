require('dotenv').config({ silent: true });

const snoowrap = require('snoowrap');
const bodyParser = require('body-parser');
const app = require('express')();
const redisWorker = require('../tools/redisWorker');
const stringToNumber = require('../tools/stringToNumber');

const redis = new redisWorker(process.env.REDIS_URL, stringToNumber(process.env.REDIS_TTL) || 24);
const redisChannel = process.env.REDIS_CHANNEL;

const redditApp = new snoowrap({
    userAgent: process.env.reddit_agent,
    clientId: process.env.reddit_client,
    clientSecret: process.env.reddit_secret,
    username: process.env.reddit_user,
    password: process.env.reddit_pass,
});

function getTops(subr) {
    return redditApp
        .getSubreddit(subr)
        .getTop({ time: 'hour' })
        .catch((error) => {
            console.error(error);
            return Promise.resolve([]);
        });
}

function getAll(channels) {
    if (!channels || !channels.length) {
        return Promise.resolve([]);
    }
    let promises = [];
    let allMemes = [];

    channels.forEach((item) => {
        promises.push(getTops(item));
    });

    return Promise
        .all(promises)
        .then((result) => {
            result.forEach((meme) => {
                allMemes = allMemes.concat(meme);
            });

            allMemes = allMemes
                .map((meme) => {
                    return {
                        id: meme.id,
                        url: meme.url,
                    };
                });

            return allMemes;
        });
}

function sortAndPush() {
    redis.getSources('reddit')
        .then((channels) => {
            getAll(channels)
                .then((topmemes) => {
                    if (!topmemes.length) {
                        return;
                    }
                    defineTop(topmemes);

                    // request timeout
                    setTimeout(() => {
                        sortAndPush();
                    }, parseInt(process.env.REQUEST_INTERVAL_MIN, 10) * 60 * 1000);
                });
            });
}

function defineTop(values) {
    if (!values.length) {
        return;
    }

    redis.exists(`reddit_${values[0].id}`)
        .then((cached) => {
            if (cached) {
                values.shift();
                defineTop(values);
            } else {
                redis.cache(values[0].id, values[0].url);
                redis.publish(redisChannel, values[0].url);
            }
        })
        .catch((error) => {
            console.log(error);
        });
}

// start timeout
setTimeout(() => {
    sortAndPush();
}, parseInt(process.env.START_TIMEOUT_MIN, 10) * 60 * 1000);

app.use(bodyParser.json());
app.post('/validate', (req, res) => {
    return redditApp.getSubreddit(req.body.source)
        .getTop({ time: 'hour' })
        .then((result) => {
            let responseData = {
                exists: !!result.length,
                source: null,
            };

            if (result) {
                responseData.source = req.body.source;
            }

            res.json(responseData).end();
        })
        .catch(() => {
            let responseData = {
                exists: false,
                source: null,
            };

            res.json(responseData).end();
        });
});

app.listen(9001, () => {
    console.log('Reddit Web App 9001');
});

