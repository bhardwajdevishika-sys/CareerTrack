/**
 * Notification Service — creates system notifications for key events.
 */
const Notification = require("../models/Notification");

const NOTIFICATION_TYPES = [
    "revision-due", "streak", "system",
    "achievement", "level-up", "challenge", "reward", "ai"
];

const createNotification = async (userId, message, type = "system", extraData = {}) => {
    try {
        return await Notification.create({
            user: userId,
            message,
            type,
            ...extraData
        });
    } catch {
        // Non-critical — log and continue
    }
};

const notifyAchievement = (userId, title) =>
    createNotification(userId, `🏆 Achievement unlocked: ${title}`, "achievement");

const notifyLevelUp = (userId, level) =>
    createNotification(userId, `⬆️ You reached Level ${level}! Keep going!`, "level-up");

const notifyChallengeComplete = (userId, title) =>
    createNotification(userId, `✅ Challenge completed: ${title}`, "challenge");

const notifyStreakWarning = (userId, streak) =>
    createNotification(userId, `🔥 Don't break your ${streak}-day streak! Log activity today.`, "streak");

const notifyDailyReward = (userId) =>
    createNotification(userId, "🎁 Daily reward available! Claim it now.", "reward");

module.exports = {
    createNotification,
    notifyAchievement,
    notifyLevelUp,
    notifyChallengeComplete,
    notifyStreakWarning,
    notifyDailyReward
};
