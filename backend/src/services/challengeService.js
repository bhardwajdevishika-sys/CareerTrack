/**
 * Challenge Service
 *
 * Generates daily and weekly challenges for a user if none exist for the current period.
 * Updates challenge progress when activities occur.
 */

const Challenge = require("../models/Challenge");
const { getTodayString } = require("./streakService");

const getEndOfDay = () => {
    const d = new Date();
    d.setUTCHours(23, 59, 59, 999);
    return d;
};

const getEndOfWeek = () => {
    const d = new Date();
    const dayOfWeek = d.getUTCDay(); // 0=Sun
    const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
    d.setUTCDate(d.getUTCDate() + daysUntilSunday);
    d.setUTCHours(23, 59, 59, 999);
    return d;
};

const DAILY_TEMPLATES = [
    { title: "DSA Sprint", description: "Solve 2 DSA problems today", metric: "dsa_solved", target: 2, xpReward: 25, coinReward: 10 },
    { title: "SQL Practice", description: "Solve 1 SQL problem today", metric: "sql_solved", target: 1, xpReward: 20, coinReward: 8 },
    { title: "Study Session", description: "Study for at least 60 minutes", metric: "study_minutes", target: 60, xpReward: 20, coinReward: 8 },
    { title: "Task Warrior", description: "Complete 3 daily tasks", metric: "tasks_completed", target: 3, xpReward: 15, coinReward: 6 },
];

const WEEKLY_TEMPLATES = [
    { title: "DSA Warrior", description: "Solve 10 DSA problems this week", metric: "dsa_solved", target: 10, xpReward: 100, coinReward: 40 },
    { title: "SQL Champion", description: "Solve 5 SQL problems this week", metric: "sql_solved", target: 5, xpReward: 80, coinReward: 30 },
    { title: "Study Marathon", description: "Log 7 hours of study this week", metric: "study_minutes", target: 420, xpReward: 80, coinReward: 30 },
    { title: "Consistency King", description: "Complete 15 tasks this week", metric: "tasks_completed", target: 15, xpReward: 75, coinReward: 25 },
];

/**
 * Ensure daily + weekly challenges exist for a user. Creates them if missing.
 * Returns { daily: Challenge[], weekly: Challenge[] }
 */
const ensureChallenges = async (userId) => {
    const now = new Date();
    const endOfDay = getEndOfDay();
    const endOfWeek = getEndOfWeek();

    // Check existing
    const [existingDaily, existingWeekly] = await Promise.all([
        Challenge.find({ user: userId, type: "daily", deadline: { $gte: now } }),
        Challenge.find({ user: userId, type: "weekly", deadline: { $gte: now } })
    ]);

    const toCreate = [];

    if (existingDaily.length === 0) {
        // Pick 2 random daily challenges
        const shuffled = [...DAILY_TEMPLATES].sort(() => Math.random() - 0.5).slice(0, 2);
        shuffled.forEach((t) => toCreate.push({ ...t, user: userId, type: "daily", deadline: endOfDay, current: 0 }));
    }

    if (existingWeekly.length === 0) {
        // Pick 2 random weekly challenges
        const shuffled = [...WEEKLY_TEMPLATES].sort(() => Math.random() - 0.5).slice(0, 2);
        shuffled.forEach((t) => toCreate.push({ ...t, user: userId, type: "weekly", deadline: endOfWeek, current: 0 }));
    }

    if (toCreate.length > 0) await Challenge.insertMany(toCreate);

    const [daily, weekly] = await Promise.all([
        Challenge.find({ user: userId, type: "daily", deadline: { $gte: now } }),
        Challenge.find({ user: userId, type: "weekly", deadline: { $gte: now } })
    ]);

    return { daily, weekly };
};

/**
 * Increment challenge progress for a given metric.
 * Returns completed challenges (for triggering XP/coins).
 */
const updateChallengeProgress = async (userId, metric, incrementBy = 1) => {
    const now = new Date();

    const challenges = await Challenge.find({
        user: userId,
        metric,
        completed: false,
        deadline: { $gte: now }
    });

    const justCompleted = [];

    for (const challenge of challenges) {
        challenge.current = Math.min(challenge.target, challenge.current + incrementBy);
        if (challenge.current >= challenge.target) {
            challenge.completed = true;
            challenge.completedAt = new Date();
            justCompleted.push(challenge);
        }
        await challenge.save();
    }

    return justCompleted;
};

module.exports = { ensureChallenges, updateChallengeProgress };
