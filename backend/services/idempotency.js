const { IdempotencyKey } = require("../db/models");

async function checkForReplay(userID, key, requestHash){
    if(!key) {
        return { status: 'none'}
    }
    else {
        const existing = await IdempotencyKey.findOne({ userID, key});
        if(!existing) {
            return {status: 'none'};
        }
        
        if (existing.requestHash !== requestHash) {
            return {
                status: 'conflict',
            }
        }
        return { status: 'replay',
        responseStatus: existing.status,
        response: existing.response };
    }
}

async function saveResult(userID, key, requestHash, status, body){
    if (!key)
    {
        return { saved: false };
    }
    try {
        const creating = await IdempotencyKey.create({
            userID, key, requestHash, status, response: body
        })
        if (creating)
        {
            return { saved: true, status, response: body };
        }
    }catch (err){
        if(err.code !== 11000){
            return { saved: false };
        }

        const existing = await IdempotencyKey.findOne({ userID, key });
        if (!existing)
        {
            return { saved: false };
        }
        
        if (existing.requestHash !== requestHash){
            return { saved: false, conflict: true };
        }
        
        if (existing.requestHash === requestHash){
            return { saved: true, status: existing.status, response: existing.response };
        }
    }
}

module.exports = { checkForReplay, saveResult };