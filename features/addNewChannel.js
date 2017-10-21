const Telegraf = require('telegraf');
const { Markup } = Telegraf;

const TelegrafFlow = require('telegraf-flow');
const { WizardScene } = TelegrafFlow;

const axios = require('axios');
const redisClient = require('../tools/redisWorker');

const addNewSource = new WizardScene('add-new-source',
    (ctx) => {
        ctx.reply('Please select platform...', Markup
            .keyboard([
                ['Twitter'],
                ['Facebook'],
                ['VK'],
                ['Reddit'],
            ])
            .oneTime()
            .resize()
            .extra()
        );
        return ctx.flow.wizard.next();
    },
    (ctx) => {
        if (ctx.message && ['facebook', 'vk', 'reddit', 'twitter'].indexOf(ctx.message.text.toLowerCase()) === -1) {
            return ctx.reply('Please select one of available platform.');
        } else {
            ctx.reply('Awesome bro! Please enter channel name');
        }
        this.platform = ctx.message.text.toLowerCase();
        return ctx.flow.wizard.next();
    },
    (ctx) => {
        let url = `http://127.0.0.1`;

        switch(this.platform) {
            case 'vk':
                url = `${url}:9003`;
                break;

            case 'facebook':
                url = process.env.FACEBOOK_API_URI;
                break;

            case 'reddit':
                url = `${url}:9001`;
                break;

            case 'twitter':
                url = `${url}:9002`;
                break;

            default:
                break;
        }

        axios.post(`${url}/validate`, { source: ctx.message.text })
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
            });
    }
);

module.exports = addNewSource;