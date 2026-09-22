const express = require("express");
const zod = require('zod');
const crypto = require('crypto');

const useMiddleware = require("../middleware/auth");
const { Account } = require("../db/models");
const { checkForReplay, saveResult } = require("../services/idempotency");
const { executeTransfer } = require("../services/transferService");

const router = express.Router();

const transferSchema = zod.object({
    to: zod.string(),
    amount: zod.number().positive(),
});

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
    const requestHash = crypto.createHash("sha256").update(JSON.stringify(data)).digest("hex");
    
    const idempotencyKeyHeader = req.headers["idempotency-key"];
    const replay = await checkForReplay(req.userId, idempotencyKeyHeader, requestHash)
    if(replay.status === 'conflict')
    {
        return res.status(409).json({
            message: "Idempotency key already used with different request parameters",
        });
    }
    if(replay.status === 'replay')
    {
        return res.status(replay.responseStatus).json(replay.response);
    }
    if(replay.status === 'none')
    {
        const result = await executeTransfer(req.userId, to, amount);
        let status, body;
        if(result.ok) {
            status = 200;
            body = { message: "Successful transfer" };
        }else if (result.reason === 'insufficient balance'){
            status = 400;
            body = { message: "Insufficient balance" };
        }else if (result.reason === 'invalid account') {
            status = 400;
            body = { message: "Invalid account" };
        }else {
            status = 409;
            body = { message: "Transfer could not be completed, please try again" };
        }
        
        await saveResult(req.userId, idempotencyKeyHeader, requestHash, status, body);
        return res.status(status).json(body);
    }
});

module.exports = router;
