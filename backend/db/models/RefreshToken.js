const mongoose = require('mongoose');

const RefreshTokenSchema = new mongoose.Schema({
    userID: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "User",
        index: true,
    },
    tokenHash: {
        type: String,
        required: true,
    },
    expiresAt: {
        type: Date,
        required: true,
    },
    revoked: {
        type: Boolean,
        default: false,
    }
},
    {timestamps: true}
);

module.exports = mongoose.model("RefreshToken", RefreshTokenSchema);
