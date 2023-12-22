const request = require("supertest");
const db = require('./db')
const jwt = require('jsonwebtoken');

const app = require("../app");
const { createUser } = require("../controllers/user.controller");
const {
    createNote,
    shareNote,
} = require("../controllers/note.controller");
require("dotenv").config();

const USERNAME = "Bob";
const USERNAME_2 = "Alice";
const PASSWORD = "1234";
const CONTENT_1 = "Lorem ipsum dolor sit amet";
const CONTENT_2 = " consectetur adipiscing elsit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua";
const CONTENT_3 = "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.";
const QUERY = "sit"; // This is in CONTENT 1 and 2
const TOKEN = jwt.sign(
    { username: USERNAME },
    process.env.TOKEN_SECRET,
    { expiresIn: '1h' })
let user;
let user2;

beforeAll(async () => await db.connect("search-test"))

beforeEach(async () => {
    user = await createUser(USERNAME, PASSWORD);
    user2 = await createUser(USERNAME_2, PASSWORD);
})

afterEach(async () => await db.cleanupDatabase())

afterAll(async () => await db.closeDatabase())

describe("GET /search?q=:query", () => {
    let note1;
    let note2;
    let note3;
    beforeEach(async () => {
        note1 = await createNote(CONTENT_1, user);
        note2 = await createNote(CONTENT_2, user2);
        note3 = await createNote(CONTENT_3, user);
    })

    it("should return user's note with keyword", async () => {
        const res = await request(app)
            .get("/api/search")
            .query({ q: QUERY })
            .set("Authorization", `Bearer ${TOKEN}`);
    
        expect(res.statusCode).toBe(200);
        const returned_id = res.body.map(notes => notes._id);
        expect(returned_id).toContain(note1._id.toString());
        expect(returned_id).not.toContain(note2._id.toString());
        expect(returned_id).not.toContain(note3._id.toString());
    });

    it("should return nothing with 0 match keyword", async () => {
        const res = await request(app)
            .get("/api/search")
            .query({ q: 'gdksgkjgj' })
            .set("Authorization", `Bearer ${TOKEN}`);
    
        expect(res.statusCode).toBe(200);
        expect(res.body.length).toBe(0);
    });

    it("should return shared note with keyword", async () => {
        shareNote(note2._id);

        const res = await request(app)
            .get("/api/search")
            .query({ q: QUERY })
            .set("Authorization", `Bearer ${TOKEN}`);
    
        expect(res.statusCode).toBe(200);
        const returned_id = res.body.map(notes => notes._id);
        expect(returned_id).toContain(note1._id.toString());
        expect(returned_id).toContain(note2._id.toString());
        expect(returned_id).not.toContain(note3._id.toString());
    });
});
