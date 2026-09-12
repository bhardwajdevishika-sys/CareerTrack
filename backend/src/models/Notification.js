const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },
        message: {
            type: String,
            required: true,
            trim: true
        },
        type: {
            type: String,
            enum: ["revision-due", "streak", "system", "achievement", "level-up", "challenge", "reward", "ai"],
            default: "system"
        },
        read: {
            type: Boolean,
            default: false
        },
        topic: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Topic"
        },
        dueDate: Date
    },
    { timestamps: true }
);

notificationSchema.index({ user: 1, createdAt: -1 });
notificationSchema.index({ user: 1, type: 1, topic: 1, dueDate: 1 });

module.exports = mongoose.model("Notification", notificationSchema);
