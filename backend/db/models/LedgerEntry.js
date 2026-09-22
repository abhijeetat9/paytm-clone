const mongoose = require('mongoose');

const LedgerEntrySchema = new mongoose.Schema({
    userID: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "User",
        index: true,
    },
    transactionId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        index: true,
    },
    amount: {
        type: mongoose.Schema.Types.Decimal128,
        required: true,
    },
    type: {
        type: String,
        enum: ['credit', 'debit'],
        required: true,
    },
},
    {timestamps: true}
);

module.exports = mongoose.model("LedgerEntry", LedgerEntrySchema);
