const FB = require('fb');

class FBConnector {
    constructor(options, connector) {
        let {
            appId,
            appSecret,
            conChannel,
            conPrefix,
            fetchInterval,
        } = options;

        this.appId = appId;
        this.appSecret = appSecret;

        this.connector = connector;
        this.conChannel = conChannel;
        this.conPrefix = conPrefix;
        this.instance = FB.extend({ appId, appSecret });
        this.fetchInterval = fetchInterval;
    }

    connect() {
        return this.instance.api('oauth/access_token', {
            client_id: this.appId,
            client_secret: this.appSecret,
            grant_type: 'client_credentials',
        })
        .then((res) => {
            if (!res || res.error) {
                console.log(!res ? 'error occurred' : res.error);
                return Promise.reject(res.error);
            }

            this.accessToken = res.access_token;
            this.instance.setAccessToken(this.accessToken);

            return Promise.resolve(res.access_token);
        });
    }

    launch(accessToken = null) {
        if (accessToken) {
            this.accessToken = accessToken;
            this.instance.setAccessToken(this.accessToken);
        }

        if (this.accessToken) {
            if (this.interval) {
                clearInterval(this.interval);
            }
            this.interval = setInterval(() => {
                this.getTop();
            }, parseInt(this.fetchInterval, 10) * 60 * 1000);
        } else {
            throw new Error('Access token is not found. Please run connect method.');
        }
    }

    getTop() {
        console.log('Try to send something!');
        return this.connector
            .getSources('facebook')
            .then((sources) => {
                if (!sources) {
                    return Promise.resolve();
                }
                console.log('Sources were found');
                sources = Object.keys(sources);
                if (!sources.length) {
                    return Promise.resolve();
                }

                let index = Math.floor(Math.random() * sources.length);
                let source = sources[index];
                console.log(`Source ${source} is chosen one.`);
                return this.instance.api(`${source}/posts?fields=link,likes.summary(true)&limit=25&since=${3600 * 12 * 1000}`);
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

                let values = result.data
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
        return `${this.conPrefix}${id}`;
    }

    defineTop(values, trashHold) {
        if (!values.length) {
            return;
        }

        let message = values[0];
        if (message.likes < trashHold) {
            console.log(`All post are shit, sorry. Trash hold was ${trashHold}`);
            return;
        }

        this.connector.exists(this.getKey(message.id))
            .then((isFound) => {
                if (isFound) {
                    values.shift();
                    this.defineTop(values, trashHold);
                } else {
                    this.connector.cache(this.getKey(message.id), message.text);
                    this.connector.publish(this.conChannel, message.text);
                }
            })
            .catch((err) => {
                console.log(JSON.stringify(err));
            });
    }

    validate(channelName) {
        return this.instance.api(channelName)
            .then((res) => {
                return Promise.resolve(!!res.id);
            })
            .catch(() => {
                return Promise.resolve(false);
            });
    }
}

module.exports = FBConnector;
