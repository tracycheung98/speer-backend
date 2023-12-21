const mongoose = require("mongoose");

const NoteSchema = mongoose.Schema({
    content: {
        type: String,
        required: true,
        index: true,
    },
    owner: {
        type: mongoose.Schema.ObjectId,
        ref: 'user'
    },
    isPublic: {
        type: Boolean,
        default: false
    }
});

const Note = (module.exports = mongoose.model("Note", NoteSchema));
