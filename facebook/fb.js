const FB = require('fb');
const redis = require('redis');

class FBConnector {
    constructor(appId, appSecret, redisUrl, redisChannel, fetchInterval) {
        this.appId = appId;
        this.appSecret = appSecret;

        this.redisBotClient = redis.createClient(redisUrl);
        this.redisChannel = redisChannel;
        this.redisPrefix = 'fb_';
        this.instance = FB.extend({ appId, appSecret });
        this.fetchInterval = fetchInterval;

        this.channels = [
            'memes',
            'livingnightmares',
            'PlaceForMemes',
            'Memes.fr',
            'MemesLas24Horas',
            'Dankrecoverymemes',
            'top10memesoftheweek'
        ];
    }

    connect() {
        return Promise
            .resolve()
            .then(() => {
                return this.instance
                    .api('oauth/access_token', {
                        client_id: this.appId,
                        client_secret: this.appSecret,
                        grant_type: 'client_credentials'
                    });
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
        let promises = [];
        let values = [];
        this.channels.forEach((item) => {
            promises.push(this.instance.api(`${item}/posts?fields=picture,message,link,likes.summary(true)&limit=25&since=${3600 * 12 * 1000}`));
        });

        Promise.all(promises).then((response) => {
            response.forEach((res) => {
                if (!res || res.error) {
                    console.log(!res ? 'error occurred' : res.error);
                    return;
                }
                values = values.concat(res.data);
            });

            values = values
                .map((item) => {
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

            this.defineTop(values);
        });
    }

    defineTop(values) {
        this.isCached(values[0].id)
            .then((isFound) => {
                if (isFound) {
                    values.shift();
                    this.defineTop(values);
                } else {
                    this.cache(values[0]);
                    this.publish(values[0].text);
                }
            })
            .catch((err) => {
                console.log(JSON.stringify(err));
            })
    }

    isCached(id) {
        return new Promise((resolve) => {
            this.redisBotClient.get(`${this.redisPrefix}${id}`, (err, value) => {
                resolve(!!value);
            })
        });
    }

    cache(message) {
        this.redisBotClient.set(`${this.redisPrefix}${message.id}`, JSON.stringify(message), 'EX', 24 * 60 * 60);
    }

    publish(message) {
        this.redisBotClient.publish(this.redisChannel, JSON.stringify({ text: message }));
    }
}

module.exports = FBConnector;