const mongoose = require('mongoose');

const IdempotencyKeySchema = new mongoose.Schema({
    userID: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "User",
    },
    key: {
        type: String,
        required: true,
        unique: true,
    },
    requestHash: {
        type: String,
        required: true,
    },
    status: {
        type: Number,
        required: true,
    },
    response: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    }
});

module.exports = mongoose.model("Key", IdempotencyKeySchema);
