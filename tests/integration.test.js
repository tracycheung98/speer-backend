const request = require("supertest");
const { setupDB } = require('./db')
const jwt = require('jsonwebtoken');

const app = require("../app");
const { createUser } = require("../controllers/user.controller");
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
const TOKEN_2 = jwt.sign(
    { username: USERNAME_2 },
    process.env.TOKEN_SECRET,
    { expiresIn: '1h' })
let user;
let user2;
let note1, note2;

setupDB("integration-test");

describe("Signup and Login", () => {
    it("Signup and login with correct password", async () => {
        const signupRes = await request(app).post("/api/auth/signup")
            .send({
                username: USERNAME,
                password: PASSWORD,
            })
            .expect(200);

        const loginRes = await request(app).post("/api/auth/login")
            .send({
                username: USERNAME,
                password: PASSWORD,
            })
            .expect(200);
        expect(loginRes.body.message).toBe("Token expires in 1h");
        jwt.verify(loginRes.body.token, process.env.TOKEN_SECRET, (err, payload) => {
            expect(err).toBeFalsy();
            expect(payload.username).toBe(USERNAME);
        });
    })

    it("Signup and login with incorrect password", async () => {
        const signupRes = await request(app).post("/api/auth/signup")
            .send({
                username: USERNAME,
                password: PASSWORD,
            })
            .expect(200);

        const loginRes = await request(app).post("/api/auth/login")
            .send({
                username: USERNAME,
                password: "2132",
            })
            .expect(400);
    });
});

const createNoteWithRequest = async (content, token) => {
    const res = await request(app)
        .post("/api/notes")
        .send({
            content: content
        })
        .set("Authorization", `Bearer ${token}`);
    return res.body;
}

describe("Notes CRUD and search", () => {
    beforeEach(async () => {
        user = await createUser(USERNAME, PASSWORD);
        user2 = await createUser(USERNAME_2, PASSWORD);
        note1 = await createNoteWithRequest(CONTENT_1, TOKEN);
        note2 = await createNoteWithRequest(CONTENT_2, TOKEN_2);
    })

    it("get user's note", async () => {
        const res = await request(app)
            .get("/api/notes/" + note1._id)
            .set("Authorization", `Bearer ${TOKEN}`)
            .expect(200);

        expect(res.body.content).toBe(CONTENT_1);
        expect(res.body.isPublic).toBeFalsy();
        expect(res.body.owner).toBe(user._id.toString());
    });

    it("get unauthroized note", async () => {
        const res = await request(app)
            .get("/api/notes/" + note2._id)
            .set("Authorization", `Bearer ${TOKEN}`)
            .expect(400);
    });

    it("share and get note", async () => {
        const shareRes = await request(app)
            .post(`/api/notes/${note2._id}/share`)
            .set("Authorization", `Bearer ${TOKEN_2}`)
            .expect(200);

        const res = await request(app)
            .get("/api/notes/" + note2._id)
            .set("Authorization", `Bearer ${TOKEN}`)
            .expect(200);

        expect(res.body.content).toBe(CONTENT_2);
    });

    it("get all note", async () => {
        const res = await request(app)
            .get("/api/notes")
            .set("Authorization", `Bearer ${TOKEN}`)
            .expect(200);

        expect(res.body.length).toBe(1);
    });

    it("share and get all note include public notes", async () => {
        const shareRes = await request(app)
            .post(`/api/notes/${note2._id}/share`)
            .set("Authorization", `Bearer ${TOKEN_2}`)
            .expect(200);

        const res = await request(app)
            .get("/api/notes")
            .set("Authorization", `Bearer ${TOKEN}`)
            .expect(200);

        expect(res.body.length).toBe(2);
    });

    it("update", async () => {
        const updateRes = await request(app)
            .put(`/api/notes/${note1._id}`)
            .send(
                { content: CONTENT_3 }
            )
            .set("Authorization", `Bearer ${TOKEN}`)
            .expect(200);

        const res = await request(app)
            .get(`/api/notes/${note1._id}`)
            .set("Authorization", `Bearer ${TOKEN}`)
            .expect(200);

        expect(res.body.content).toBe(CONTENT_3);
    });

    it("update other user's note fail", async () => {
        const updateRes = await request(app)
            .put(`/api/notes/${note2._id}`)
            .send(
                { content: CONTENT_3 }
            )
            .set("Authorization", `Bearer ${TOKEN}`)
            .expect(400);
    });

    it("delete", async () => {
        const deleteRes = await request(app)
            .delete(`/api/notes/${note1._id}`)
            .set("Authorization", `Bearer ${TOKEN}`)
            .expect(200);

        const res = await request(app)
            .get(`/api/notes/${note1._id}`)
            .set("Authorization", `Bearer ${TOKEN}`)
            .expect(400);
    });

    it("delete other user's note fail", async () => {
        const deleteRes = await request(app)
            .delete(`/api/notes/${note2._id}`)
            .set("Authorization", `Bearer ${TOKEN}`)
            .expect(400);
    });

    it("search user's note with keyword", async () => {
        const res = await request(app)
            .get("/api/search")
            .query({ q: QUERY })
            .set("Authorization", `Bearer ${TOKEN}`)
            .expect(200);

        const returned_id = res.body.map(notes => notes._id);
        expect(returned_id).toContain(note1._id.toString());
        expect(returned_id).not.toContain(note2._id.toString());
    });

    it("share note, search notes with keyword", async () => {
        const shareRes = await request(app)
            .post(`/api/notes/${note2._id}/share`)
            .set("Authorization", `Bearer ${TOKEN_2}`)
            .expect(200);

        const res = await request(app)
            .get("/api/search")
            .query({ q: QUERY })
            .set("Authorization", `Bearer ${TOKEN}`)
            .expect(200);

        const returned_id = res.body.map(notes => notes._id);
        expect(returned_id).toContain(note1._id.toString());
        expect(returned_id).toContain(note2._id.toString());
    });
});
