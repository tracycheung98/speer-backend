const express = require("express");
const router = express.Router();

const {
    getUser,
} = require("../controllers/user.controller");
const {
    getNotesForUser,
    getNote,
    createNote,
    deleteNote,
    updateNoteContent,
    shareNote,
} = require("../controllers/note.controller")
const { authenticateToken } = require("../middleware/auth")

router.use(authenticateToken);

const getCommonHandler = (res, message) => {
    return err => {
        // console.log(err);
        return res.status(400).send({
            message: message,
        })
    }
}

router.get("", async (req, res) => {
    const user = await getUser(req.username);
    getNotesForUser(user)
        .then(notes => {
            return res.status(200).send(notes);
        })
        .catch(getCommonHandler(res, "Note not found"));
})

router.get("/:id", (req, res) => {
    getNote(req.params.id)
        .then(note => {
            return res.status(200).send(note);
        })
        .catch(getCommonHandler(res, "Note not found"));
})

router.post("", async (req, res) => {
    const user = await getUser(req.username);
    createNote(req.body.content, user)
        .then(notes => {
            return res.status(200).send(notes);
        })
        .catch(getCommonHandler(res, "Cannot create note"));
})

router.put("/:id", async (req, res) => {
    const user = await getUser(req.username);
    try {
        var note = await getNote(req.params.id);
    } catch (err) {
        return res.status(400).send({
            message: `Cannot find note with id: ${req.params.id}`
        });
    }
    if (!note.owner.equals(user._id)) {
        return res.status(400).send({
            message: "User does not own the note"
        });
    }
    if (!req.body.content) {
        return res.status(400).send({
            message: "Missing content"
        });
    }
    updateNoteContent(req.params.id, req.body.content)
        .then(notes => {
            return res.status(200).send(notes);
        })
        .catch(getCommonHandler(res, "Cannot update note"));
})

router.delete("/:id", async (req, res) => {
    const user = await getUser(req.username);
    try {
        var note = await getNote(req.params.id);
    } catch (err) {
        return res.status(400).send({
            message: `Cannot find note with id: ${req.params.id}`
        });
    }
    if (!note.owner.equals(user._id)) {
        return res.status(400).send({
            message: "User does not own the note"
        });
    }
    deleteNote(req.params.id)
        .then(notes => {
            return res.status(200).send({ message: "Deleted note sucessfully" });
        })
        .catch(getCommonHandler(res, "Cannot delete note"));
})

router.post("/:id/share", async (req, res) => {
    const user = await getUser(req.username);
    try {
        var note = await getNote(req.params.id);
    } catch (err) {
        return res.status(400).send({
            message: `Cannot find note with id: ${req.params.id}`
        });
    }
    if (!note.owner.equals(user._id)) {
        return res.status(400).send({
            message: "User does not own the note"
        });
    }
    shareNote(req.params.id)
        .then(notes => {
            return res.status(200).send({ message: "Shared note sucessfully" });
        })
        .catch(getCommonHandler(res, "Cannot share note"));
})

module.exports = router;
