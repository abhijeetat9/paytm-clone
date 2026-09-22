const crypto = require('crypto');

function hashPassword(password) {
    return new Promise((resolve, reject) => {
        const salt = crypto.randomBytes(16).toString('hex');
        crypto.scrypt(password, salt, 64, (err, derivedKey) => {
            if (err) return reject(err);
            resolve(`${salt}:${derivedKey.toString('hex')}`);
        });
    });
}

function verifyPassword(password, hash) {
    return new Promise((resolve, reject) => {
        const [salt, key] = hash.split(':');
        crypto.scrypt(password, salt, 64, (err, derivedKey) => {
            if (err) return reject(err);
            resolve(derivedKey.toString('hex') === key);
        });
    });
}

function generateRefreshToken() {
    return crypto.randomBytes(32).toString('hex');
}

function hashToken(token)
{
    return crypto.createHash('sha256').update(token).digest('hex');
}

module.exports = { hashPassword, verifyPassword, generateRefreshToken, hashToken };
