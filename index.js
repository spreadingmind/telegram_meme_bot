require('dotenv').config({ silent: true });
const Telegraf = require('telegraf');
const { Markup, Telegram } = Telegraf;
const redisClient = require('redis').createClient(process.env.REDIS_URL);

const bot = new Telegraf(process.env.BOT_TOKEN);
const telegram = new Telegram(process.env.BOT_TOKEN);

const inlineMessageRatingKeyboard = [[
    { text: '👍', callback_data: 'like' },
    { text: '👎', callback_data: 'dislike' }
]];

bot.command('start', ({ reply }) => {
    return reply('Hi, you can add a new channel', Markup
        .keyboard([['Add channel']])
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
    const messageData = safeJSONParse(message);

    telegram.sendMessage(
        process.env.TELEGRAM_CHANNEL,
        messageData.text,
        Object.assign(
            {},
            messageData.options,
            { reply_markup: JSON.stringify({ inline_keyboard: inlineMessageRatingKeyboard }) }
        )
    );
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

function addNew(source, channel) {
    redisClient.hmset(source, channel)
}

