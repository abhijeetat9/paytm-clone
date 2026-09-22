require('dotenv').config();

module.exports = {
    JWT_SECRET: process.env.JWT_SECRET,
    ACCESS_TOKEN_EXPIRES_IN: process.env.JWT_EXPIRES_IN,
    REFRESH_TOKEN_EXPIRES_IN_DAYS: process.env.REFRESH_TOKEN_EXPIRES_IN_DAYS,
}
