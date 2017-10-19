require('dotenv').config({ silent: true });
const Redis = require('redis');
const Telegraf = require('telegraf');
const { Markup, Telegram } = Telegraf;
const subscriber = Redis.createClient(process.env.REDIS_URL);
const publisher = Redis.createClient(process.env.REDIS_URL);

const bot = new Telegraf(process.env.BOT_TOKEN);
const telegram = new Telegram(process.env.BOT_TOKEN);

bot.command('start', ({ reply }) => {
    return reply('Hi, you can add a new channel', Markup
        .keyboard([['Add channel'], ['Get current VK memes top 10']])
        .oneTime()
        .resize()
        .extra()
    )
});

bot.hears('Add channel', ctx => {
    return ctx.reply('Sorry nothing to do!');
});

bot.hears('Get current VK memes top 10', ctx => {
    ctx.reply('Get ready for the top!');

    let limit = 10;
    const commandSubscriber = Redis.createClient(process.env.REDIS_URL);

    sendCommand('vk', 'top', { get: limit });

    commandSubscriber.subscribe('vk_top');
    commandSubscriber.on('message', (channel, message) => {

        const messageData = safeJSONParse(message);

        messageData.top.forEach((item, index) => {
            setTimeout(() => ctx.reply(`#${index + 1} \nLikes: ${item.likes} \n${item.src}`), 1000 * index);
        });
    });

    setTimeout(() => commandSubscriber.quit(), 1000 * limit);
});

bot.startPolling();

subscriber.subscribe(process.env.REDIS_CHANNEL);
subscriber.on('message', (channel, message) => {
    const messageData = safeJSONParse(message);

    const inlineMessageRatingKeyboard = [[
        {
            text: '👎',
            callback_data: JSON.stringify({ value: -1, source: messageData.source, channel: messageData.channel })
        },
        {
            text: '👍',
            callback_data: JSON.stringify({ value: 1, source: messageData.source, channel: messageData.channel })
        },
    ]];

    telegram.sendMessage(
        process.env.TELEGRAM_CHANNEL,
        messageData.text,
        Object.assign(
            {},
            messageData.options,
            {
                reply_markup: JSON.stringify({ inline_keyboard: inlineMessageRatingKeyboard }),
            }
        )
    );
});

bot.on('callback_query', (callbackQuery) => {
    console.log(callbackQuery.update.callback_query.data);
    callbackQuery.answerCallbackQuery();
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

//add new source to redis hash
function addNew(source, channel) {
    let chan = {};
    chan[channel] = 100;
    redisClient.hmset(source, chan);
}

function sendCommand(serviceName, command, parameters) {
    publisher.publish(
        `${serviceName}_commands`,
        JSON.stringify(
            { command: command, parameters: parameters }
        )
    );
}

