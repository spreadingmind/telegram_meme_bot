const redisConnection = require('redis').createClient(process.env.REDIS_URL);

module.exports = redisConnection;