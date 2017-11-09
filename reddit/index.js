require('dotenv').config({ silent: true });
const redisClient = require('redis').createClient(process.env.REDIS_URL);
const redisChannel = process.env.REDIS_CHANNEL;
const snoowrap = require('snoowrap');
const stringToNumber = require('../tools/stringToNumber');
const redisTtl = (stringToNumber(process.env.REDIS_TTL) || 24) * 60 * 60;

const redditApp = new snoowrap({
    userAgent: process.env.reddit_agent,
    clientId: process.env.reddit_client,
    clientSecret: process.env.reddit_secret,
    username: process.env.reddit_user,
    password: process.env.reddit_pass,
});

function getTops(subr) {
    return redditApp.getSubreddit(subr).getTop({ time: 'hour' }).catch((error) => {
        console.error(error);
        return Promise.resolve([]);
    });
}


function getRedditChannels() {
    return new Promise((resolve) => {
        redisClient.hkeys('reddit', (err, data) => {
            resolve(data);
        });
    });
}

function getAll(channels) {
    let promises = [];
    let allMemes = [];

    channels.forEach((item) => {
        promises.push(getTops(item));
    });
    return Promise.all(promises)
        .then((result) => {
            result.forEach((meme) => {
                allMemes = allMemes.concat(meme);
            });
            allMemes = allMemes
                .map((meme) => {
                    return {
                        id: meme.id,
                        url: meme.url
                    };
                });
            return allMemes;
        });
}

function sortAndPush() {
    getRedditChannels().then((channels) => {
        getAll(channels).then((topmemes) => {
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
    isCached(values[0].id)
        .then((cached) => {
            if (cached) {
                values.shift();
                defineTop(values);
            } else {
                cache(values[0]);
                publish(values[0].url);
            }
        })
        .catch((error) => {
            console.log(error);
        });
}

function isCached(id) {
    return new Promise((resolve, reject) => {
        redisClient.get(`reddit_${id}`, (err, value) => {
            resolve(!!value);
        });
    });
}

function cache(message) {
    redisClient.set(`reddit_${message.id}`, JSON.stringify(message), 'EX', redisTtl);
}

function publish(message) {
    redisClient.publish(redisChannel, JSON.stringify({ text: message}));
}

// start timeout
setTimeout(() => {
    sortAndPush();
}, parseInt(process.env.START_TIMEOUT_MIN, 10) * 60 * 1000);

const bodyParser = require('body-parser');
const express = require('express');
const app = express();

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

