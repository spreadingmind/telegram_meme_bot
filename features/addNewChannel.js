const urlModule = require('url');
const Telegraf = require('telegraf');
const { Markup } = Telegraf;

const TelegrafFlow = require('telegraf-flow');
const { WizardScene } = TelegrafFlow;

const axios = require('axios');
const redisClient = require('../tools/redisWorker');

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

const addNewSource = new WizardScene('add-new-source',
    (ctx) => {
        ctx.reply('Please send url to channel', Markup
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
    },
    (ctx) => {
        if (!ctx.message) {
            return ctx.reply('Please try again.');
        }
        let url = ctx.message.text;

        if (url === 'Back') {
            ctx.reply('Hi, bro', Markup
                .keyboard(
                    [
                        ['Add memes source'],
                        ['Get current VK memes top 10'],
                    ]
                )
                .oneTime()
                .resize()
                .extra()
            );
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

        let apiUrl = `http://127.0.0.1`;
        let parts = parsedUrl.pathname.split('/');
        let entity = null;

        switch(this.platform) {
            case 'vk':
                apiUrl = `${apiUrl}:9003`;
                break;

            case 'facebook':
                apiUrl = process.env.FACEBOOK_API_URI;

                if (parts < 2) {
                    console.log(parsedUrl.pathname);
                    return ctx.reply('Invalid or unsupported link. Please try another one.');
                }

                entity = parts[1];
                break;

            case 'reddit':
                apiUrl = `${apiUrl}:9001`;

                if (parts < 3) {
                    console.log(parsedUrl.pathname);
                    return ctx.reply('Invalid or unsupported link. Please try another one.');
                }

                entity = parts[2];
                break;

            case 'twitter':
                apiUrl = `${apiUrl}:9002`;

                if (parts < 2) {
                    console.log(parsedUrl.pathname);
                    return ctx.reply('Invalid or unsupported link. Please try another one.');
                }

                entity = parts[1];

                break;

            default:
                break;
        }

        axios.post(`${apiUrl}/validate`, { source: entity })
            .then((response) => {
                if (!response || !response.data.exists) {
                    return ctx.reply('Yo bro. Please try another channel');
                }

                let source = response.data.source;
                let redis = new redisClient(process.env.REDIS_URL);

                redis.addSource(this.platform, source)
                    .then(() => {
                        ctx.reply('Awesome bro! Enjoy yourself', Markup
                            .keyboard(
                                [
                                    ['Add memes source'],
                                    ['Get current VK memes top 10'],
                                ]
                            )
                            .oneTime()
                            .resize()
                            .extra()
                        );
                        return ctx.flow.leave();
                    });
            })
            .catch((err) => {
                console.log(err);
                return ctx.reply('Yo bro. Please try another channel');
            });
    }
);

module.exports = addNewSource;