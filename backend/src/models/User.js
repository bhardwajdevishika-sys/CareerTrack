const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        // ── Identity ─────────────────────────────────────────────────────────
        name: { type: String, trim: true },
        email: { type: String, unique: true, lowercase: true, trim: true },
        password: String,
        role: { type: String, default: "student" },
        avatar: { type: String, default: "" },

        // ── Profile ───────────────────────────────────────────────────────────
        college: { type: String, default: "" },
        degree: { type: String, default: "" },
        graduationYear: { type: Number },
        targetRole: { type: String, default: "" },
        targetCompanies: { type: [String], default: [] },
        skills: { type: [String], default: [] },
        bio: { type: String, default: "" },

        // ── Study goal ────────────────────────────────────────────────────────
        dailyGoal: { type: Number, min: 1, default: 3 },
        dailyStudyGoalMinutes: { type: Number, min: 0, default: 60 },

        // ── Gamification ──────────────────────────────────────────────────────
        xp: { type: Number, default: 0, min: 0 },
        level: { type: Number, default: 1, min: 1 },
        coins: { type: Number, default: 0, min: 0 },

        // Streak
        currentStreak: { type: Number, default: 0, min: 0 },
        longestStreak: { type: Number, default: 0, min: 0 },
        lastActiveDate: { type: String, default: null }, // YYYY-MM-DD
        streakFreezes: { type: Number, default: 1, min: 0 }, // free freeze on signup

        // Daily reward check-in
        lastRewardDate: { type: String, default: null }, // YYYY-MM-DD
        checkInStreak: { type: Number, default: 0 }
    },
    { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
