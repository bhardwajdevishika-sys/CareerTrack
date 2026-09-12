const Roadmap = require("../models/Roadmap");

const getRoadmaps = async (req, res, next) => {
    try {
        const roadmaps = await Roadmap.find({ user: req.user._id }).sort({ updatedAt: -1 });
        return res.status(200).json({ success: true, roadmaps });
    } catch (error) {
        next(error);
    }
};

const createRoadmap = async (req, res, next) => {
    try {
        const roadmap = await Roadmap.create({
            title: req.body.title.trim(),
            type: req.body.type,
            items: req.body.items || [],
            user: req.user._id
        });

        return res.status(201).json({ success: true, message: "Roadmap created successfully", roadmap });
    } catch (error) {
        next(error);
    }
};

const updateRoadmap = async (req, res, next) => {
    try {
        const updates = {};
        ["title", "type", "items"].forEach((field) => {
            if (req.body[field] !== undefined) updates[field] = field === "title" ? req.body[field].trim() : req.body[field];
        });

        const roadmap = await Roadmap.findOneAndUpdate(
            { _id: req.params.id, user: req.user._id },
            updates,
            { new: true, runValidators: true }
        );

        if (!roadmap) return res.status(404).json({ success: false, message: "Roadmap not found" });
        return res.status(200).json({ success: true, message: "Roadmap updated successfully", roadmap });
    } catch (error) {
        next(error);
    }
};

const deleteRoadmap = async (req, res, next) => {
    try {
        const roadmap = await Roadmap.findOneAndDelete({ _id: req.params.id, user: req.user._id });
        if (!roadmap) return res.status(404).json({ success: false, message: "Roadmap not found" });
        return res.status(200).json({ success: true, message: "Roadmap deleted successfully" });
    } catch (error) {
        next(error);
    }
};

const toggleRoadmapItem = async (req, res, next) => {
    try {
        const roadmap = await Roadmap.findOne({ _id: req.params.id, user: req.user._id });
        if (!roadmap) return res.status(404).json({ success: false, message: "Roadmap not found" });

        const item = roadmap.items.id(req.params.itemId);
        if (!item) return res.status(404).json({ success: false, message: "Roadmap item not found" });

        item.completed = !item.completed;
        await roadmap.save();
        return res.status(200).json({ success: true, message: "Roadmap item updated successfully", roadmap });
    } catch (error) {
        next(error);
    }
};

module.exports = { getRoadmaps, createRoadmap, updateRoadmap, deleteRoadmap, toggleRoadmapItem };
