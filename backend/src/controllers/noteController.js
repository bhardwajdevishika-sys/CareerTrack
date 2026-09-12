const Note = require("../models/Note");

const getNotes = async (req, res, next) => {
    try {
        const { category, search } = req.query;
        const filters = { user: req.user._id };
        if (category) filters.category = category;
        if (search) filters.$or = [
            { title: { $regex: search, $options: "i" } },
            { content: { $regex: search, $options: "i" } },
            { tags: { $regex: search, $options: "i" } }
        ];

        const notes = await Note.find(filters).sort({ pinned: -1, updatedAt: -1 });
        return res.json({ success: true, notes });
    } catch (error) { next(error); }
};

const createNote = async (req, res, next) => {
    try {
        const note = await Note.create({ ...req.body, user: req.user._id });
        return res.status(201).json({ success: true, message: "Note created", note });
    } catch (error) { next(error); }
};

const updateNote = async (req, res, next) => {
    try {
        const note = await Note.findOne({ _id: req.params.id, user: req.user._id });
        if (!note) return res.status(404).json({ success: false, message: "Note not found" });

        ["title", "content", "category", "tags", "pinned"].forEach((f) => {
            if (req.body[f] !== undefined) note[f] = req.body[f];
        });

        await note.save();
        return res.json({ success: true, message: "Note updated", note });
    } catch (error) { next(error); }
};

const deleteNote = async (req, res, next) => {
    try {
        const note = await Note.findOne({ _id: req.params.id, user: req.user._id });
        if (!note) return res.status(404).json({ success: false, message: "Note not found" });
        await note.deleteOne();
        return res.json({ success: true, message: "Note deleted" });
    } catch (error) { next(error); }
};

module.exports = { getNotes, createNote, updateNote, deleteNote };
