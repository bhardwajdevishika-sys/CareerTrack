const mongoose = require("mongoose");

// System-generated challenges (one per user per period)
const challengeSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
        type: { type: String, enum: ["daily", "weekly"], required: true },
        title: { type: String, required: true },
        description: { type: String },
        metric: {
            type: String,
            enum: ["dsa_solved", "sql_solved", "tasks_completed", "study_minutes", "goals_completed"],
            required: true
        },
        target: { type: Number, required: true },
        current: { type: Number, default: 0 },
        xpReward: { type: Number, default: 25 },
        coinReward: { type: Number, default: 10 },
        deadline: { type: Date, required: true },
        completed: { type: Boolean, default: false },
        completedAt: { type: Date },
        rewardClaimed: { type: Boolean, default: false }
    },
    { timestamps: true }
);

challengeSchema.index({ user: 1, type: 1, deadline: 1 });

module.exports = mongoose.model("Challenge", challengeSchema);
