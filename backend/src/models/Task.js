const mongoose = require("mongoose");

const TASK_CATEGORIES = ["DSA", "SQL", "Aptitude", "Development", "Interview", "Communication", "Job Applications", "Other"];
const TASK_PRIORITIES = ["low", "medium", "high"];

const taskSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
        title: { type: String, required: true, trim: true },
        description: { type: String, default: "" },
        category: { type: String, enum: TASK_CATEGORIES, default: "Other" },
        priority: { type: String, enum: TASK_PRIORITIES, default: "medium" },
        dueDate: { type: Date },
        completed: { type: Boolean, default: false },
        completedAt: { type: Date },
        xpAwarded: { type: Boolean, default: false }
    },
    { timestamps: true }
);

taskSchema.index({ user: 1, completed: 1 });
taskSchema.index({ user: 1, dueDate: 1 });

module.exports = mongoose.model("Task", taskSchema);
module.exports.TASK_CATEGORIES = TASK_CATEGORIES;
module.exports.TASK_PRIORITIES = TASK_PRIORITIES;
