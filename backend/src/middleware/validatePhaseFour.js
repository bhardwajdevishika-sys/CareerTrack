const mongoose = require("mongoose");

const ROADMAP_TYPES = ["daily", "weekly", "monthly"];
const INTERVIEW_CATEGORIES = ["technical", "HR", "behavioral"];

const sendValidationError = (res, message) => res.status(400).json({ success: false, message });
const isValidDate = (value) => typeof value === "string" && !Number.isNaN(Date.parse(value));

const validateRoadmapItems = (items, res) => {
    if (!Array.isArray(items)) {
        sendValidationError(res, "Roadmap items must be an array");
        return false;
    }

    const hasInvalidItem = items.some((item) =>
        !item || typeof item.description !== "string" || !item.description.trim()
        || (item.targetDate !== undefined && item.targetDate !== null && !isValidDate(item.targetDate))
        || (item.completed !== undefined && typeof item.completed !== "boolean")
    );

    if (hasInvalidItem) {
        sendValidationError(res, "Each roadmap item needs a description, optional valid target date, and boolean completion state");
        return false;
    }

    return true;
};

const validateRoadmap = (isUpdate = false) => (req, res, next) => {
    const { title, type, items } = req.body;
    const hasField = [title, type, items].some((value) => value !== undefined);

    if (!isUpdate && (typeof title !== "string" || !title.trim())) {
        return sendValidationError(res, "Roadmap title is required");
    }

    if (isUpdate && !hasField) {
        return sendValidationError(res, "Provide at least one roadmap field to update");
    }

    if (title !== undefined && (typeof title !== "string" || !title.trim())) {
        return sendValidationError(res, "Roadmap title cannot be empty");
    }

    if (type !== undefined && !ROADMAP_TYPES.includes(type)) {
        return sendValidationError(res, "Roadmap type must be daily, weekly, or monthly");
    }

    if (items !== undefined && !validateRoadmapItems(items, res)) return undefined;

    next();
};

const validateInterview = (isUpdate = false) => (req, res, next) => {
    const { question, category, company, notes, practiced, confidence } = req.body;
    const hasField = [question, category, company, notes, practiced, confidence].some((value) => value !== undefined);

    if (!isUpdate && (typeof question !== "string" || !question.trim())) {
        return sendValidationError(res, "Interview question is required");
    }

    if (!isUpdate && !INTERVIEW_CATEGORIES.includes(category)) {
        return sendValidationError(res, "Interview category must be technical, HR, or behavioral");
    }

    if (isUpdate && !hasField) {
        return sendValidationError(res, "Provide at least one interview field to update");
    }

    if (question !== undefined && (typeof question !== "string" || !question.trim())) {
        return sendValidationError(res, "Interview question cannot be empty");
    }

    if (category !== undefined && !INTERVIEW_CATEGORIES.includes(category)) {
        return sendValidationError(res, "Interview category must be technical, HR, or behavioral");
    }

    if (company !== undefined && typeof company !== "string") {
        return sendValidationError(res, "Company must be text");
    }

    if (notes !== undefined && typeof notes !== "string") {
        return sendValidationError(res, "Interview notes must be text");
    }

    if (practiced !== undefined && typeof practiced !== "boolean") {
        return sendValidationError(res, "Practiced must be a boolean value");
    }

    if (confidence !== undefined && confidence !== null && (!Number.isInteger(confidence) || confidence < 1 || confidence > 5)) {
        return sendValidationError(res, "Confidence must be a whole number from 1 to 5");
    }

    next();
};

const validateInterviewFilters = (req, res, next) => {
    if (req.query.category !== undefined && !INTERVIEW_CATEGORIES.includes(req.query.category)) {
        return sendValidationError(res, "Invalid interview category filter");
    }

    if (req.query.company !== undefined && typeof req.query.company !== "string") {
        return sendValidationError(res, "Invalid company filter");
    }

    next();
};

const validateResumeMetadata = (req, res, next) => {
    if (req.body.notes !== undefined && typeof req.body.notes !== "string") {
        return sendValidationError(res, "Resume notes must be text");
    }

    next();
};

const validateRoadmapItemId = (req, res, next) => {
    if (!mongoose.isValidObjectId(req.params.itemId)) {
        return sendValidationError(res, "Invalid itemId");
    }

    next();
};

module.exports = {
    validateRoadmap,
    validateInterview,
    validateInterviewFilters,
    validateResumeMetadata,
    validateRoadmapItemId
};
