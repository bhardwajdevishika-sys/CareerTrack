const mongoose = require("mongoose");
const {
    TOPIC_PROGRESS_VALUES,
    DIFFICULTY_VALUES
} = require("../utils/studyConstants");

const topicSchema = new mongoose.Schema(
    {
        name: {
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
        progress: {
            type: String,
            enum: TOPIC_PROGRESS_VALUES,
            default: "not-started"
        },
        notes: {
            type: String,
            default: ""
        },
        problemsSolved: {
            type: Number,
            min: 0,
            default: 0
        },
        difficulty: {
            type: String,
            enum: DIFFICULTY_VALUES,
            default: "medium"
        },
        revisionDate: Date
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Topic", topicSchema);
