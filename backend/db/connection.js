const mongoose = require('mongoose');
require('dotenv').config();

function connectDB() {
    return mongoose.connect(process.env.MONGO_URL);
}

module.exports = connectDB;
