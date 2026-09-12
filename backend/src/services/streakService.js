/**
 * Streak Service
 *
 * A streak counts consecutive calendar days on which the user performs
 * at least one "meaningful" activity (DSA solved, SQL solved, task completed,
 * study session logged, challenge completed).
 *
 * Rules:
 *  - Activity on TODAY extends the streak if lastActiveDate was YESTERDAY.
 *  - Activity on TODAY when lastActiveDate is TODAY — no change (already counted).
 *  - Gap of exactly 1 day and user has a streak freeze — consume freeze, keep streak.
 *  - Gap of > 1 day (or > 1 with no freeze) — streak resets to 1.
 */

const User = require("../models/User");
const { awardXP } = require("./xpService");

const getTodayString = () => new Date().toISOString().slice(0, 10);

const daysBetween = (dateStr1, dateStr2) => {
    const d1 = new Date(dateStr1);
    const d2 = new Date(dateStr2);
    return Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
};

/**
 * Record activity for a user. Updates streak.
 * Returns { currentStreak, longestStreak, freezeUsed, streakBroken, xpBonus }
 */
const recordActivity = async (userId) => {
    const user = await User.findById(userId);
    if (!user) return null;

    const today = getTodayString();
    const last = user.lastActiveDate;
    let freezeUsed = false;
    let streakBroken = false;
    let xpBonus = null;

    if (!last || last === today) {
        // Already active today OR first ever — just ensure streak >= 1
        if (!last) {
            user.currentStreak = 1;
            user.lastActiveDate = today;
        }
        // If last === today: no change needed
    } else {
        const gap = daysBetween(last, today);

        if (gap === 1) {
            // Perfect continuation
            user.currentStreak += 1;
        } else if (gap === 2 && user.streakFreezes > 0) {
            // Missed one day but has a freeze
            user.streakFreezes -= 1;
            user.currentStreak += 1;
            freezeUsed = true;
        } else {
            // Streak broken
            streakBroken = user.currentStreak > 0;
            user.currentStreak = 1;
        }

        user.lastActiveDate = today;
    }

    if (user.currentStreak > user.longestStreak) {
        user.longestStreak = user.currentStreak;
    }

    // Bonus XP for 7-day streak milestones
    if (user.currentStreak > 0 && user.currentStreak % 7 === 0) {
        xpBonus = await awardXP(userId, "streak_bonus", `${user.currentStreak}-day streak milestone`, `streak_${user.currentStreak}_${today}`);
    }

    await user.save();

    return {
        currentStreak: user.currentStreak,
        longestStreak: user.longestStreak,
        freezeUsed,
        streakBroken,
        xpBonus
    };
};

/**
 * Get current streak info without modifying anything.
 */
const getStreakInfo = async (userId) => {
    const user = await User.findById(userId).select("currentStreak longestStreak lastActiveDate streakFreezes");
    if (!user) return null;
    return {
        currentStreak: user.currentStreak,
        longestStreak: user.longestStreak,
        lastActiveDate: user.lastActiveDate,
        streakFreezes: user.streakFreezes
    };
};

module.exports = { recordActivity, getStreakInfo, getTodayString };
