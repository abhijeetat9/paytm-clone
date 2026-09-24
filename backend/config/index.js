require('dotenv').config();

module.exports = {
    get JWT_SECRET() { return process.env.JWT_SECRET; },
    get ACCESS_TOKEN_EXPIRES_IN() { return process.env.JWT_EXPIRES_IN; },
    get REFRESH_TOKEN_EXPIRES_IN_DAYS() { return process.env.REFRESH_TOKEN_EXPIRES_IN_DAYS; },
};