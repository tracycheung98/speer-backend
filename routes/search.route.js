const express = require("express");
const router = express.Router();

const {
    getUser,
} = require("../controllers/user.controller");
const {
    searchNoteForUser,
} = require("../controllers/note.controller")
const { authenticateToken } = require("../middleware/auth")

router.use(authenticateToken);

const getCommonHandler = (res, message) => {
    return err => {
        console.log(err);
        return res.status(400).send({
            message: message,
        })
    }
}

router.get("", async (req, res) => {
    const user = await getUser(req.username);
    searchNoteForUser(user, req.query.q)
        .then(notes => {
            return res.status(200).send(notes);
        })
        .catch(getCommonHandler(res, "Note not found"));
})

module.exports = router;
