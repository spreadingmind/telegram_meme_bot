# Telegram Meme Bot
A telegram bot that posts popular memes from different sources

# Environment variables
## Global settings
- `BOT_TOKEN` - telegram bot token
- `REDIS_URL` - redis url for caching memos
- `REDIS_CHANNEL` - redis channel for read memos
- `TELEGRAM_CHANNEL` - ID of telegram channel where bot is located

## Facebook
- `APP_ID` - Facebook application id
- `SECRET_KEY` - secret key for facebook appication.
- `REDIS_URL` - url for cache data and publish memos
- `REDIS_CHANNEL` - redis channel for publish memos
- `START_TIMEOUT_MIN` - timeout for starting application
- `REQUEST_INTERVAL_MIN` - interval for request new memos

## Twitter
- `TWITTER_CONSUMER_KEY` - Twitter consumer key, can be obtained [here](https://apps.twitter.com)
- `TWITTER_CONSUMER_SECRET` - Twitter consumer secret, can be obtained [here](https://apps.twitter.com)
- `TWITTER_ACCESS_TOKEN_KEY` - Twitter access token key, can be obtained [here](https://apps.twitter.com)
- `TWITTER_ACCESS_TOKEN_SECRET` - Twitter access token secret, can be obtained [here](https://apps.twitter.com)
- `REDIS_URL` - Redis instance URL
- `REDIS_CHANNEL` - Redis channel to post messages to
- `REQUEST_INTERVAL_MIN` - API polling interval
- `START_TIMEOUT_MIN` - Worker start timeout