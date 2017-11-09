const urlModule = require('url');
const Telegraf = require('telegraf');
const { Markup } = Telegraf;

const TelegrafFlow = require('telegraf-flow');
const { WizardScene } = TelegrafFlow;

const keyboardSetup = require('../constants/defaultKeyboardSetup');

const axios = require('axios');
const redisClient = require('../../tools/redisWorker');

const domains = {
    'facebook.com': 'facebook',
    'www.facebook.com': 'facebook',
    'twitter.com': 'twitter',
    'www.twitter.com': 'twitter',
    'www.reddit.com': 'reddit',
    'reddit.com': 'reddit',
    'www.vk.com': 'vk',
    'vk.com': 'vk',
};

const apiUrls = {
    vk: process.env.VK_API_URI,
    facebook: process.env.FACEBOOK_API_URI,
    reddit: process.env.REDDIT_API_URI,
    twitter: process.env.TWITTER_API_URI,
};

const addNewSource = new WizardScene(
    'add-new-source',
    (ctx) => {
        let button = Markup
            .keyboard([
                ['Back'],
            ])
            .oneTime()
            .resize()
            .extra();

        ctx.reply('Please send url to channel', button);

        return ctx.flow.wizard.next();
    },
    (ctx) => {
        if (!ctx.message) {
            return ctx.reply('Please try again.');
        }
        let url = ctx.message.text;

        if (url === 'Back') {
            ctx.reply('Hi, bro', keyboardSetup);
            return ctx.flow.leave();
        }

        let parsedUrl = urlModule.parse(url);

        if (!parsedUrl.hostname) {
            return ctx.reply('Please enter url');
        }

        if (!domains[parsedUrl.hostname]) {
            return ctx.reply('We not supported such platform.');
        }

        this.platform = domains[parsedUrl.hostname];

        let parts = parsedUrl.pathname.split('/');
        let entity = null;
        let index = null;

        switch (this.platform) {
            case 'vk':
            case 'facebook':
            case 'twitter':
                if (parts < 2) {
                    console.log(parsedUrl.pathname);
                    return ctx.reply('Invalid or unsupported link. Please try another one.');
                }

                index = 1;
                entity = parts[index];

                break;

            case 'reddit':
                if (parts < 3) {
                    console.log(parsedUrl.pathname);
                    return ctx.reply('Invalid or unsupported link. Please try another one.');
                }
                index = 2;
                entity = parts[index];

                break;

            default:
                break;
        }

        axios.post(`${apiUrls[this.platform]}/validate`, { source: entity })
            .then((response) => {
                if (!response || !response.data.exists) {
                    return ctx.reply('Yo bro. Please try another channel');
                }

                let redis = new redisClient(process.env.REDIS_URL);

                redis.addSource(this.platform, response.data.source)
                    .then(() => {
                        ctx.reply('Awesome bro! Enjoy yourself', keyboardSetup);
                        return ctx.flow.leave();
                    });
            })
            .catch((err) => {
                console.log(err);
                return ctx.reply('Yo bro. Please try another channel');
            });
    },
);

module.exports = addNewSource;
