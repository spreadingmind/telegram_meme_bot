# Telegram Meme Bot
Telegram bot that posts popular memes from different sources.
_A whole lot of memes_.

![img](https://cs5.pikabu.ru/images/previews_comm/2015-12_3/1450010981152156326.jpg)


Made in terms of BOTON Hackathon, by [Bekitzur](http://bekitzur.com/) team 

# Environment variables
## Global settings
- `BOT_TOKEN` - Telegram bot token
- `REDIS_URL` - Redis instance URL 
- `REDIS_CHANNEL` - Redis channel to post messages to
- `TELEGRAM_CHANNEL` - Telegram channel ID to post memes to 

## Facebook
- `APP_ID` - Facebook application id
- `SECRET_KEY` - secret key for Facebook appication
- `REDIS_URL` - Redis instance URL
- `REDIS_CHANNEL` - Redis channel to post messages to
- `REQUEST_INTERVAL_MIN` - API polling interval
- `START_TIMEOUT_MIN` - Worker start timeout
- `FACEBOOK_API_URI` -
- `CONNECTION_PREFIX` - redis cache prefix
- `PORT` - express server port

## Twitter
- `TWITTER_CONSUMER_KEY` - Twitter consumer key, can be obtained [here](https://apps.twitter.com)
- `TWITTER_CONSUMER_SECRET` - Twitter consumer secret, can be obtained [here](https://apps.twitter.com)
- `TWITTER_ACCESS_TOKEN_KEY` - Twitter access token key, can be obtained [here](https://apps.twitter.com)
- `TWITTER_ACCESS_TOKEN_SECRET` - Twitter access token secret, can be obtained [here](https://apps.twitter.com)
- `REDIS_URL` - Redis instance URL
- `REDIS_CHANNEL` - Redis channel to post messages to
- `REQUEST_INTERVAL_MIN` - API polling interval
- `START_TIMEOUT_MIN` - Worker start timeout

## Reddit

- `REDDIT_AGENT` - Reddit app name&version
- `REDDIT_CLIENT` - Reddit app id
- `REDDIT_SECRET`- Reddit app secret token
- `REDDIT_USER` - Your r/username
- `REDDIT_PASS` - Your r/pass   
- `REDIS_URL` - Redis instance URL 
- `REDIS_CHANNEL` - Redis channel to post messages to
- `REQUEST_INTERVAL_MIN` - API polling interval
- `START_TIMEOUT_MIN` - Worker start timeout

## Vkontakte

- `REDIS_URL` - Redis instance URL
- `REDIS_CHANNEL` - Redis channel to post messages to
- `REQUEST_INTERVAL_MIN` - API polling interval
- `START_TIMEOUT_MIN` - Worker start timeout
