const { startTestDb, stopTestDb } = require("./testSetup");

let app, request, User, Account;

beforeAll(async () => {
    await startTestDb();
    app = require("../app");
    request = require("supertest")(app);
    ({ User, Account } = require("../db"));
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
});
