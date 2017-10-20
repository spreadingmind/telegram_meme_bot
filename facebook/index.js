require('dotenv').load({ path: '.env' });
const bodyParser = require('body-parser');

const express = require('express');
const app = express();

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

        app.use(bodyParser.json());
        app.post('/validate',(req, res) => {
            instance.validate(req.body.channel)
                .then((result) => {
                    let responseData = {
                        exists: result,
                        channel: null,
                    };

                    if (result) {
                        responseData.channel = req.body.channel;
                    }

                    res.json(responseData).end();
                });
        });

        app.listen(9000, () => {
            console.log('Facebook Web App 9000');
        })
    });