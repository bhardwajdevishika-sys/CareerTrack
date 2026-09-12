/**
 * XP Service — all XP award logic lives here.
 * XP is never modified from the frontend directly.
 *
 * XP Table:
 *   DSA Easy    +10   DSA Medium  +20   DSA Hard    +30
 *   SQL Easy    +10   SQL Medium  +15   SQL Hard    +25
 *   Task        +5    Daily Challenge +25  Weekly Challenge +50
 *   Study       +1 per 10 min   Goal Complete +50
 *   Daily check-in +5  Streak bonus (7d) +20  Achievement unlock varies
 *   Game        +5 to +15
 */

const User = require("../models/User");
const XPTransaction = require("../models/XPTransaction");

// Level thresholds — XP required to REACH that level
const LEVEL_THRESHOLDS = [
    0,    // 1
    100,  // 2
    250,  // 3
    500,  // 4
    850,  // 5
    1300, // 6
    1900, // 7
    2700, // 8
    3700, // 9
    5000, // 10
    6600, // 11
    8500, // 12
    11000,// 13
    14000,// 14
    18000,// 15
    23000,// 16
    29000,// 17
    36000,// 18
    45000,// 19
    56000,// 20
];

const XP_VALUES = {
    dsa_easy: 10,
    dsa_medium: 20,
    dsa_hard: 30,
    sql_easy: 10,
    sql_medium: 15,
    sql_hard: 25,
    task_complete: 5,
    daily_challenge: 25,
    weekly_challenge: 50,
    study_session: null, // calculated: 1 per 10 min
    goal_complete: 50,
    daily_checkin: 5,
    achievement_unlock: null, // passed as parameter
    game_complete: null,      // passed as parameter
    streak_bonus: 20
};

/**
 * Calculate level from total XP.
 * Returns { level, currentLevelXp, nextLevelXp, progressPercent }
 */
const getLevelInfo = (totalXp) => {
    let level = 1;
    for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
        if (totalXp >= LEVEL_THRESHOLDS[i]) {
            level = i + 1;
            break;
        }
    }

    const currentLevelXp = LEVEL_THRESHOLDS[level - 1] || 0;
    const nextLevelXp = LEVEL_THRESHOLDS[level] || LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
    const xpIntoLevel = totalXp - currentLevelXp;
    const xpNeeded = nextLevelXp - currentLevelXp;
    const progressPercent = level >= LEVEL_THRESHOLDS.length
        ? 100
        : Math.min(100, Math.round((xpIntoLevel / xpNeeded) * 100));

    return { level, currentLevelXp, nextLevelXp, xpIntoLevel, xpNeeded, progressPercent };
};

/**
 * Award XP to a user. Returns { xpAdded, newXp, oldLevel, newLevel, leveledUp }.
 * @param {string} userId
 * @param {string} source  — must be in XP_SOURCES
 * @param {string} description
 * @param {string} [refId]   — source document id
 * @param {string} [refModel]
 * @param {number} [override] — if provided, uses this instead of XP_VALUES[source]
 */
const awardXP = async (userId, source, description, refId = null, refModel = null, override = null) => {
    const amount = override !== null ? override : XP_VALUES[source];
    if (!amount || amount <= 0) return { xpAdded: 0, leveledUp: false };

    // Prevent duplicate awards for the same ref+source
    if (refId) {
        const existing = await XPTransaction.findOne({ user: userId, source, refId });
        if (existing) return { xpAdded: 0, leveledUp: false, duplicate: true };
    }

    const user = await User.findById(userId);
    if (!user) return { xpAdded: 0, leveledUp: false };

    const oldLevel = user.level;
    const newXp = user.xp + amount;
    const { level: newLevel } = getLevelInfo(newXp);

    user.xp = newXp;
    user.level = newLevel;
    await user.save();

    await XPTransaction.create({
        user: userId,
        amount,
        source,
        description,
        refId: refId ? String(refId) : undefined,
        refModel
    });

    return {
        xpAdded: amount,
        newXp,
        oldLevel,
        newLevel,
        leveledUp: newLevel > oldLevel
    };
};

/**
 * Calculate XP for a study session from duration in minutes.
 * Formula: 1 XP per 10 min, capped at 30 XP per session.
 */
const studySessionXP = (durationMinutes) => Math.min(30, Math.floor(durationMinutes / 10));

/**
 * Award coins to a user (does NOT go through XP system).
 */
const awardCoins = async (userId, amount) => {
    await User.findByIdAndUpdate(userId, { $inc: { coins: amount } });
};

module.exports = { awardXP, getLevelInfo, studySessionXP, awardCoins, XP_VALUES, LEVEL_THRESHOLDS };
