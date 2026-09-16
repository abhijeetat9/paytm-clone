const mongoose = require("mongoose");
const express = require("express");
const zod = require('zod');
const useMiddleware = require("../middleware");
const { Account } = require("../db");

const router = express.Router();

const transferSchema = zod.object({
    to: zod.string(),
    amount: zod.number().positive(),
})
router.get("/balance", useMiddleware, async (req, res) => {
    const account = await Account.findOne({ userID: req.userId });
    res.json({ balance: parseFloat(account.balance.toString()) });
});

router.post("/transfer", useMiddleware, async (req, res) => {
    const {success, data } = transferSchema.safeParse(req.body);
    if(!success) {
        return res.status(411).json({
            message: "Invalid transfer request",
        })
    }

    const { amount, to } = data;
    
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const account = await Account.findOne({ userID: req.userId }).session(session);
        if (!account || parseFloat(account.balance.toString()) < amount) {
            await session.abortTransaction();
            return res.status(400).json({ message: "Insufficient balance" });
        }

        const toAccount = await Account.findOne({ userID: to }).session(session);
        if (!toAccount) {
            await session.abortTransaction();
            return res.status(400).json({ message: "Invalid account" });
        }

        await Account.updateOne({ userID: req.userId }, { $inc: { balance: -amount } }).session(session);
        await Account.updateOne({ userID: to }, { $inc: { balance: amount } }).session(session);

        await session.commitTransaction();
        res.json({ message: "Successfully transferred" });
    } finally {
        session.endSession();
    }
});

module.exports = router;
