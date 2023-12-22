const request = require("supertest");
const db = require('./db')
const jwt = require('jsonwebtoken');
const express = require('express');

const app = require("../app");
const auth = require("../middleware/auth")
const { getUser, createUser } = require("../controllers/user.controller");
const Note = require("../models/note.model");
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
const USERNAME_2 = "Alice";
const PASSWORD = "1234";
const CONTENT_1 = "note content 1";
const CONTENT_2 = "note content 2";
const CONTENT_3 = "note content 3";
const TOKEN = jwt.sign(
    { username: USERNAME },
    process.env.TOKEN_SECRET,
    { expiresIn: '1h' })
let user;
let user2;


beforeAll(async () => await db.connect("note-test"))

beforeEach(async () => {
    user = await createUser(USERNAME, PASSWORD);
    user2 = await createUser(USERNAME_2, PASSWORD);
})

afterEach(async () => await db.cleanupDatabase())

afterAll(async () => await db.closeDatabase())

describe("JWT middleware", () => {
    it("should return 401 with invalid token", async () => {
        let note = await createNote(CONTENT_1, user);

        const res = await request(app)
            .get("/api/notes/" + note._id)
            .set("Authorization", `Bearer HGJUADSHGUEH`);

        expect(res.statusCode).toBe(403);
    });
});

describe("GET /api/notes", () => {
    let note1;
    let note2;
    let note3;
    beforeEach(async () => {
        note1 = await createNote(CONTENT_1, user);
        note2 = await createNote(CONTENT_2, user);
        note3 = await createNote(CONTENT_3, user2);
    })

    it("should return user's notes", async () => {
        const res = await request(app)
            .get("/api/notes")
            .set("Authorization", `Bearer ${TOKEN}`);

        expect(res.statusCode).toBe(200);
        const returned_id = res.body.map(notes => notes._id);
        expect(returned_id).toContain(note1._id.toString());
        expect(returned_id).toContain(note2._id.toString());
        expect(returned_id).not.toContain(note3._id.toString());
    });

    it("should return user's and public notes", async () => {
        note3.isPublic = true;
        await note3.save();

        const res = await request(app)
            .get("/api/notes")
            .set("Authorization", `Bearer ${TOKEN}`);

        expect(res.statusCode).toBe(200);
        const returned_id = res.body.map(notes => notes._id);
        expect(returned_id).toContain(note1._id.toString());
        expect(returned_id).toContain(note2._id.toString());
        expect(returned_id).toContain(note3._id.toString());
    });

    it("should return nothing when there is no note", async () => {
        await Note.deleteMany();

        const res = await request(app)
            .get("/api/notes")
            .set("Authorization", `Bearer ${TOKEN}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.length).toBe(0);
    });
});


describe("GET /api/notes/:id", () => {
    it("should return note", async () => {
        let note = await createNote(CONTENT_1, user);

        const res = await request(app)
            .get("/api/notes/" + note._id)
            .set("Authorization", `Bearer ${TOKEN}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.content).toBe(CONTENT_1);
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

describe("POST /api/notes", () => {
    it("should create note", async () => {
        const res = await request(app)
            .post("/api/notes")
            .send({
                content: CONTENT_1
            })
            .set("Authorization", `Bearer ${TOKEN}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.content).toBe(CONTENT_1);
        expect(res.body.isPublic).toBeFalsy();
        expect(res.body.owner).toBe(user._id.toString());
        let note = await getNote(res.body._id);
        expect(note.content).toBe(CONTENT_1);
        expect(note.isPublic).toBeFalsy();
        expect(note.owner.toString()).toBe(user._id.toString());
    });

    it("should return 400 if content is not found", async () => {
        const res = await request(app)
            .post("/api/notes")
            .set("Authorization", `Bearer ${TOKEN}`);

        expect(res.statusCode).toBe(400);
    });
});

describe("PUT /api/notes", () => {
    let note1;
    let note2;
    beforeEach(async () => {
        note1 = await createNote(CONTENT_1, user);
        note2 = await createNote(CONTENT_2, user2);
    })

    it("should update note", async () => {
        const res = await request(app)
            .put("/api/notes/" + note1._id)
            .send({
                content: CONTENT_3
            })
            .set("Authorization", `Bearer ${TOKEN}`);

        expect(res.statusCode).toBe(200);
        let note = await getNote(res.body._id);
        expect(note.content).toBe(CONTENT_3);
        expect(note.isPublic).toBeFalsy();
        expect(note.owner.toString()).toBe(user._id.toString());
    });

    it("should return 400 if content is not found", async () => {
        const res = await request(app)
            .put("/api/notes/" + note1._id)
            .set("Authorization", `Bearer ${TOKEN}`);

        expect(res.statusCode).toBe(400);
    });

    it("should return 400 if note is not found", async () => {
        const res = await request(app)
            .put("/api/notes/fsafsaf")
            .set("Authorization", `Bearer ${TOKEN}`);

        expect(res.statusCode).toBe(400);
    });

    it("should return 400 if user is not the owner", async () => {
        const res = await request(app)
            .put(`/api/notes/${note2._id}`)
            .set("Authorization", `Bearer ${TOKEN}`);

        expect(res.statusCode).toBe(400);
    });
});

describe("DELETE /api/notes", () => {
    let note1;
    let note2;
    beforeEach(async () => {
        note1 = await createNote(CONTENT_1, user);
        note2 = await createNote(CONTENT_2, user2);
    })

    it("should delete note", async () => {
        const res = await request(app)
            .delete(`/api/notes/${note1._id}`)
            .set("Authorization", `Bearer ${TOKEN}`);

        expect(res.statusCode).toBe(200);
        let note = await getNote(note1._id);
        expect(note).toBe(null);
    });

    it("should return 400 if note is not found", async () => {
        const res = await request(app)
            .delete("/api/notes/fsafsaf")
            .set("Authorization", `Bearer ${TOKEN}`);

        expect(res.statusCode).toBe(400);
    });

    it("should return 400 if user is not the owner", async () => {
        const res = await request(app)
            .delete(`/api/notes/${note2._id}`)
            .set("Authorization", `Bearer ${TOKEN}`);

        expect(res.statusCode).toBe(400);
    });
});

describe("POST /api/notes/:id/share", () => {
    let note1;
    let note2;
    beforeEach(async () => {
        note1 = await createNote(CONTENT_1, user);
        note2 = await createNote(CONTENT_2, user2);
    })

    it("should share note", async () => {
        const res = await request(app)
            .post(`/api/notes/${note1._id}/share`)
            .set("Authorization", `Bearer ${TOKEN}`);

        expect(res.statusCode).toBe(200);
        let note = await getNote(note1._id);
        expect(note.isPublic).toBeTruthy();
    });

    it("should return 400 if note is not found", async () => {
        const res = await request(app)
            .post("/api/notes/fsafsaf/share")
            .set("Authorization", `Bearer ${TOKEN}`);

        expect(res.statusCode).toBe(400);
    });

    it("should return 400 if user is not the owner", async () => {
        const res = await request(app)
            .post(`/api/notes/${note2._id}/share`)
            .set("Authorization", `Bearer ${TOKEN}`);

        expect(res.statusCode).toBe(400);
    });
});
