const jwt = require("jsonwebtoken");
const { startTestDb, stopTestDb } = require("./testSetup");

let app, request, User;

beforeAll(async () => {
    await startTestDb();
    app = require("../app");
    request = require("supertest")(app);
    ({ User } = require("../db/models"));
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

describe("POST /api/v1/user/refresh", () => {
    let refreshToken;
    
    beforeEach(async () => {
        const res = await request.post("/api/v1/user/signup").send({
            username: "refreshuser",
            password: "password123",
            firstName: "Refresh",
            lastName: "User",
        });
        refreshToken = res.body.refreshToken;
    });
    
    test("issues a new access token for a valid refresh token", async () => {
        const res = await request.post("/api/v1/user/refresh").send({
            refreshToken,
        })
        expect(res.status).toBe(200);
        expect(res.body.token).toBeTruthy();
        expect(res.body.refreshToken).toBeTruthy();
    });
    
    test("rejects reuse of a rotated refresh token", async () => {
        const res1 = await request.post("/api/v1/user/refresh").send({
            refreshToken,
        })
        const res2 = await request.post("/api/v1/user/refresh").send({
            refreshToken,
        })
        expect(res2.status).toBe(401);
    });
    
    test("rejects a missing refresh token", async () => {
        const res = await request.post("/api/v1/user/refresh").send({ });
        expect(res.status).toBe(401);
    });
    
    test("rejects a garbage/unknown refresh token", async () => {
        const res = await request.post("/api/v1/user/refresh").send({
            refreshToken: "not-a-real-token",
        });
        expect(res.status).toBe(401);
    });
});

describe("POST /api/v1/user/logout", () => {
    let refreshToken;
    
    beforeEach(async () => {
        const res = await request.post("/api/v1/user/signup").send({
            username: "refreshuser",
            password: "password123",
            firstName: "Refresh",
            lastName: "User",
        });
        refreshToken = res.body.refreshToken;
    });
        test("revokes the refresh token so it can no longer be used", async () => {
            await request.post("/api/v1/user/logout").send({refreshToken});

            const res = await request.post("/api/v1/user/refresh").send({
                refreshToken });
            expect(res.status).toBe(401);
        });
});

describe("GET /api/v1/user/bulk pagination", () => {
    let token;
    
    beforeEach(async () => {
        await User.deleteMany({});
        const res = await request.post("/api/v1/user/signup").send({
            username: "searcher",
            password: "password123",
            firstName: "Search",
            lastName: "Er",
        });
        token = res.body.token;
        
        for (let i = 0; i < 12; i++)
        {
            await User.create({
                username: `bulkUser${i}`,
                password: `bulkPassword${i}`,
                firstName: `bulkFirstName${i}`,
                lastName: `bulkLastName${i}`,
            });
        }
    });
    
    test("defaults to page 1 with a limit of 10", async () => {
        const res = await request.get("/api/v1/user/bulk").set("Authorization", `Bearer ${token}`);
        expect(res.body.users.length).toBe(10);
        expect(res.body.pagination.page).toBe(1);
    });
    
    test("returns to requested page", async () => {
        const res = await request.get("/api/v1/user/bulk?page=2&limit=5").set("Authorization", `Bearer ${token}`);
        expect(res.body.users.length).toBe(5);
        expect(res.body.pagination.page).toBe(2);
    });
    
    test("returns correct total and totalPages", async () => {
        const res = await request.get("/api/v1/user/bulk?limit=3").set("Authorization", `Bearer ${token}`);
        expect(res.body.pagination.total).toEqual(13);
        expect(res.body.pagination.totalPages).toEqual(Math.ceil(13 / 3));
    });
    
    test("returns an empty array for a page beyond the last page", async () => {
        const res = await request.get("/api/v1/user/bulk?page=999").set("Authorization", `Bearer ${token}`);
        expect(res.body.users).toEqual([]);
    });
});
   