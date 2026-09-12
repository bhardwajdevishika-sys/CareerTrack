const mongoose = require("mongoose");

const NOTE_CATEGORIES = ["DSA", "SQL", "AI", "Interview", "Aptitude", "Career", "General"];

const noteSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },
        title: {
            type: String,
            required: true,
            trim: true
        },
        content: {
            type: String,
            default: ""
        },
        category: {
            type: String,
            enum: NOTE_CATEGORIES,
            default: "General"
        },
        tags: {
            type: [String],
            default: []
        },
        pinned: {
            type: Boolean,
            default: false
        }
    },
    { timestamps: true }
);

noteSchema.index({ user: 1, category: 1 });
noteSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model("Note", noteSchema);
module.exports.NOTE_CATEGORIES = NOTE_CATEGORIES;
