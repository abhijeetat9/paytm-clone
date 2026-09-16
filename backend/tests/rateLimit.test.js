const { startTestDb, stopTestDb } = require('./testSetup')
let app, request;

beforeAll(async () => {
    process.env.NODE_ENV = "test-rateLimit";
    await startTestDb();
    app = require("../app");
    request = require("supertest")(app);
});

afterAll(async () => {
    process.env.NODE_ENV = "test";
    await stopTestDb();
});

test("blocks /signin after exceeding the request limit", async () => {
    const attempt = () =>
        request.post("/api/v1/user/signin").send({
            username: "nobody",
            password: "wrong123"
        });
    const statuses = [];
    for(let i=0; i<12; i++) {
        statuses.push((await attempt()).status);
    }
    
    expect(statuses.slice(0,10)).not.toContain(429);
    expect(statuses.slice(10)).toContain(429);
});