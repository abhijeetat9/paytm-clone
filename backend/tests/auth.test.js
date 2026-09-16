const jwt = require("jsonwebtoken");
const { startTestDb, stopTestDb } = require("./testSetup");

let app, request, User;

beforeAll(async () => {
    await startTestDb();
    app = require("../app");
    request = require("supertest")(app);
    ({ User } = require("../db"));
});

afterAll(async () => {
    await stopTestDb();
});

beforeEach(async () => {
    await User.deleteMany({});
});

describe("POST /api/v1/user/signup", () => {
    test("creates a user and returns a signed, expiring token", async () => {
        const res = await request.post("/api/v1/user/signup").send({
            username: "newuser",
            password: "password123",
            firstName: "New",
            lastName: "User",
        });

        expect(res.status).toBe(200);
        expect(res.body.token).toBeTruthy();

        const decoded = jwt.decode(res.body.token);
        expect(decoded.userId).toBeTruthy();
        expect(decoded.exp).toBeTruthy();
        expect(decoded.exp).toBeGreaterThan(decoded.iat);
        jest.setTimeout(10000);
    });

    test("rejects a password shorter than the minimum length", async () => {
        const res = await request.post("/api/v1/user/signup").send({
            username: "shortpw",
            password: "abc",
            firstName: "Short",
            lastName: "Pw",
        });

        expect(res.status).toBe(411);
    });

    test("rejects a duplicate username", async () => {
        await request.post("/api/v1/user/signup").send({
            username: "dupeuser",
            password: "password123",
            firstName: "Dupe",
            lastName: "User",
        });

        const res = await request.post("/api/v1/user/signup").send({
            username: "dupeuser",
            password: "password123",
            firstName: "Dupe",
            lastName: "Again",
        });

        expect(res.status).toBe(411);
    });
});

describe("POST /api/v1/user/signin", () => {
    beforeEach(async () => {
        await request.post("/api/v1/user/signup").send({
            username: "signinuser",
            password: "correct-password",
            firstName: "Sign",
            lastName: "In",
        });
    });

    test("logs in with correct credentials", async () => {
        const res = await request.post("/api/v1/user/signin").send({
            username: "signinuser",
            password: "correct-password",
        });

        expect(res.status).toBe(200);
        expect(res.body.token).toBeTruthy();
        
    });

    test("rejects an incorrect password", async () => {
        const res = await request.post("/api/v1/user/signin").send({
            username: "signinuser",
            password: "wrong-password",
        });

        expect(res.status).toBe(411);
    });

    test("rejects a username that doesn't exist", async () => {
        const res = await request.post("/api/v1/user/signin").send({
            username: "nobody",
            password: "whatever",
        });

        expect(res.status).toBe(411);
    });
});

describe("GET /api/v1/user/bulk", () => {
    let token;

    beforeEach(async () => {
        const res = await request.post("/api/v1/user/signup").send({
            username: "searcher",
            password: "password123",
            firstName: "Search",
            lastName: "Er",
        });
        token = res.body.token;
    });

    test("rejects an unauthenticated request", async () => {
        const res = await request.get("/api/v1/user/bulk?filter=");
        expect(res.status).toBe(403);
    });

    test("returns users for an authenticated request", async () => {
        const res = await request
            .get("/api/v1/user/bulk?filter=")
            .set("Authorization", `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body.users)).toBe(true);
    });
});
