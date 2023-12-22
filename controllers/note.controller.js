const User = require("../models/user.model");
const Note = require("../models/note.model");

const getNotesForUser = async (user) => {
    return Note.find({
        $or: [
            { owner: user._id },
            { isPublic: true }]
    })
}

const getNote = async (noteId) => {
    return Note.findById(noteId);
}

const createNote = async (content, user) => {
    let note = new Note();
    note.content = content;
    note.owner = user._id;
    return note.save();
}

const deleteNote = async (noteId) => {
    return Note.findByIdAndDelete(noteId);
}

const updateNoteContent = async (noteId, newContent) => {
    return Note.findByIdAndUpdate(noteId, { content: newContent });
}

const shareNote = async (noteId) => {
    return Note.findByIdAndUpdate(noteId, { isPublic: true });
}

const searchNoteForUser = async (user, keyword) => {
    return Note.find(
        {
            $and: [
                { content: { $regex: keyword } },
                {
                    $or: [
                        { owner: user._id },
                        { isPublic: true }]
                }
            ]
        }
    )
}

module.exports = {
    getNotesForUser,
    getNote,
    createNote,
    deleteNote,
    updateNoteContent,
    shareNote,
    searchNoteForUser,
}
