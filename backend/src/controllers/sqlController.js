const SQLProblem = require("../models/SQLProblem");
const { awardXP } = require("../services/xpService");
const { recordActivity } = require("../services/streakService");
const { updateChallengeProgress, ensureChallenges } = require("../services/challengeService");
const { checkAchievements } = require("../services/achievementService");
const { notifyAchievement, notifyLevelUp } = require("../services/notificationService");

const triggerGamification = async (userId, problem, res) => {
    // Award XP
    const difficultySource = `sql_${problem.difficulty}`;
    const xpResult = await awardXP(
        userId, difficultySource,
        `Solved SQL: ${problem.title}`,
        problem._id.toString(), "SQLProblem"
    );

    // Streak
    await recordActivity(userId);

    // Challenge progress
    const completedChallenges = await updateChallengeProgress(userId, "sql_solved", 1);

    // Achievements
    const newAchievements = await checkAchievements(userId);
    for (const a of newAchievements) await notifyAchievement(userId, a.title);

    if (xpResult.leveledUp) await notifyLevelUp(userId, xpResult.newLevel);

    return { xpResult, completedChallenges, newAchievements };
};

const getSQLProblems = async (req, res, next) => {
    try {
        const filters = { user: req.user._id };
        const { topic, status, platform, difficulty } = req.query;
        if (topic) filters.topic = topic;
        if (status) filters.status = status;
        if (platform) filters.platform = platform;
        if (difficulty) filters.difficulty = difficulty;

        const problems = await SQLProblem.find(filters).sort({ updatedAt: -1 });
        return res.json({ success: true, problems });
    } catch (error) { next(error); }
};

const createSQLProblem = async (req, res, next) => {
    try {
        const problem = await SQLProblem.create({
            ...req.body,
            user: req.user._id,
            solvedAt: req.body.status === "solved" ? new Date() : undefined
        });

        let gamification = null;
        if (problem.status === "solved") {
            gamification = await triggerGamification(req.user._id, problem, res);
        }

        return res.status(201).json({ success: true, message: "SQL problem created", problem, gamification });
    } catch (error) { next(error); }
};

const updateSQLProblem = async (req, res, next) => {
    try {
        const problem = await SQLProblem.findOne({ _id: req.params.id, user: req.user._id });
        if (!problem) return res.status(404).json({ success: false, message: "Problem not found" });

        const wasSolved = problem.status === "solved";

        ["title", "topic", "difficulty", "platform", "link", "notes"].forEach((f) => {
            if (req.body[f] !== undefined) problem[f] = req.body[f];
        });

        if (req.body.status !== undefined) {
            problem.status = req.body.status;
            if (problem.status === "solved" && !wasSolved) {
                problem.solvedAt = new Date();
            } else if (problem.status !== "solved") {
                problem.solvedAt = undefined;
            }
        }

        await problem.save();

        let gamification = null;
        if (problem.status === "solved" && !wasSolved) {
            gamification = await triggerGamification(req.user._id, problem, res);
        }

        return res.json({ success: true, message: "SQL problem updated", problem, gamification });
    } catch (error) { next(error); }
};

const deleteSQLProblem = async (req, res, next) => {
    try {
        const problem = await SQLProblem.findOne({ _id: req.params.id, user: req.user._id });
        if (!problem) return res.status(404).json({ success: false, message: "Problem not found" });
        await problem.deleteOne();
        return res.json({ success: true, message: "SQL problem deleted" });
    } catch (error) { next(error); }
};

module.exports = { getSQLProblems, createSQLProblem, updateSQLProblem, deleteSQLProblem };
