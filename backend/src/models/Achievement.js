const mongoose = require("mongoose");

// Static achievement definitions — seeded once, referenced by slug
const achievementSchema = new mongoose.Schema(
    {
        slug: { type: String, required: true, unique: true },
        title: { type: String, required: true },
        description: { type: String, required: true },
        icon: { type: String, default: "🏆" },
        category: {
            type: String,
            enum: ["dsa", "sql", "streak", "study", "goals", "tasks", "general"],
            required: true
        },
        xpReward: { type: Number, default: 0 },
        condition: {
            metric: { type: String, required: true },
            threshold: { type: Number, required: true }
        }
    },
    { timestamps: true }
);

// Per-user achievement unlock records
const userAchievementSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
        achievement: { type: mongoose.Schema.Types.ObjectId, ref: "Achievement", required: true },
        unlockedAt: { type: Date, default: Date.now }
    },
    { timestamps: true }
);

userAchievementSchema.index({ user: 1, achievement: 1 }, { unique: true });

const Achievement = mongoose.model("Achievement", achievementSchema);
const UserAchievement = mongoose.model("UserAchievement", userAchievementSchema);

module.exports = { Achievement, UserAchievement };
