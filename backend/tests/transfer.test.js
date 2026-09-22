const { startTestDb, stopTestDb } = require("./testSetup");
let app, request, User, Account, LedgerEntry;

beforeAll(async () => {
    await startTestDb();
    app = require("../app");
    request = require("supertest")(app);
    ({ User, Account, LedgerEntry } = require("../db/models"));
});

afterAll(async () => {
    await stopTestDb();
});

async function signupAndGetToken(username) {
    const res = await request.post("/api/v1/user/signup").send({
        username,
        password: "password123",
        firstName: "Test",
        lastName: "User",
    });
    const user = await User.findOne({ username });
    return { token: res.body.token, userId: user._id.toString() };
}

describe("POST /api/v1/account/transfer", () => {
    let alice, bob;

    beforeEach(async () => {
        await User.deleteMany({});
        await Account.deleteMany({});
        alice = await signupAndGetToken("alice");
        bob = await signupAndGetToken("bob");
        
        await Account.updateOne({ userID: alice.userId }, { balance: 1000 });
        await Account.updateOne({ userID: bob.userId }, { balance: 1000 });
    });
    test("rejects a negative transfer amount and leaves balances untouched", async () => {
        const res = await request
            .post("/api/v1/account/transfer")
            .set("Authorization", `Bearer ${alice.token}`)
            .send({ to: bob.userId, amount: -500 });

        expect(res.status).toBe(411);

        const aliceAccount = await Account.findOne({ userID: alice.userId });
        const bobAccount = await Account.findOne({ userID: bob.userId });
        expect(parseFloat(aliceAccount.balance.toString())).toBe(1000);
        expect(parseFloat(bobAccount.balance.toString())).toBe(1000);
    });
    
    test("does not allow two simultaneous transfers to overdraw the sender's balance", async () => {
        
        const [res1, res2] = await Promise.all([
            request.post("/api/v1/account/transfer")
                .set("Authorization", `Bearer ${alice.token}`)
                .send({to: bob.userId, amount: 600}),
            request.post("/api/v1/account/transfer")
                .set("Authorization", `Bearer ${alice.token}`)
                .send({to: bob.userId, amount: 600})
        ]);
        
        const statuses = [res1.status, res2.status];
        
        expect(statuses).toContain(200);
        expect(statuses.some(status => status === 400 || status === 409)).toBe(true);
        
        const count200 = statuses.filter(s => s === 200).length;
        expect(count200).toBe(1);
        
        const finalAlice = await Account.findOne({userID: alice.userId});
        const finalBob = await Account.findOne({userID: bob.userId});
        
        expect(parseFloat(finalAlice.balance.toString())).toBe(400);
        expect(parseFloat(finalBob.balance.toString())).toBe(1600);
    });

    test("rejects a zero transfer amount", async () => {
        const res = await request
            .post("/api/v1/account/transfer")
            .set("Authorization", `Bearer ${alice.token}`)
            .send({ to: bob.userId, amount: 0 });

        expect(res.status).toBe(411);
    });

    test("moves money between accounts on a valid transfer", async () => {
        const res = await request
            .post("/api/v1/account/transfer")
            .set("Authorization", `Bearer ${alice.token}`)
            .send({ to: bob.userId, amount: 200 });

        expect(res.status).toBe(200);

        const aliceAccount = await Account.findOne({ userID: alice.userId });
        const bobAccount = await Account.findOne({ userID: bob.userId });
        expect(parseFloat(aliceAccount.balance.toString())).toBe(800);
        expect(parseFloat(bobAccount.balance.toString())).toBe(1200);
    });

    test("rejects a transfer larger than the sender's balance", async () => {
        const res = await request
            .post("/api/v1/account/transfer")
            .set("Authorization", `Bearer ${alice.token}`)
            .send({ to: bob.userId, amount: 5000 });

        expect(res.status).toBe(400);

        const aliceAccount = await Account.findOne({ userID: alice.userId });
        expect(parseFloat(aliceAccount.balance.toString())).toBe(1000);
    });

    test("rejects a transfer with no auth token", async () => {
        const res = await request
            .post("/api/v1/account/transfer")
            .send({ to: bob.userId, amount: 100 });

        expect(res.status).toBe(403);
    });

    test("replays the same response for a duplicate request with the same idempotency key", async () => {
        const key = "test-key-1";

        const res1 = await request
            .post("/api/v1/account/transfer")
            .set("Authorization", `Bearer ${alice.token}`)
            .set("Idempotency-Key", key)
            .send({ to: bob.userId, amount: 300 });

        const res2 = await request
            .post("/api/v1/account/transfer")
            .set("Authorization", `Bearer ${alice.token}`)
            .set("Idempotency-Key", key)
            .send({ to: bob.userId, amount: 300 });

        expect(res2.status).toBe(res1.status);
        expect(res2.body).toEqual(res1.body);
        
        const finalAlice = await Account.findOne({userID: alice.userId});
        expect(parseFloat(finalAlice.balance.toString())).toBe(700);
    });
    
    test("different data same idempotency key", async () => {
        
        const key = "test-key-2";
        
        const res1 = await request
            .post("/api/v1/account/transfer")
            .set("Authorization", `Bearer ${alice.token}`)
            .set("Idempotency-Key", key)
            .send({ to: bob.userId, amount: 300 });

        const res2 = await request
            .post("/api/v1/account/transfer")
            .set("Authorization", `Bearer ${alice.token}`)
            .set("Idempotency-Key", key)
            .send({ to: bob.userId, amount: 500 });

        expect(res2.status).toBe(409);
        expect(res2.body).toEqual({ message: "Idempotency key already used with different request parameters"  });
        
        const finalAlice = await Account.findOne({userID: alice.userId});
        expect(parseFloat(finalAlice.balance.toString())).toBe(700);
    });
    
    test("records a matching debit and credit ledger entry for a transfer", async () => {
        const res = await request
            .post("/api/v1/account/transfer")
            .set("Authorization", `Bearer ${alice.token}`)
            .send({ to: bob.userId, amount: 300 });
        
        const transaction1 = await LedgerEntry.find({ userID: alice.userId});
        expect(transaction1[0].type).toBe('debit');
        expect(parseFloat(transaction1[0].amount.toString())).toBe(300);
        
        const transaction2 = await LedgerEntry.find({userID: bob.userId })
        expect(transaction2[0].type).toBe('credit');
        expect(parseFloat(transaction2[0].amount.toString())).toBe(300);
        
        expect(transaction1.length).toBe(1);
        expect(transaction2.length).toBe(1);
        expect(transaction1[0].transactionId).toEqual(transaction2[0].transactionId);
    })
});
