const { MongoMemoryReplSet } = require("mongodb-memory-server");
const connectDB = require("../db/connection");

let mongoServer;

async function startTestDb() {
    mongoServer = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
    process.env.MONGO_URL = mongoServer.getUri();

    process.env.JWT_SECRET = "test-secret-do-not-use-in-prod";
    process.env.JWT_EXPIRES_IN = "1h";
    process.env.CORS_ORIGIN = "";
    
    await connectDB();
}

async function stopTestDb() {
    const mongoose = require("mongoose");
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    if (mongoServer) await mongoServer.stop();
}

module.exports = { startTestDb, stopTestDb };
