require('dotenv').config({ silent: true });
const axios = require('axios');

const groupIds = [
                    "-45745333", // vk.com/4ch
                    "-31480508", // vk.com/pikabu
                    "-131489096", // vk.com/weirdkerneltricks
                    "-111920468", // vk.com/neomemeral
                    "-149905440", // vk.com/postmodern_memes
                    "-124374483", // vk.com/navalniymem
                    "-149919976", // vk.com/anarchytranshum
                    "-32041317", // vk.com/ru9gag
                ];

let cache = {};

const subscriber = require('redis').createClient(process.env.REDIS_URL);
const publisher = require('redis').createClient(process.env.REDIS_URL);

subscriber.subscribe('vk_commands');
subscriber.on('message', (channel, message) => {
    const messageData = safeJSONParse(message);

    if (messageData.command == 'top') {
        getTop(messageData.parameters.get).then((top) => {
            publisher.publish(
                'vk_top',
                JSON.stringify(
                    { top: top }
                )
            );
        });
    }

    console.log(messageData);
});

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
                            likes: item.likes.count,
                            source: id
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

    return updateSources('vk').then((sources) => {
        sources.forEach((id) => {
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
    });

}

function getVkMeme() {
    getTop(200).then((top) => {
        let actualMeme = null;

        top.some((item, index) => {
            actualMeme = top[index];
            return !cache[actualMeme.id];
        });

        if (cache[actualMeme.id]) {
            return;
        }

        isCached(actualMeme.id)
            .then(() => {
                cache[actualMeme.id] = actualMeme.src;

                publisher.set(`vk_${actualMeme.id}`, JSON.stringify(actualMeme), 'EX', 24 * 60 * 60);

                publisher.publish(
                    process.env.REDIS_CHANNEL,
                    JSON.stringify(
                        {
                            text: actualMeme.src,
                            source: 'twitter',
                            channel: actualMeme.source,
                        }
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
        subscriber.get(`vk_${id}`, (err, value) => {
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

function safeJSONParse(json) {
    let object;
    try {
        object = JSON.parse(json);
    } catch (err) {
        console.error(err);
        object = {};
    }

    return object;
}

function updateSources(channel) {
    let sources = [];

    return new Promise((resolve, reject) => {
        publisher.hkeys(channel, (err, value) => {
            if (value) {
                value.forEach((source, i) => {
                    sources.push(source);
                });
                resolve(sources);
            } else {
                reject(groupIds);
            }
        });
    });
}

buildCache();

setTimeout(() => {
    setInterval(() => {
        getVkMeme();
    }, process.env.REQUEST_INTERVAL_MIN * 60 * 1000);
}, parseInt(process.env.START_TIMEOUT_MIN) * 60 * 1000);


