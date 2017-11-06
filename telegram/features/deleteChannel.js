const Telegraf = require('telegraf');
const { Markup } = Telegraf;

const TelegrafFlow = require('telegraf-flow');
const { WizardScene } = TelegrafFlow;

const redisClient = require('../../tools/redisWorker');
const redis = new redisClient(process.env.REDIS_URL);

const keyboardSetup = require('../constants/defaultKeyboardSetup');

const platforms = [
    'vk',
    'reddit',
    'facebook',
    'twitter',
];

function getAllSources(storage) {
    let promises = [];
    platforms.forEach((item) => {
        promises.push(storage.getSources(item));
    });

    return Promise.all(promises)
        .then((responses) => {
            let result = [];

            responses.forEach((response, index) => {
                if (!response) {
                    return;
                }

                let keys = Object.keys(response);

                if (keys.length) {
                    let platform = platforms[index];
                    result.push({
                        platform,
                        sources: keys,
                    });
                }
            });

            return result;
        })
}

const deleteSource = new WizardScene('delete-source',
    (ctx) => {
        getAllSources(redis)
            .then((results) => {
                let tempCache = {};
                let messages = ['Please choose one...\n\n'];
                results.forEach((item) => {
                    let messageItem = `- ${item.platform}\n`;
                    item.sources.forEach((source) => {
                        messageItem += `${source}\n`;
                        tempCache[source] = item.platform;
                    });
                    messages.push(messageItem);
                });

                if (messages.length === 1) {
                    messages = ['You do not have any sources.\n'];
                    ctx.reply(messages.join(''), keyboardSetup);
                    return ctx.flow.leave();
                }

                this.sourcesTempCache = tempCache;

                ctx.reply(messages.join(''), Markup
                    .keyboard(
                        [
                            ['Back'],
                        ]
                    )
                    .oneTime()
                    .resize()
                    .extra()
                );

                return ctx.flow.wizard.next();
            });
    },
    (ctx) => {
        if (!ctx.message || !ctx.message.text) {
            return ctx.reply('Please try again.');
        }

        let cacheItem = this.sourcesTempCache[ctx.message.text];
        if (!cacheItem) {
            return ctx.reply('We do not have such source.');
        }

        let platform = cacheItem;
        let source = ctx.message.text;
        redis.delSource(platform, source)
            .then(() => {
                ctx.reply('Hell yeah. Just go away!', keyboardSetup);
                return ctx.flow.leave();
            })
            .catch((err) => {
                console.log(err);
                return ctx.reply('Hustom we have a problem!!');
            });
    }
);

module.exports = deleteSource;