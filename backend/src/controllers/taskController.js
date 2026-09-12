const Task = require("../models/Task");
const { awardXP } = require("../services/xpService");
const { recordActivity } = require("../services/streakService");
const { updateChallengeProgress } = require("../services/challengeService");
const { checkAchievements } = require("../services/achievementService");
const { notifyAchievement, notifyLevelUp } = require("../services/notificationService");

const getTasks = async (req, res, next) => {
    try {
        const { completed, category, priority } = req.query;
        const filters = { user: req.user._id };
        if (completed !== undefined) filters.completed = completed === "true";
        if (category) filters.category = category;
        if (priority) filters.priority = priority;

        const tasks = await Task.find(filters).sort({ completed: 1, createdAt: -1 });
        return res.json({ success: true, tasks });
    } catch (error) { next(error); }
};

const createTask = async (req, res, next) => {
    try {
        const task = await Task.create({ ...req.body, user: req.user._id });
        return res.status(201).json({ success: true, message: "Task created", task });
    } catch (error) { next(error); }
};

const updateTask = async (req, res, next) => {
    try {
        const task = await Task.findOne({ _id: req.params.id, user: req.user._id });
        if (!task) return res.status(404).json({ success: false, message: "Task not found" });

        const wasCompleted = task.completed;

        ["title", "description", "category", "priority", "dueDate", "completed"].forEach((f) => {
            if (req.body[f] !== undefined) task[f] = req.body[f];
        });

        let gamification = null;

        if (task.completed && !wasCompleted && !task.xpAwarded) {
            task.completedAt = new Date();
            task.xpAwarded = true;
            await task.save();

            const xpResult = await awardXP(req.user._id, "task_complete", `Completed task: ${task.title}`, task._id.toString(), "Task");
            await recordActivity(req.user._id);

            const completedChallenges = await updateChallengeProgress(req.user._id, "tasks_completed", 1);
            const newAchievements = await checkAchievements(req.user._id);
            for (const a of newAchievements) await notifyAchievement(req.user._id, a.title);
            if (xpResult.leveledUp) await notifyLevelUp(req.user._id, xpResult.newLevel);

            gamification = { xpResult, completedChallenges, newAchievements };
        } else {
            // If marking uncomplete, reset xpAwarded so re-completion would grant XP again
            if (!task.completed && wasCompleted) {
                task.xpAwarded = false;
                task.completedAt = undefined;
            }
            await task.save();
        }

        return res.json({ success: true, message: "Task updated", task, gamification });
    } catch (error) { next(error); }
};

const deleteTask = async (req, res, next) => {
    try {
        const task = await Task.findOne({ _id: req.params.id, user: req.user._id });
        if (!task) return res.status(404).json({ success: false, message: "Task not found" });
        await task.deleteOne();
        return res.json({ success: true, message: "Task deleted" });
    } catch (error) { next(error); }
};

module.exports = { getTasks, createTask, updateTask, deleteTask };
