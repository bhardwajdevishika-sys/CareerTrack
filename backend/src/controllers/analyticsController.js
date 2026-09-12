const Problem = require("../models/Problem");
const SQLProblem = require("../models/SQLProblem");
const StudySession = require("../models/StudySession");
const Task = require("../models/Task");
const Goal = require("../models/Goal");
const XPTransaction = require("../models/XPTransaction");
const User = require("../models/User");
const { getLevelInfo } = require("../services/xpService");

// Preparation Score — transparent formula
// DSA 30% | SQL 20% | Consistency 20% | Tasks/Goals 15% | Study 15%
const calcPrepScore = ({ dsaSolved, sqlSolved, streak, taskRate, goalRate, weeklyStudyHours }) => {
    const dsaScore  = Math.min(100, (dsaSolved  / 1.5))  * 0.30;
    const sqlScore  = Math.min(100, (sqlSolved  * 2))    * 0.20;
    const conScore  = Math.min(100, streak * 3 + taskRate * 30) * 0.20;
    const tgScore   = Math.min(100, (taskRate + goalRate) * 50) * 0.15;
    const studyScore = Math.min(100, weeklyStudyHours * 10)     * 0.15;
    return Math.round(dsaScore + sqlScore + conScore + tgScore + studyScore);
};

const getAnalytics = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const now = new Date();
        const startOfWeek  = new Date(now.getTime() - 7  * 86400000);
        const startOfMonth = new Date(now.getTime() - 30 * 86400000);

        const [
            user,
            dsaAll, dsaSolved, sqlAll, sqlSolved,
            weeklyXP, xpLast30, studyWeek, studyMonth,
            tasksTotal, tasksCompleted, goalsTotal, goalsCompleted,
            dsaByDifficulty, sqlByTopic
        ] = await Promise.all([
            User.findById(userId).select("xp level currentStreak longestStreak"),
            Problem.countDocuments({ user: userId }),
            Problem.countDocuments({ user: userId, status: "solved" }),
            SQLProblem.countDocuments({ user: userId }),
            SQLProblem.countDocuments({ user: userId, status: "solved" }),
            XPTransaction.aggregate([
                { $match: { user: userId, createdAt: { $gte: startOfWeek } } },
                { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, xp: { $sum: "$amount" } } },
                { $sort: { _id: 1 } }
            ]),
            XPTransaction.aggregate([
                { $match: { user: userId, createdAt: { $gte: startOfMonth } } },
                { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, xp: { $sum: "$amount" } } },
                { $sort: { _id: 1 } }
            ]),
            StudySession.aggregate([
                { $match: { user: userId, date: { $gte: startOfWeek } } },
                { $group: { _id: null, total: { $sum: "$durationMinutes" } } }
            ]),
            StudySession.aggregate([
                { $match: { user: userId, date: { $gte: startOfMonth } } },
                { $group: { _id: "$category", total: { $sum: "$durationMinutes" } } }
            ]),
            Task.countDocuments({ user: userId }),
            Task.countDocuments({ user: userId, completed: true }),
            Goal.countDocuments({ user: userId }),
            Goal.countDocuments({ user: userId, status: "completed" }),
            Problem.aggregate([
                { $match: { user: userId, status: "solved" } },
                { $group: { _id: "$difficulty", count: { $sum: 1 } } }
            ]),
            SQLProblem.aggregate([
                { $match: { user: userId, status: "solved" } },
                { $group: { _id: "$topic", count: { $sum: 1 } } }
            ])
        ]);

        const weeklyStudyHours = (studyWeek[0]?.total || 0) / 60;
        const taskRate = tasksTotal > 0 ? tasksCompleted / tasksTotal : 0;
        const goalRate = goalsTotal > 0 ? goalsCompleted / goalsTotal : 0;
        const prepScore = calcPrepScore({ dsaSolved, sqlSolved, streak: user.currentStreak, taskRate, goalRate, weeklyStudyHours });
        const levelInfo = getLevelInfo(user.xp);

        return res.json({
            success: true,
            analytics: {
                prepScore,
                xp: user.xp,
                level: user.level,
                levelInfo,
                currentStreak: user.currentStreak,
                longestStreak: user.longestStreak,
                dsa: { total: dsaAll, solved: dsaSolved, byDifficulty: dsaByDifficulty },
                sql: { total: sqlAll, solved: sqlSolved, byTopic: sqlByTopic },
                study: { weeklyMinutes: studyWeek[0]?.total || 0, byCategory: studyMonth },
                tasks: { total: tasksTotal, completed: tasksCompleted, rate: taskRate },
                goals: { total: goalsTotal, completed: goalsCompleted, rate: goalRate },
                xpHistory: { weekly: weeklyXP, monthly: xpLast30 }
            }
        });
    } catch (error) { next(error); }
};

module.exports = { getAnalytics };
