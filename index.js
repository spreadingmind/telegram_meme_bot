require('dotenv').config({ silent: true });
const Telegraf = require('telegraf');
const { Markup, Telegram } = Telegraf;
const redisClient = require('redis').createClient(process.env.REDIS_URL);

const bot = new Telegraf(process.env.BOT_TOKEN);
const telegram = new Telegram(process.env.BOT_TOKEN);

console.log(bot);

bot.command('start', ({ reply }) => {
    return reply('Hi User, u can add new channel', Markup
        .keyboard([
            ['Add channel']
        ])
        .oneTime()
        .resize()
        .extra()
    )
});

bot.hears('Add channel', ctx => {
    return ctx.reply('Sorry nothing to do!');
});

bot.startPolling();

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

