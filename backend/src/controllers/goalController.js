const Goal = require("../models/Goal");
const { awardXP } = require("../services/xpService");
const { recordActivity } = require("../services/streakService");
const { checkAchievements } = require("../services/achievementService");
const { notifyAchievement, notifyLevelUp } = require("../services/notificationService");

const getGoals = async (req, res, next) => {
    try {
        const { status, category } = req.query;
        const filters = { user: req.user._id };
        if (status) filters.status = status;
        if (category) filters.category = category;

        const goals = await Goal.find(filters).sort({ createdAt: -1 });
        return res.json({ success: true, goals });
    } catch (error) { next(error); }
};

const createGoal = async (req, res, next) => {
    try {
        const goal = await Goal.create({ ...req.body, user: req.user._id });
        return res.status(201).json({ success: true, message: "Goal created", goal });
    } catch (error) { next(error); }
};

const updateGoal = async (req, res, next) => {
    try {
        const goal = await Goal.findOne({ _id: req.params.id, user: req.user._id });
        if (!goal) return res.status(404).json({ success: false, message: "Goal not found" });

        const wasCompleted = goal.status === "completed";

        ["title", "description", "category", "priority", "deadline", "targetValue", "currentValue", "status"].forEach((f) => {
            if (req.body[f] !== undefined) goal[f] = req.body[f];
        });

        let gamification = null;

        if (goal.status === "completed" && !wasCompleted && !goal.xpAwarded) {
            goal.completedAt = new Date();
            goal.xpAwarded = true;
            await goal.save();

            const xpResult = await awardXP(req.user._id, "goal_complete", `Completed goal: ${goal.title}`, goal._id.toString(), "Goal");
            await recordActivity(req.user._id);
            const newAchievements = await checkAchievements(req.user._id);
            for (const a of newAchievements) await notifyAchievement(req.user._id, a.title);
            if (xpResult.leveledUp) await notifyLevelUp(req.user._id, xpResult.newLevel);

            gamification = { xpResult, newAchievements };
        } else {
            await goal.save();
        }

        return res.json({ success: true, message: "Goal updated", goal, gamification });
    } catch (error) { next(error); }
};

const deleteGoal = async (req, res, next) => {
    try {
        const goal = await Goal.findOne({ _id: req.params.id, user: req.user._id });
        if (!goal) return res.status(404).json({ success: false, message: "Goal not found" });
        await goal.deleteOne();
        return res.json({ success: true, message: "Goal deleted" });
    } catch (error) { next(error); }
};

module.exports = { getGoals, createGoal, updateGoal, deleteGoal };
