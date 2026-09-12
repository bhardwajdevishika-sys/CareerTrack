const mongoose = require("mongoose");
const validator = require("validator");
const {
    TOPIC_PROGRESS_VALUES,
    DIFFICULTY_VALUES,
    PROBLEM_PLATFORM_VALUES,
    PROBLEM_STATUS_VALUES
} = require("../utils/studyConstants");

const sendValidationError = (res, message) => {
    return res.status(400).json({
        success: false,
        message
    });
};

const isNonNegativeInteger = (value) => Number.isInteger(value) && value >= 0;
const isValidDate = (value) => typeof value === "string" && !Number.isNaN(Date.parse(value));

const validateResourceId = (parameterName) => (req, res, next) => {
    if (!mongoose.isValidObjectId(req.params[parameterName])) {
        return sendValidationError(res, `Invalid ${parameterName}`);
    }

    next();
};

const validateTopic = (isUpdate = false) => (req, res, next) => {
    const { name, progress, notes, problemsSolved, difficulty, revisionDate } = req.body;
    const hasTopicField = [name, progress, notes, problemsSolved, difficulty, revisionDate]
        .some((value) => value !== undefined);

    if (!isUpdate && (typeof name !== "string" || !name.trim())) {
        return sendValidationError(res, "Topic name is required");
    }

    if (isUpdate && !hasTopicField) {
        return sendValidationError(res, "Provide at least one topic field to update");
    }

    if (name !== undefined && (typeof name !== "string" || !name.trim())) {
        return sendValidationError(res, "Topic name cannot be empty");
    }

    if (progress !== undefined && !TOPIC_PROGRESS_VALUES.includes(progress)) {
        return sendValidationError(res, "Invalid topic progress value");
    }

    if (notes !== undefined && typeof notes !== "string") {
        return sendValidationError(res, "Topic notes must be text");
    }

    if (problemsSolved !== undefined && !isNonNegativeInteger(problemsSolved)) {
        return sendValidationError(res, "Problems solved must be a non-negative integer");
    }

    if (difficulty !== undefined && !DIFFICULTY_VALUES.includes(difficulty)) {
        return sendValidationError(res, "Invalid topic difficulty value");
    }

    if (revisionDate !== undefined && revisionDate !== null && !isValidDate(revisionDate)) {
        return sendValidationError(res, "Revision date must be a valid ISO date");
    }

    next();
};

const validateProblem = (isUpdate = false) => (req, res, next) => {
    const { title, topic, platform, status, difficulty, link, notes, markedForRevision } = req.body;
    const hasProblemField = [title, topic, platform, status, difficulty, link, notes, markedForRevision]
        .some((value) => value !== undefined);

    if (!isUpdate && (typeof title !== "string" || !title.trim())) {
        return sendValidationError(res, "Problem title is required");
    }

    if (!isUpdate && !mongoose.isValidObjectId(topic)) {
        return sendValidationError(res, "A valid topic is required");
    }

    if (!isUpdate && !PROBLEM_PLATFORM_VALUES.includes(platform)) {
        return sendValidationError(res, "Invalid problem platform value");
    }

    if (!isUpdate && !DIFFICULTY_VALUES.includes(difficulty)) {
        return sendValidationError(res, "Invalid problem difficulty value");
    }

    if (isUpdate && !hasProblemField) {
        return sendValidationError(res, "Provide at least one problem field to update");
    }

    if (title !== undefined && (typeof title !== "string" || !title.trim())) {
        return sendValidationError(res, "Problem title cannot be empty");
    }

    if (topic !== undefined && !mongoose.isValidObjectId(topic)) {
        return sendValidationError(res, "Invalid topic");
    }

    if (platform !== undefined && !PROBLEM_PLATFORM_VALUES.includes(platform)) {
        return sendValidationError(res, "Invalid problem platform value");
    }

    if (status !== undefined && !PROBLEM_STATUS_VALUES.includes(status)) {
        return sendValidationError(res, "Invalid problem status value");
    }

    if (difficulty !== undefined && !DIFFICULTY_VALUES.includes(difficulty)) {
        return sendValidationError(res, "Invalid problem difficulty value");
    }

    if (link !== undefined && (typeof link !== "string" || !validator.isURL(link))) {
        return sendValidationError(res, "Problem link must be a valid URL");
    }

    if (notes !== undefined && typeof notes !== "string") {
        return sendValidationError(res, "Problem notes must be text");
    }

    if (markedForRevision !== undefined && typeof markedForRevision !== "boolean") {
        return sendValidationError(res, "Revision marker must be a boolean value");
    }

    next();
};

const validateProblemFilters = (req, res, next) => {
    const { topic, status, platform, difficulty } = req.query;

    if (topic !== undefined && !mongoose.isValidObjectId(topic)) {
        return sendValidationError(res, "Invalid topic filter");
    }

    if (status !== undefined && !PROBLEM_STATUS_VALUES.includes(status)) {
        return sendValidationError(res, "Invalid status filter");
    }

    if (platform !== undefined && !PROBLEM_PLATFORM_VALUES.includes(platform)) {
        return sendValidationError(res, "Invalid platform filter");
    }

    if (difficulty !== undefined && !DIFFICULTY_VALUES.includes(difficulty)) {
        return sendValidationError(res, "Invalid difficulty filter");
    }

    next();
};

module.exports = {
    validateResourceId,
    validateTopic,
    validateProblem,
    validateProblemFilters
};
