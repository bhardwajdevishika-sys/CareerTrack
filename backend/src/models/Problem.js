const mongoose = require("mongoose");
const {
    DIFFICULTY_VALUES,
    PROBLEM_PLATFORM_VALUES,
    PROBLEM_STATUS_VALUES
} = require("../utils/studyConstants");

const problemSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },
        topic: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Topic",
            required: true,
            index: true
        },
        platform: {
            type: String,
            enum: PROBLEM_PLATFORM_VALUES,
            required: true
        },
        status: {
            type: String,
            enum: PROBLEM_STATUS_VALUES,
            default: "not-started"
        },
        difficulty: {
            type: String,
            enum: DIFFICULTY_VALUES,
            required: true
        },
        link: String,
        notes: String,
        markedForRevision: {
            type: Boolean,
            default: false
        },
        solvedAt: Date
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Problem", problemSchema);
