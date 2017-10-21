const redis = require('redis');

class RedisWorker {
    constructor(url, ttl = 24) {
        this.url = url;
        this.client = redis.createClient(this.url);
        this.ttl = ttl;
    }

    exists(key) {
        return new Promise((resolve) => {
            this.client.get(key, (err, value) => {
                resolve(!!value);
            })
        });
    }

    cache(key, value) {
        this.client.set(key, value, 'EX', this.ttl * 60 * 60);
    }

    publish(channel, message) {
        this.client.publish(channel, JSON.stringify({ text: message }));
    }

    addSource(platform, source) {
        return new Promise((resolve, reject) => {
            this.client.hset(platform, source, 100, (err) => {
                if (err) {
                    reject();
                } else {
                    resolve(source);
                }
            });
        });
    }

    getSources(platform) {
        return new Promise((resolve, reject) => {
            this.client.hgetall(platform, (err, data) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(data);
                }
            });
        });
    }

    delSource(platform, source) {
        return Promise.resolve()
            .then(() => {
                this.client.hdel(platform, source, (err) => {
                    return err ? Promise.reject(err) : Promise.resolve(true);
                });
            });
    }

}

module.exports = RedisWorker;