const mongoose = require("mongoose");

const JOB_STATUSES = ["saved", "applied", "assessment", "interview", "selected", "rejected"];

const jobApplicationSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
        company: { type: String, required: true, trim: true },
        role: { type: String, required: true, trim: true },
        applicationDate: { type: Date, default: Date.now },
        status: { type: String, enum: JOB_STATUSES, default: "saved" },
        jobLink: { type: String, default: "" },
        notes: { type: String, default: "" },
        interviewStage: { type: String, default: "" },
        salary: { type: String, default: "" },
        location: { type: String, default: "" }
    },
    { timestamps: true }
);

jobApplicationSchema.index({ user: 1, status: 1 });
jobApplicationSchema.index({ user: 1, applicationDate: -1 });

module.exports = mongoose.model("JobApplication", jobApplicationSchema);
module.exports.JOB_STATUSES = JOB_STATUSES;
