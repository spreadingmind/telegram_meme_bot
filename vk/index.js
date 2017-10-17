require('dotenv').config({ silent: true });
const axios = require('axios');

const groupIds = [
                    "-45745333", // vk.com/4ch
                    "-31480508", // vk.com/pikabu
                    "-25089415", // vk.com/mem1001
                    "-35182135", // vk.com/atasru
                    "-92337511", // vk.com/abstract_memes
                ];

let cache = {};

const redisClient = require('redis').createClient(process.env.REDIS_URL);

function getPhotos(id) {
    let startTime = new Date().getTime();
    let timeOffset = 24 * 60 * 60 * 1000; // 24h

    startTime = Math.floor((startTime - timeOffset) / 1000);

    const apiUrl = `https://api.vk.com/method/photos.get?owner_id=${id}&album_id=wall&extended=1&limit=50&rev=1`;
    return axios.get(apiUrl)
        .then((response) => {
            let resultMemes = [];
            response.data.response.forEach((item) => {
                if (item.created > startTime) {
                    resultMemes.push({
                            id: item.pid,
                            src: item.src_big,
                            likes: item.likes.count
                    });
                }
            });
            return resultMemes;
        }).catch((error) => {
            console.error(error);
        })
}

function getTop(limit = 100) {
    let allMemes = [];
    let allPromises = [];

    groupIds.forEach((id) => {
        allPromises.push(getPhotos(id));
    });

    return Promise.all(allPromises).then((results) => {
        results.forEach((result) => {
            allMemes = allMemes.concat(result);
        });

        return allMemes.sort((a, b) => {
            if (a.likes > b.likes) {
                return -1;
            }
            if (a.likes < b.likes) {
                return 1;
            }
            return 0;
        }).slice(0, limit);
    });
}

function getVkMeme() {
    console.log("getVkMeme");
    getTop(200).then((top) => {
        let actualMeme = null;

        top.some((item, index) => {
            actualMeme = top[index];
            return !cache[actualMeme.id];
        });

        if (cache[actualMeme.id]) {
            console.log("cache[actualMeme.id] = ", cache[actualMeme.id]);
            return;
        }

        isCached(actualMeme.id)
            .then(() => {
                cache[actualMeme.id] = actualMeme.src;

                redisClient.set(`vk_${actualMeme.id}`, JSON.stringify(actualMeme), 'EX', 24 * 60 * 60);

                redisClient.publish(
                    process.env.REDIS_CHANNEL,
                    JSON.stringify(
                        { text: actualMeme.src }
                    )
                );

            })
            .catch(() => {
                cache[actualMeme.id] = actualMeme.src;
            });


    });
}

function isCached(id) {
    return new Promise((resolve, reject) => {
        redisClient.get(`vk_${id}`, (err, value) => {
            if (value) {
                reject();
            } else {
                resolve();
            }
        })
    });
}

function buildCache() {
    getTop(200).then((top) => {

        top.forEach((meme) => {
            isCached(meme.id)
                .then(() => {})
                .catch(() => {
                    cache[meme.id] = meme.src;
                });
            });
    });
}

buildCache();

setTimeout(() => {
    setInterval(() => {
        getVkMeme();
    }, process.env.REQUEST_INTERVAL_MIN * 60 * 1000);
}, parseInt(process.env.START_TIMEOUT_MIN) * 60 * 1000);


