const Telegraf = require('telegraf');
const { Markup } = Telegraf;

const keyboardSetup = Markup
    .keyboard([
        ['Add memes source'],
        ['Delete memes source'],
        ['Get current VK memes top 10'],
    ])
    .oneTime()
    .resize()
    .extra();

module.exports = keyboardSetup;
