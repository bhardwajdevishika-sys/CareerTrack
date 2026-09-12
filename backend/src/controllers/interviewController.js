const Interview = require("../models/Interview");

const getInterviews = async (req, res, next) => {
    try {
        const filters = { user: req.user._id };
        if (req.query.category) filters.category = req.query.category;
        if (req.query.company) filters.company = req.query.company;

        const interviews = await Interview.find(filters).sort({ updatedAt: -1 });
        return res.status(200).json({ success: true, interviews });
    } catch (error) {
        next(error);
    }
};

const createInterview = async (req, res, next) => {
    try {
        const interview = await Interview.create({
            ...req.body,
            question: req.body.question.trim(),
            company: req.body.company?.trim() || "",
            notes: req.body.notes || "",
            user: req.user._id
        });

        return res.status(201).json({ success: true, message: "Interview question created successfully", interview });
    } catch (error) {
        next(error);
    }
};

const updateInterview = async (req, res, next) => {
    try {
        const updates = {};
        ["question", "category", "company", "notes", "practiced", "confidence"].forEach((field) => {
            if (req.body[field] !== undefined) {
                updates[field] = ["question", "company"].includes(field) ? req.body[field].trim() : req.body[field];
            }
        });

        const interview = await Interview.findOneAndUpdate(
            { _id: req.params.id, user: req.user._id },
            updates,
            { new: true, runValidators: true }
        );

        if (!interview) return res.status(404).json({ success: false, message: "Interview question not found" });
        return res.status(200).json({ success: true, message: "Interview question updated successfully", interview });
    } catch (error) {
        next(error);
    }
};

const deleteInterview = async (req, res, next) => {
    try {
        const interview = await Interview.findOneAndDelete({ _id: req.params.id, user: req.user._id });
        if (!interview) return res.status(404).json({ success: false, message: "Interview question not found" });
        return res.status(200).json({ success: true, message: "Interview question deleted successfully" });
    } catch (error) {
        next(error);
    }
};

module.exports = { getInterviews, createInterview, updateInterview, deleteInterview };
