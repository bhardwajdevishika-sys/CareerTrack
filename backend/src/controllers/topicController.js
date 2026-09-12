const Topic = require("../models/Topic");
const Problem = require("../models/Problem");

const getTopics = async (req, res, next) => {
    try {
        const topics = await Topic.find({ user: req.user._id }).sort({ updatedAt: -1 });

        return res.status(200).json({
            success: true,
            topics
        });
    } catch (error) {
        next(error);
    }
};

const createTopic = async (req, res, next) => {
    try {
        const topic = await Topic.create({
            ...req.body,
            name: req.body.name.trim(),
            user: req.user._id
        });

        return res.status(201).json({
            success: true,
            message: "Topic created successfully",
            topic
        });
    } catch (error) {
        next(error);
    }
};

const updateTopic = async (req, res, next) => {
    try {
        const allowedFields = [
            "name",
            "progress",
            "notes",
            "problemsSolved",
            "difficulty",
            "revisionDate"
        ];
        const updates = {};

        allowedFields.forEach((field) => {
            if (req.body[field] !== undefined) {
                updates[field] = field === "name" ? req.body[field].trim() : req.body[field];
            }
        });

        const topic = await Topic.findOneAndUpdate(
            { _id: req.params.id, user: req.user._id },
            updates,
            { new: true, runValidators: true }
        );

        if (!topic) {
            return res.status(404).json({
                success: false,
                message: "Topic not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Topic updated successfully",
            topic
        });
    } catch (error) {
        next(error);
    }
};

const deleteTopic = async (req, res, next) => {
    try {
        const topic = await Topic.findOne({ _id: req.params.id, user: req.user._id });

        if (!topic) {
            return res.status(404).json({
                success: false,
                message: "Topic not found"
            });
        }

        const linkedProblemExists = await Problem.exists({
            user: req.user._id,
            topic: topic._id
        });

        if (linkedProblemExists) {
            return res.status(409).json({
                success: false,
                message: "Delete or reassign linked problems before deleting this topic"
            });
        }

        await topic.deleteOne();

        return res.status(200).json({
            success: true,
            message: "Topic deleted successfully"
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getTopics,
    createTopic,
    updateTopic,
    deleteTopic
};
