const mongoose = require("mongoose");

const XP_SOURCES = [
    "dsa_easy", "dsa_medium", "dsa_hard",
    "sql_easy", "sql_medium", "sql_hard",
    "task_complete", "daily_challenge", "weekly_challenge",
    "study_session", "goal_complete",
    "daily_checkin", "achievement_unlock",
    "game_complete", "streak_bonus"
];

const xpTransactionSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
        amount: { type: Number, required: true },
        source: { type: String, enum: XP_SOURCES, required: true },
        description: { type: String, required: true },
        refId: { type: String },   // ID of the source record (problem._id, task._id, etc.)
        refModel: { type: String } // e.g. "Problem", "Task"
    },
    { timestamps: true }
);

xpTransactionSchema.index({ user: 1, createdAt: -1 });
xpTransactionSchema.index({ user: 1, refId: 1, source: 1 });

module.exports = mongoose.model("XPTransaction", xpTransactionSchema);
module.exports.XP_SOURCES = XP_SOURCES;
