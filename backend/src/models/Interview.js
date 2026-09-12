const mongoose = require("mongoose");

const interviewSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },
        question: {
            type: String,
            required: true,
            trim: true
        },
        category: {
            type: String,
            enum: ["technical", "HR", "behavioral"],
            required: true
        },
        company: {
            type: String,
            trim: true,
            default: ""
        },
        notes: {
            type: String,
            default: ""
        },
        practiced: {
            type: Boolean,
            default: false
        },
        confidence: {
            type: Number,
            min: 1,
            max: 5,
            default: null
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model("Interview", interviewSchema);
