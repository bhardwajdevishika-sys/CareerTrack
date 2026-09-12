const Problem = require("../models/Problem");
const Topic = require("../models/Topic");
const { awardXP } = require("../services/xpService");
const { recordActivity } = require("../services/streakService");
const { updateChallengeProgress } = require("../services/challengeService");
const { checkAchievements } = require("../services/achievementService");
const { notifyAchievement, notifyLevelUp } = require("../services/notificationService");

const findOwnedTopic = (topicId, userId) =>
    Topic.findOne({ _id: topicId, user: userId });

const syncTopicProblemCount = async (topicId, userId) => {
    const solvedCount = await Problem.countDocuments({ user: userId, topic: topicId, status: "solved" });
    await Topic.updateOne({ _id: topicId, user: userId }, { problemsSolved: solvedCount });
};

const triggerGamification = async (userId, problem) => {
    const source = `dsa_${problem.difficulty}`;
    const xpResult = await awardXP(
        userId, source,
        `Solved DSA: ${problem.title}`,
        problem._id.toString(), "Problem"
    );
    await recordActivity(userId);
    const completedChallenges = await updateChallengeProgress(userId, "dsa_solved", 1);
    const newAchievements = await checkAchievements(userId);
    for (const a of newAchievements) await notifyAchievement(userId, a.title);
    if (xpResult.leveledUp) await notifyLevelUp(userId, xpResult.newLevel);
    return { xpResult, completedChallenges, newAchievements };
};

const getProblems = async (req, res, next) => {
    try {
        const filters = { user: req.user._id };
        const { topic, status, platform, difficulty } = req.query;
        if (topic) filters.topic = topic;
        if (status) filters.status = status;
        if (platform) filters.platform = platform;
        if (difficulty) filters.difficulty = difficulty;

        const problems = await Problem.find(filters)
            .populate("topic", "name")
            .sort({ updatedAt: -1 });

        return res.status(200).json({ success: true, problems });
    } catch (error) { next(error); }
};

const createProblem = async (req, res, next) => {
    try {
        const topic = await findOwnedTopic(req.body.topic, req.user._id);
        if (!topic) return res.status(404).json({ success: false, message: "Topic not found" });

        const problem = await Problem.create({
            ...req.body,
            title: req.body.title.trim(),
            user: req.user._id,
            solvedAt: req.body.status === "solved" ? new Date() : undefined
        });

        await syncTopicProblemCount(problem.topic, req.user._id);

        let gamification = null;
        if (problem.status === "solved") {
            gamification = await triggerGamification(req.user._id, problem);
        }

        return res.status(201).json({ success: true, message: "Problem created successfully", problem, gamification });
    } catch (error) { next(error); }
};

const updateProblem = async (req, res, next) => {
    try {
        const problem = await Problem.findOne({ _id: req.params.id, user: req.user._id });
        if (!problem) return res.status(404).json({ success: false, message: "Problem not found" });

        const previousTopicId = problem.topic.toString();
        const wasSolved = problem.status === "solved";

        if (req.body.topic !== undefined) {
            const topic = await findOwnedTopic(req.body.topic, req.user._id);
            if (!topic) return res.status(404).json({ success: false, message: "Topic not found" });
            problem.topic = req.body.topic;
        }

        ["title", "platform", "difficulty", "link", "notes", "markedForRevision"].forEach((field) => {
            if (req.body[field] !== undefined) {
                problem[field] = field === "title" ? req.body[field].trim() : req.body[field];
            }
        });

        if (req.body.status !== undefined) {
            problem.status = req.body.status;
            if (problem.status === "solved" && !wasSolved) {
                problem.solvedAt = new Date();
            } else if (problem.status !== "solved") {
                problem.solvedAt = undefined;
            }
        }

        const updatedProblem = await problem.save();
        const affectedTopicIds = new Set([previousTopicId, updatedProblem.topic.toString()]);
        await Promise.all([...affectedTopicIds].map((id) => syncTopicProblemCount(id, req.user._id)));

        let gamification = null;
        if (problem.status === "solved" && !wasSolved) {
            gamification = await triggerGamification(req.user._id, updatedProblem);
        }

        return res.status(200).json({ success: true, message: "Problem updated successfully", problem: updatedProblem, gamification });
    } catch (error) { next(error); }
};

const deleteProblem = async (req, res, next) => {
    try {
        const problem = await Problem.findOne({ _id: req.params.id, user: req.user._id });
        if (!problem) return res.status(404).json({ success: false, message: "Problem not found" });
        await problem.deleteOne();
        await syncTopicProblemCount(problem.topic, req.user._id);
        return res.status(200).json({ success: true, message: "Problem deleted successfully" });
    } catch (error) { next(error); }
};

module.exports = { getProblems, createProblem, updateProblem, deleteProblem };
