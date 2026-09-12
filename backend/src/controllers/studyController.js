const StudySession = require("../models/StudySession");
const { awardXP, studySessionXP } = require("../services/xpService");
const { recordActivity } = require("../services/streakService");
const { updateChallengeProgress } = require("../services/challengeService");
const { checkAchievements } = require("../services/achievementService");
const { notifyAchievement, notifyLevelUp } = require("../services/notificationService");

const getSessions = async (req, res, next) => {
    try {
        const { category, limit = 50 } = req.query;
        const filters = { user: req.user._id };
        if (category) filters.category = category;

        const sessions = await StudySession.find(filters)
            .sort({ date: -1 })
            .limit(parseInt(limit));

        return res.json({ success: true, sessions });
    } catch (error) { next(error); }
};

const getStudyStats = async (req, res, next) => {
    try {
        const now = new Date();
        const startOfToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
        const startOfWeek = new Date(startOfToday);
        startOfWeek.setUTCDate(startOfToday.getUTCDate() - now.getUTCDay());
        const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

        const [byCategory, dailyAgg, weeklyAgg, monthlyAgg] = await Promise.all([
            StudySession.aggregate([
                { $match: { user: req.user._id } },
                { $group: { _id: "$category", totalMinutes: { $sum: "$durationMinutes" }, count: { $sum: 1 } } }
            ]),
            StudySession.aggregate([
                { $match: { user: req.user._id, date: { $gte: startOfToday } } },
                { $group: { _id: null, totalMinutes: { $sum: "$durationMinutes" } } }
            ]),
            StudySession.aggregate([
                { $match: { user: req.user._id, date: { $gte: startOfWeek } } },
                { $group: { _id: null, totalMinutes: { $sum: "$durationMinutes" } } }
            ]),
            StudySession.aggregate([
                { $match: { user: req.user._id, date: { $gte: startOfMonth } } },
                { $group: { _id: null, totalMinutes: { $sum: "$durationMinutes" } } }
            ])
        ]);

        return res.json({
            success: true,
            stats: {
                dailyMinutes: dailyAgg[0]?.totalMinutes || 0,
                weeklyMinutes: weeklyAgg[0]?.totalMinutes || 0,
                monthlyMinutes: monthlyAgg[0]?.totalMinutes || 0,
                byCategory
            }
        });
    } catch (error) { next(error); }
};

const createSession = async (req, res, next) => {
    try {
        const session = await StudySession.create({ ...req.body, user: req.user._id });

        const xpAmount = studySessionXP(session.durationMinutes);
        const xpResult = xpAmount > 0
            ? await awardXP(req.user._id, "study_session", `Study session: ${session.category} (${session.durationMinutes} min)`, session._id.toString(), "StudySession", xpAmount)
            : { xpAdded: 0, leveledUp: false };

        await recordActivity(req.user._id);

        const completedChallenges = await updateChallengeProgress(req.user._id, "study_minutes", session.durationMinutes);
        const newAchievements = await checkAchievements(req.user._id);
        for (const a of newAchievements) await notifyAchievement(req.user._id, a.title);
        if (xpResult.leveledUp) await notifyLevelUp(req.user._id, xpResult.newLevel);

        return res.status(201).json({
            success: true,
            message: "Study session logged",
            session,
            gamification: { xpResult, completedChallenges, newAchievements }
        });
    } catch (error) { next(error); }
};

const deleteSession = async (req, res, next) => {
    try {
        const session = await StudySession.findOne({ _id: req.params.id, user: req.user._id });
        if (!session) return res.status(404).json({ success: false, message: "Session not found" });
        await session.deleteOne();
        return res.json({ success: true, message: "Session deleted" });
    } catch (error) { next(error); }
};

module.exports = { getSessions, getStudyStats, createSession, deleteSession };
