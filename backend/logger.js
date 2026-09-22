const pino = require('pino');

const isTest = process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID !== undefined;
const logger = pino({
    level: isTest ? 'silent' : 'info',
    redact: {
        paths: [
            "req.headers.authorization", 
            "req.headers.token", 
            "req.body.password", 
            "req.body.*.password",
            "req.body.token",
            "req.body.refreshToken",
            'req.headers["x-api-key"]'
        ],
        censor: `[REDACTED]`,
    },
});

module.exports = logger;