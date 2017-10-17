require('dotenv').load({ path: '.env' });

const FBConnector = require('./fb.js');
let instance = new FBConnector(
    process.env.APP_Id,
    process.env.SECRET_KEY,
    process.env.REDIS_URL,
    process.env.REDIS_CHANNEL,
    process.env.REQUEST_INTERVAL_MIN
);

instance.connect()
    .then(() => {
        setTimeout(() => {
            instance.launch();
        }, parseInt(process.env.START_TIMEOUT_MIN) * 60 * 1000);
    });