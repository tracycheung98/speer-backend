const request = require("supertest");
const db = require('./db')
const jwt = require('jsonwebtoken');
const express = require('express');

const app = require("../app");
const auth = require("../middleware/auth")
const { getUser, createUser } = require("../controllers/user.controller");
const {
    getNotesForUser,
    getNote,
    createNote,
    deleteNote,
    updateNoteContent,
    shareNote,
} = require("../controllers/note.controller");
const { get } = require("mongoose");
require("dotenv").config();

const USERNAME = "Bob";
const PASSWORD = "1234";
const CONTENT = "note content";
const TOKEN = jwt.sign(
    { username: USERNAME },
    process.env.TOKEN_SECRET,
    { expiresIn: '1h' })
let user;


beforeAll(async () => await db.connect("note-test"))

beforeEach(async () => {
    user = await createUser(USERNAME, PASSWORD);
})

afterEach(async () => await db.cleanupDatabase())

afterAll(async () => await db.closeDatabase())

describe("JWT middleware", () => {
    it("should return 401 with invalid token", async () => {
        let note = await createNote(CONTENT, user);

        const res = await request(app)
            .get("/api/notes/" + note._id)
            .set("Authorization", `Bearer HGJUADSHGUEH`);

        expect(res.statusCode).toBe(403);
    });
});

describe("GET /api/notes/:id", () => {
    it("should return note", async () => {
        let note = await createNote(CONTENT, user);

        const res = await request(app)
            .get("/api/notes/" + note._id)
            .set("Authorization", `Bearer ${TOKEN}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.content).toBe(CONTENT);
        expect(res.body.isPublic).toBeFalsy();
        expect(res.body.owner).toBe(user._id.toString());
    });

    it("should return 400 if note is not found", async () => {
        const res = await request(app)
            .get("/api/notes/qwu3uhfjkdsfjk")
            .set("Authorization", `Bearer ${TOKEN}`);

        expect(res.statusCode).toBe(400);
    });
});