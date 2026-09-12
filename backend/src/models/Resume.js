const mongoose = require("mongoose");

const resumeSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },
        fileName: {
            type: String,
            required: true,
            trim: true
        },
        filePath: {
            type: String,
            required: true
        },
        version: {
            type: Number,
            required: true,
            min: 1
        },
        notes: {
            type: String,
            default: ""
        },
        uploadedAt: {
            type: Date,
            default: Date.now
        }
    },
    { timestamps: true }
);

resumeSchema.index({ user: 1, version: 1 }, { unique: true });

module.exports = mongoose.model("Resume", resumeSchema);
