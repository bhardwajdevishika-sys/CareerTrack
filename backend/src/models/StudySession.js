const mongoose = require("mongoose");

const STUDY_CATEGORIES = ["DSA", "SQL", "Development", "Aptitude", "Interview", "Other"];

const studySessionSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
        category: { type: String, enum: STUDY_CATEGORIES, required: true },
        durationMinutes: { type: Number, required: true, min: 1 },
        date: { type: Date, default: Date.now },
        source: { type: String, enum: ["manual", "pomodoro"], default: "manual" },
        notes: { type: String, default: "" },
        xpAwarded: { type: Boolean, default: false }
    },
    { timestamps: true }
);

studySessionSchema.index({ user: 1, date: -1 });
studySessionSchema.index({ user: 1, category: 1 });

module.exports = mongoose.model("StudySession", studySessionSchema);
module.exports.STUDY_CATEGORIES = STUDY_CATEGORIES;
