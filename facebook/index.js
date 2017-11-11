require('dotenv').load({ path: '.env' });

const bodyParser = require('body-parser');
const app = require('express')();
const FBConnector = require('./fb.js');
const redisWorker = require('../tools/redisWorker');

const stringToNumber = require('../tools/stringToNumber');
const redis = new redisWorker(process.env.REDIS_URL, stringToNumber(process.env.REDIS_TTL) || 24);

const options = {
    appId: process.env.APP_Id,
    appSecret: process.env.SECRET_KEY,
    conPrefix: process.env.CONNECTION_PREFIX,
    conChannel: process.env.REDIS_CHANNEL,
    fetchInterval: process.env.REQUEST_INTERVAL_MIN,
};

const instance = new FBConnector(options, redis);

instance.connect().then(() => {
    setTimeout(() => {
        instance.launch();
    }, parseInt(process.env.START_TIMEOUT_MIN, 10) * 60 * 1000);

    app.use(bodyParser.json());
    app.use('/validate', (req, res) => {
        if (!req || !req.body || !req.body.source) {
            return res.status(400).json({ message: 'Enter data is not valid' }).end();
        }

        instance.validate(req.body.source)
            .then((result) => {
                let responseData = {
                    exists: result,
                    source: null,
                };

                if (result) {
                    responseData.source = req.body.source;
                }

                res.json(responseData).end();
            });
    });

    app.listen(process.env.PORT, () => {
        console.log(`Facebook Web App ${process.env.PORT}`);
    });
});
