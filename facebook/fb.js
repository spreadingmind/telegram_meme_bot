const FB = require('fb');
const botRedis = require('../tools/redisWorker');

class FBConnector {
    constructor(appId, appSecret, redisUrl, redisChannel, fetchInterval) {
        this.appId = appId;
        this.appSecret = appSecret;

        this.redisBotClient = new botRedis(redisUrl);
        this.redisChannel = redisChannel;
        this.redisPrefix = 'facebook_cache_';
        this.instance = FB.extend({ appId, appSecret });
        this.fetchInterval = fetchInterval;

        // this.channels = [
        //     'memes',
        //     'livingnightmares',
        //     'PlaceForMemes',
        //     'Memes.fr',
        //     'Dankrecoverymemes',
        //     'top10memesoftheweek'
        // ];
    }

    connect() {
        return this.instance
            .api('oauth/access_token', {
                client_id: this.appId,
                client_secret: this.appSecret,
                grant_type: 'client_credentials'
            })
            .then((res) => {
                if (!res || res.error) {
                    console.log(!res ? 'error occurred' : res.error);
                    return Promise.reject(res.error);
                }

                this.accessToken = res.access_token;
                this.instance.setAccessToken(this.accessToken);

                return Promise.resolve(res.access_token)
            });
    }

    launch(accessToken = null) {
        if (accessToken) {
            this.accessToken = accessToken;
            this.instance.setAccessToken(this.accessToken);
        }

        if (this.accessToken) {
            setInterval(() => {
                this.getTop();
            }, parseInt(this.fetchInterval) * 60 * 1000);
        } else {
            throw new Error('Access token is not found. Please run connect method.')
        }
    }

    getTop() {
        console.log('Try to send something!');
        return this.redisBotClient
            .getSources('facebook')
            .then((sources) => {
                console.log('Sources are founded');
                if (!sources || !sources.length) {
                    return Promise.resolve();
                }

                let index = Math.floor(Math.random() * sources.length);
                let source = sources[index];
                console.log(`Source ${source} is chosen one.`);
                return this.instance.api(`${source}/posts?fields=picture,message,link,likes.summary(true)&limit=25&since=${3600 * 12 * 1000}`)
            })
            .then((result) => {
                if (!result) {
                    return Promise.resolve();
                }

                if (result.error) {
                    console.log(JSON.stringify(result.error));
                    return Promise.reject();
                }
                let trashHold = 0;

                let values = data.data
                    .map((item) => {
                        trashHold += item.likes.summary.total_count || 0;

                        return {
                            id: item.id,
                            text: item.link,
                            likes: item.likes.summary.total_count,
                        };
                    })
                    .sort((a, b) => {
                        if (a.likes > b.likes) {
                            return -1;
                        }
                        if (a.likes < b.likes) {
                            return 1;
                        }

                        return 0;
                    });

            trashHold = Math.floor(trashHold / values.length);
            this.defineTop(values, trashHold);
        });
    }

    getKey(id) {
        return `${this.redisPrefix}${id}`;
    }

    defineTop(values, trashHold) {
        if (values.length || valu) {
            return;
        }

        let message = values[0];
        if (message.likes < trashHold) {
            console.log(`All post are shit, sorry. Trash hold was ${trashHold}`);
            return;
        }

        this.redisBotClient.exists(this.getKey(message.id))
            .then((isFound) => {
                if (isFound) {
                    values.shift();
                    this.defineTop(values, trashHold);
                } else {
                    this.redisBotClient.cache(this.getKey(message.id), message.text);
                    this.redisBotClient.publish(this.redisChannel, message.text);
                }
            })
            .catch((err) => {
                console.log(JSON.stringify(err));
            })
    }

    validate(channelName) {
        return this.instance.api(channelName)
            .then((res) => {
                return Promise.resolve(!!res.id)
            })
            .catch(() => {
                return Promise.resolve(false);
            });
    }

}

module.exports = FBConnector;