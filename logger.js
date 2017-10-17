const winston = require('winston');
const fs = require('fs');
const path = require('path');

// Ensure logs directory exists
const logsDir = process.env.LOGS_DIR;

if (logsDir) {
    const sep = path.sep;
    const initDir = path.isAbsolute(logsDir) ? sep : '';
    logsDir.split(sep).reduce((parentDir, childDir) => {
        const curDir = path.resolve(parentDir, childDir);
        if (!fs.existsSync(curDir)) {
            fs.mkdirSync(curDir);
        }

        return curDir;
    }, initDir);
}

const loggerTransports = [
    new winston.transports.Console({
        level: 'debug',
        handleExceptions: true,
        json: false,
        colorize: true
    })
];

if (logsDir) {
    loggerTransports.push(new winston.transports.File({
        level: 'info',
        filename: `${process.env.LOGS_DIR}${path.sep}all.log`,
        handleExceptions: true,
        json: true,
        maxsize: 5242880, // 5MB
        maxFiles: 5,
        colorize: true
    }));
}

winston.emitErrs = true;
const logger = new winston.Logger({
    transports: loggerTransports,
    exitOnError: false
});

module.exports = logger;

module.exports.stream = {
    write: function (message, encoding) {
        logger.info(message);
    }
};