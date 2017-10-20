require('dotenv').config({ silent: true });
const Redis = require('redis');

const Telegraf = require('telegraf');
const { Markup, Telegram } = Telegraf;
const TelegrafFlow = require('telegraf-flow');
const { enter } = TelegrafFlow;

const subscriber = Redis.createClient(process.env.REDIS_URL);
const publisher = Redis.createClient(process.env.REDIS_URL);

const bot = new Telegraf(process.env.BOT_TOKEN);
const telegram = new Telegram(process.env.BOT_TOKEN);

const addNewSource = require('./features/addNewChannel');

bot.command('start', ({ reply }) => {
    return reply('Hi, bro', Markup
        .keyboard(
            [
                ['Add memes source'],
                ['Get current VK memes top 10'],
            ]
        )
        .oneTime()
        .resize()
        .extra()
    )
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

subscriber.subscribe(process.env.REDIS_CHANNEL);
subscriber.on('message', (channel, message) => {
    const messageData = safeJSONParse(message);

    telegram.sendMessage(
        process.env.TELEGRAM_CHANNEL,
        messageData.text,
        messageData.options
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

function sendCommand(serviceName, command, parameters) {
    publisher.publish(
        `${serviceName}_commands`,
        JSON.stringify(
            { command: command, parameters: parameters }
        )
    );
}

const flow = new TelegrafFlow([addNewSource]);
bot.use(Telegraf.memorySession());
bot.use(flow.middleware());
bot.hears('Add memes source', enter('add-new-source'));

bot.startPolling();
