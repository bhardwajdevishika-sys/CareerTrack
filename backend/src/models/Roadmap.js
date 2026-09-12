const mongoose = require("mongoose");

const roadmapItemSchema = new mongoose.Schema(
    {
        description: {
            type: String,
            required: true,
            trim: true
        },
        targetDate: Date,
        completed: {
            type: Boolean,
            default: false
        }
    },
    { timestamps: true }
);

const roadmapSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },
        title: {
            type: String,
            required: true,
            trim: true
        },
        type: {
            type: String,
            enum: ["daily", "weekly", "monthly"],
            default: "weekly"
        },
        items: {
            type: [roadmapItemSchema],
            default: []
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model("Roadmap", roadmapSchema);
