const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema({
    userID: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "User",
    },
    balance: {
        type: mongoose.Schema.Types.Decimal128,
        required: true,
    }
},
    {timestamps: true}
);

module.exports = mongoose.model("Account", accountSchema);
