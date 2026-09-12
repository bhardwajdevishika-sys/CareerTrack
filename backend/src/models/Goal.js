const mongoose = require("mongoose");

const GOAL_CATEGORIES = ["DSA", "SQL", "Development", "Interview", "Aptitude", "Job Applications", "Study", "Other"];
const GOAL_PRIORITIES = ["low", "medium", "high"];
const GOAL_STATUSES = ["active", "completed", "paused"];

const goalSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
        title: { type: String, required: true, trim: true },
        description: { type: String, default: "" },
        category: { type: String, enum: GOAL_CATEGORIES, required: true },
        priority: { type: String, enum: GOAL_PRIORITIES, default: "medium" },
        deadline: { type: Date },
        targetValue: { type: Number, default: 1, min: 1 },
        currentValue: { type: Number, default: 0, min: 0 },
        status: { type: String, enum: GOAL_STATUSES, default: "active" },
        completedAt: { type: Date },
        xpAwarded: { type: Boolean, default: false }
    },
    { timestamps: true }
);

goalSchema.virtual("progressPercent").get(function () {
    if (this.targetValue === 0) return 0;
    return Math.min(100, Math.round((this.currentValue / this.targetValue) * 100));
});

goalSchema.set("toJSON", { virtuals: true });

module.exports = mongoose.model("Goal", goalSchema);
module.exports.GOAL_CATEGORIES = GOAL_CATEGORIES;
module.exports.GOAL_PRIORITIES = GOAL_PRIORITIES;
module.exports.GOAL_STATUSES = GOAL_STATUSES;
