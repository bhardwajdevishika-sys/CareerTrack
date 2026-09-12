const JobApplication = require("../models/JobApplication");

const getApplications = async (req, res, next) => {
    try {
        const { status } = req.query;
        const filters = { user: req.user._id };
        if (status) filters.status = status;

        const applications = await JobApplication.find(filters).sort({ applicationDate: -1 });

        // Analytics summary
        const stats = await JobApplication.aggregate([
            { $match: { user: req.user._id } },
            { $group: { _id: "$status", count: { $sum: 1 } } }
        ]);

        return res.json({ success: true, applications, stats });
    } catch (error) { next(error); }
};

const createApplication = async (req, res, next) => {
    try {
        const application = await JobApplication.create({ ...req.body, user: req.user._id });
        return res.status(201).json({ success: true, message: "Application saved", application });
    } catch (error) { next(error); }
};

const updateApplication = async (req, res, next) => {
    try {
        const application = await JobApplication.findOne({ _id: req.params.id, user: req.user._id });
        if (!application) return res.status(404).json({ success: false, message: "Application not found" });

        ["company", "role", "applicationDate", "status", "jobLink", "notes", "interviewStage", "salary", "location"].forEach((f) => {
            if (req.body[f] !== undefined) application[f] = req.body[f];
        });

        await application.save();
        return res.json({ success: true, message: "Application updated", application });
    } catch (error) { next(error); }
};

const deleteApplication = async (req, res, next) => {
    try {
        const application = await JobApplication.findOne({ _id: req.params.id, user: req.user._id });
        if (!application) return res.status(404).json({ success: false, message: "Application not found" });
        await application.deleteOne();
        return res.json({ success: true, message: "Application deleted" });
    } catch (error) { next(error); }
};

module.exports = { getApplications, createApplication, updateApplication, deleteApplication };
