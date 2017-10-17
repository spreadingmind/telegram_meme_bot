require('dotenv').config({ silent: true });
const redisClient = require('redis').createClient(process.env.REDIS_URL);
const logger = require('./logger');


redisClient.subscribe(process.env.REDIS_CHANNEL);
redisClient.on('message', (channel, message) => {
    console.log("on message");
    console.log(message);
    const messageData = safeJSONParse(message);

    telegram.sendMessage(
        process.env.TELEGRAM_CHANNEL,
        messageData.text,
        messageData.options
    ).then((result) => {
        console.log("telegram.sendMessage");
        console.log(result);
    });
});


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

