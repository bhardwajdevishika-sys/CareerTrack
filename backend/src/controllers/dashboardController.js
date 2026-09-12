const Problem = require("../models/Problem");
const SQLProblem = require("../models/SQLProblem");
const Topic = require("../models/Topic");
const Task = require("../models/Task");
const Goal = require("../models/Goal");
const Challenge = require("../models/Challenge");
const StudySession = require("../models/StudySession");
const User = require("../models/User");
const { getLevelInfo } = require("../services/xpService");
const { ensureChallenges } = require("../services/challengeService");

const getStartOfUtcDay = (date) =>
    new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));

const getDashboardStats = async (req, res, next) => {
    try {
        const now = new Date();
        const startOfToday = getStartOfUtcDay(now);
        const startOfTomorrow = new Date(startOfToday);
        startOfTomorrow.setUTCDate(startOfTomorrow.getUTCDate() + 1);
        const startOfWeek = new Date(startOfToday);
        startOfWeek.setUTCDate(startOfToday.getUTCDate() - 6); // last 7 days

        const userId = req.user._id;

        // Ensure daily/weekly challenges exist
        await ensureChallenges(userId);

        const [
            user,
            dsaSolvedTotal,
            sqlSolvedTotal,
            solvedToday,
            sqlSolvedToday,
            tasksToday,
            tasksCompleted,
            activeGoals,
            studyToday,
            weeklyActivity,
            recentSolvedProblems,
            challenges
        ] = await Promise.all([
            User.findById(userId).select("xp level coins currentStreak longestStreak streakFreezes lastActiveDate lastRewardDate name"),
            Problem.countDocuments({ user: userId, status: "solved" }),
            SQLProblem.countDocuments({ user: userId, status: "solved" }),
            Problem.countDocuments({ user: userId, status: "solved", solvedAt: { $gte: startOfToday, $lt: startOfTomorrow } }),
            SQLProblem.countDocuments({ user: userId, status: "solved", solvedAt: { $gte: startOfToday } }),
            Task.countDocuments({ user: userId, createdAt: { $gte: startOfToday } }),
            Task.countDocuments({ user: userId, completed: true, completedAt: { $gte: startOfToday } }),
            Goal.find({ user: userId, status: "active" }).select("title category deadline progressPercent targetValue currentValue").limit(4),
            StudySession.aggregate([
                { $match: { user: userId, date: { $gte: startOfToday } } },
                { $group: { _id: null, total: { $sum: "$durationMinutes" } } }
            ]),
            // Last 7 days: count problems solved per day
            Problem.aggregate([
                { $match: { user: userId, status: "solved", solvedAt: { $gte: startOfWeek } } },
                { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$solvedAt" } }, count: { $sum: 1 } } },
                { $sort: { _id: 1 } }
            ]),
            Problem.find({ user: userId, status: "solved", solvedAt: { $exists: true } })
                .select("title solvedAt topic difficulty")
                .populate("topic", "name")
                .sort({ solvedAt: -1 })
                .limit(5),
            Challenge.find({ user: userId, deadline: { $gte: now } })
        ]);

        const levelInfo = getLevelInfo(user.xp);
        const today = now.toISOString().slice(0, 10);
        const dailyRewardAvailable = user.lastRewardDate !== today;

        return res.status(200).json({
            success: true,
            dashboard: {
                // User basics
                userName: user.name,

                // Gamification
                xp: user.xp,
                level: user.level,
                coins: user.coins,
                levelInfo,
                currentStreak: user.currentStreak,
                longestStreak: user.longestStreak,
                streakFreezes: user.streakFreezes,
                dailyRewardAvailable,

                // Progress stats
                dsaSolvedTotal,
                sqlSolvedTotal,
                studyMinutesToday: studyToday[0]?.total || 0,

                // Today's activity
                todaysGoal: {
                    target: req.user.dailyGoal || 3,
                    solved: solvedToday,
                    sqlSolved: sqlSolvedToday,
                    tasksCompleted,
                    remaining: Math.max((req.user.dailyGoal || 3) - solvedToday, 0)
                },

                // Goals
                activeGoals,

                // Challenges
                challenges,

                // Charts
                weeklyActivity,

                // Recent activity
                recentActivity: recentSolvedProblems.map((p) => ({
                    type: "problem-solved",
                    title: p.title,
                    topic: p.topic?.name,
                    difficulty: p.difficulty,
                    occurredAt: p.solvedAt
                }))
            }
        });
    } catch (error) {
        next(error);
    }
};

module.exports = { getDashboardStats };
