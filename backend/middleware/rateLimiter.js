const rateLimiter = require('express-rate-limit');

const authLimiter = rateLimiter({
    windowMs: 5*60*1000,
    max: 10,
    message: 'Too many requests, you have reached the limit, try again in 5 mins',
    legacyHeaders: false,
    standardHeaders: true,
    skip: (req) => process.env.NODE_ENV === "test",
});

module.exports = authLimiter;