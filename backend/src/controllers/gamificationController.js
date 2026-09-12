const User = require("../models/User");
const XPTransaction = require("../models/XPTransaction");
const DailyReward = require("../models/DailyReward");
const Challenge = require("../models/Challenge");
const { Achievement, UserAchievement } = require("../models/Achievement");
const { getLevelInfo, awardCoins } = require("../services/xpService");
const { awardXP } = require("../services/xpService");
const { ensureChallenges } = require("../services/challengeService");
const { checkAchievements } = require("../services/achievementService");
const { notifyLevelUp, notifyAchievement } = require("../services/notificationService");
const { getTodayString } = require("../services/streakService");

// ── XP & Level info ───────────────────────────────────────────────────────────

const getGamificationStatus = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id).select("xp level coins currentStreak longestStreak streakFreezes lastActiveDate checkInStreak lastRewardDate");
        const levelInfo = getLevelInfo(user.xp);
        const today = getTodayString();

        return res.json({
            success: true,
            gamification: {
                xp: user.xp,
                level: user.level,
                coins: user.coins,
                currentStreak: user.currentStreak,
                longestStreak: user.longestStreak,
                streakFreezes: user.streakFreezes,
                lastActiveDate: user.lastActiveDate,
                levelInfo,
                dailyRewardAvailable: user.lastRewardDate !== today,
                lastRewardDate: user.lastRewardDate
            }
        });
    } catch (error) { next(error); }
};

const getXPHistory = async (req, res, next) => {
    try {
        const transactions = await XPTransaction.find({ user: req.user._id })
            .sort({ createdAt: -1 })
            .limit(50);
        return res.json({ success: true, transactions });
    } catch (error) { next(error); }
};

// ── Daily Reward ──────────────────────────────────────────────────────────────

const claimDailyReward = async (req, res, next) => {
    try {
        const today = getTodayString();
        const user = await User.findById(req.user._id).select("lastRewardDate checkInStreak coins");

        if (user.lastRewardDate === today) {
            return res.status(409).json({ success: false, message: "Daily reward already claimed today" });
        }

        // Determine check-in streak
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().slice(0, 10);
        const newCheckInStreak = (user.lastRewardDate === yesterdayStr)
            ? (user.checkInStreak || 0) + 1
            : 1;

        // Reward scales with consecutive check-ins, max 7-day bonus
        const day = Math.min(newCheckInStreak, 7);
        const xpReward = 5 + (day - 1) * 2;  // 5,7,9,11,13,15,17
        const coinReward = 5 + (day - 1) * 3; // 5,8,11,14,17,20,23

        await DailyReward.create({
            user: req.user._id,
            claimedDate: today,
            xpAwarded: xpReward,
            coinsAwarded: coinReward,
            streakDay: newCheckInStreak
        });

        const xpResult = await awardXP(req.user._id, "daily_checkin", "Daily check-in reward", `checkin_${today}`);
        await awardCoins(req.user._id, coinReward);

        user.lastRewardDate = today;
        user.checkInStreak = newCheckInStreak;
        await user.save();

        return res.json({
            success: true,
            message: "Daily reward claimed!",
            reward: { xpReward, coinReward, checkInStreak: newCheckInStreak },
            gamification: { xpResult }
        });
    } catch (error) { next(error); }
};

// ── Challenges ────────────────────────────────────────────────────────────────

const getChallenges = async (req, res, next) => {
    try {
        const { daily, weekly } = await ensureChallenges(req.user._id);
        return res.json({ success: true, challenges: { daily, weekly } });
    } catch (error) { next(error); }
};

// ── Achievements ──────────────────────────────────────────────────────────────

const getAchievements = async (req, res, next) => {
    try {
        const [all, unlocked] = await Promise.all([
            Achievement.find({}).sort({ category: 1 }),
            UserAchievement.find({ user: req.user._id }).populate("achievement").sort({ unlockedAt: -1 })
        ]);

        const unlockedMap = new Set(unlocked.map((ua) => ua.achievement._id.toString()));

        const enriched = all.map((a) => ({
            ...a.toJSON(),
            unlocked: unlockedMap.has(a._id.toString()),
            unlockedAt: unlocked.find((ua) => ua.achievement._id.toString() === a._id.toString())?.unlockedAt || null
        }));

        return res.json({ success: true, achievements: enriched, totalUnlocked: unlocked.length });
    } catch (error) { next(error); }
};

// ── Streak Freeze ─────────────────────────────────────────────────────────────

const buyStreakFreeze = async (req, res, next) => {
    try {
        const FREEZE_COST = 100; // coins
        const user = await User.findById(req.user._id).select("coins streakFreezes");

        if (user.coins < FREEZE_COST) {
            return res.status(400).json({ success: false, message: `Not enough coins. Need ${FREEZE_COST}, have ${user.coins}.` });
        }

        user.coins -= FREEZE_COST;
        user.streakFreezes += 1;
        await user.save();

        return res.json({ success: true, message: "Streak freeze purchased!", streakFreezes: user.streakFreezes, coins: user.coins });
    } catch (error) { next(error); }
};

// ── Leaderboard ───────────────────────────────────────────────────────────────

const getLeaderboard = async (req, res, next) => {
    try {
        const { period = "all" } = req.query;

        // For MVP we rank by XP for all-time
        // Weekly/monthly would require XP transaction aggregation
        let users;

        if (period === "all") {
            users = await User.find({ xp: { $gt: 0 } })
                .select("name level xp currentStreak")
                .sort({ xp: -1 })
                .limit(50);
        } else {
            const now = new Date();
            const startDate = period === "weekly"
                ? new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
                : new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

            const xpAgg = await XPTransaction.aggregate([
                { $match: { createdAt: { $gte: startDate } } },
                { $group: { _id: "$user", totalXP: { $sum: "$amount" } } },
                { $sort: { totalXP: -1 } },
                { $limit: 50 }
            ]);

            const userIds = xpAgg.map((x) => x._id);
            const userMap = await User.find({ _id: { $in: userIds } }).select("name level xp currentStreak");
            const mapById = {};
            userMap.forEach((u) => { mapById[u._id.toString()] = u; });

            users = xpAgg.map((x) => ({
                ...mapById[x._id.toString()]?.toObject(),
                periodXP: x.totalXP
            })).filter((u) => u._id);
        }

        const enriched = users.map((u, index) => ({
            rank: index + 1,
            _id: u._id,
            name: u.name,
            level: u.level,
            xp: period === "all" ? u.xp : u.periodXP,
            currentStreak: u.currentStreak,
            isCurrentUser: u._id.toString() === req.user._id.toString()
        }));

        return res.json({ success: true, leaderboard: enriched, period });
    } catch (error) { next(error); }
};

module.exports = {
    getGamificationStatus,
    getXPHistory,
    claimDailyReward,
    getChallenges,
    getAchievements,
    buyStreakFreeze,
    getLeaderboard
};
