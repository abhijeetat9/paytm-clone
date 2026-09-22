const mongoose = require('mongoose');
const { Account, LedgerEntry } = require('../db/models');
const logger = require('../logger');
async function executeTransfer(fromUserId, toUserId, amount){
    
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
        const account = await Account.findOne({userID: fromUserId}).session(session);
        if (!account || parseFloat(account.balance.toString()) < amount) {
            await session.abortTransaction();
            return {ok: false, reason: 'insufficient balance'};
        }

        const toAccount = await Account.findOne({userID: toUserId}).session(session);
        if (!toAccount) {
            await session.abortTransaction();
            return {ok: false, reason: 'invalid account'};
        }

        const transactionId = new mongoose.Types.ObjectId();
        await LedgerEntry.create([
            {userID: fromUserId, transactionId, amount, type: 'debit'},
            {userID: toUserId, transactionId, amount, type: 'credit'},
        ], {session, ordered: true});

        await Account.updateOne({userID: fromUserId}, {$inc: {balance: -amount}}).session(session);
        await Account.updateOne({userID: toUserId}, {$inc: {balance: amount}}).session(session);

        await session.commitTransaction();
        return {ok: true};
    }
    catch(err){
        logger.error({
            err,
            fromUserId,
            toUserId,
            amount,
        }, "Trasnfer failed");
        
        try{
            await session.abortTransaction();
        }catch(abortErr){
            if(abortErr.name === "AbortError" || abortErr.message.includes("aborted")) {
                logger.error({
                    err: abortErr,
                    fromUserId,
                    toUserId,
                    amount,
                }, "Failed to abort transaction after transfer error");
            }
            else{
                throw abortErr;
            }
        }
        return {ok: false, reason: 'transaction failed'};
        
    }finally {
        session.endSession();
    }
}

module.exports = { executeTransfer };