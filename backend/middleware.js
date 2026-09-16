const { JWT_SECRET } = require('./config');
const jwt = require('jsonwebtoken');

const useMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(403).json({});
    }

    const token = authHeader.split('Bearer ')[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded.userId) {
            req.userId = decoded.userId;
            next();
        } else {
            res.status(403).json({ msg: 'Authentication failed' });
        }
    } catch (error) {
        res.status(403).json({ msg: 'Incorrect input' });
    }
};

module.exports = useMiddleware;
