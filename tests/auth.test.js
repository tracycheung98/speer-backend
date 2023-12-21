const request = require("supertest");
const db = require('./db')

const app = require("../app");
const User = require("../models/user.model");

const USERNAME = "Alice";
const PASSWORD = "1234";

beforeAll(async () => await db.connect())

afterEach(async () => await db.cleanupDatabase())

afterAll(async () => await db.closeDatabase())

describe("POST /api/auth/signup", () => {
    it("should create user", async () => {
        const res = await request(app).post("/api/auth/signup")
            .send({
                username: USERNAME,
                password: PASSWORD,
            });
        expect(res.statusCode).toBe(200);
        expect(res.body).toMatchObject({ message: "User added successfully." });
        const user = await User.findOne({ username: USERNAME });
        expect(user.username).toBe(USERNAME);
        expect(user.isPasswordValid(PASSWORD)).toBeTruthy();
    });
    
    it("should not create user with same username", async () => {
        const res = await request(app).post("/api/auth/signup")
            .send({
                username: USERNAME,
                password: PASSWORD,
            });
        expect(res.statusCode).toBe(200);
        expect(res.body).toMatchObject({ message: "User added successfully." });
        const res2 = await request(app).post("/api/auth/signup")
            .send({
                username: USERNAME,
                password: PASSWORD,
            });
        expect(res2.statusCode).toBe(400);
    });

    it("should not create user without password", async () => {
        const res = await request(app).post("/api/auth/signup")
            .send({
                username: USERNAME,
                password: "",
            });
        expect(res.statusCode).toBe(400);
    });
});

describe("isPasswordValid", () => {
    it("should return true with correct password", async () => {
        const user = new User()
        user.setPassword(PASSWORD)
        expect(user.isPasswordValid(PASSWORD)).toBeTruthy();
    });

    it("should return false with incorrect password", async () => {
        const user = new User()
        user.setPassword(PASSWORD)
        expect(user.isPasswordValid("1237")).toBeFalsy();
    });
});
