const request = require("supertest");
const db = require('./db')
const jwt = require('jsonwebtoken');

const app = require("../app");
const User = require("../models/user.model");
const auth = require("../middleware/auth")
const { getUser, createUser } = require("../controllers/user.controller");

const USERNAME = "Alice";
const PASSWORD = "1234";
async function createTmpUser() {
    await createUser(USERNAME, PASSWORD)
}

beforeAll(async () => await db.connect("auth-test"))

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
        const user = await getUser(USERNAME);
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

describe("POST /api/auth/login", () => {
    it("should return valid JWT token", async () => {
        await createTmpUser();

        const res = await request(app).post("/api/auth/login")
            .send({
                username: USERNAME,
                password: PASSWORD,
            });
        expect(res.statusCode).toBe(200);
        expect(res.body.message).toBe("Token expires in 1h");
        jwt.verify(res.body.token, process.env.TOKEN_SECRET, (err, payload) => {
            expect(err).toBeFalsy();
            expect(payload.username).toBe(USERNAME);
        });
    });

    it("should return 400 with incorrect password", async () => {
        await createTmpUser();

        const res = await request(app).post("/api/auth/login")
            .send({
                username: USERNAME,
                password: "12332",
            });
        expect(res.statusCode).toBe(400);
        expect(res.body.message).toBe("Incorrect Password");
    });

    it("should return 400 when user is not found", async () => {
        const res = await request(app).post("/api/auth/login")
            .send({
                username: USERNAME,
                password: PASSWORD,
            });
        expect(res.statusCode).toBe(400);
        expect(res.body.message).toBe("User not found.");
    });
});

describe("authenticateToken", () => {
    let mockRequest;
    let mockResponse;
    let nextFunction = jest.fn();

    beforeEach(() => {
        mockRequest = {};
        mockResponse = { sendStatus: jest.fn() };
    });

    it("should verify valid token", async () => {
        await createTmpUser();
        const token = jwt.sign(
            { username: USERNAME },
            process.env.TOKEN_SECRET,
            { expiresIn: '1h' })
        mockRequest = {
            headers: {
                authorization: "Bearer " + token
            }
        }

        auth.authenticateToken(
            mockRequest,
            mockResponse,
            nextFunction
        );

        expect(mockRequest.username).toBe(USERNAME);
    })

    it("should return 403 for invalid token", async () => {
        await createTmpUser();
        const token = "hfsdahiaogioi"
        mockRequest = {
            headers: {
                authorization: "Bearer " + token
            }
        }

        auth.authenticateToken(
            mockRequest,
            mockResponse,
            nextFunction
        );

        expect(mockResponse.sendStatus).toBeCalledWith(403);
    })

    it("should return 401 without header", async () => {
        await createTmpUser();

        auth.authenticateToken(
            mockRequest,
            mockResponse,
            nextFunction
        );

        expect(mockResponse.sendStatus).toBeCalledWith(401);
    })

    it("should return 401 for null token", async () => {
        await createTmpUser();
        mockRequest = {
            headers: {
                authorization: "d"
            }
        }

        auth.authenticateToken(
            mockRequest,
            mockResponse,
            nextFunction
        );

        expect(mockResponse.sendStatus).toBeCalledWith(401);
    })
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
