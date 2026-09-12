const Notification = require("../models/Notification");

const getNotifications = async (req, res, next) => {
    try {
        const notifications = await Notification.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(30);
        return res.status(200).json({ success: true, notifications });
    } catch (error) {
        next(error);
    }
};

const markNotificationRead = async (req, res, next) => {
    try {
        const notification = await Notification.findOneAndUpdate(
            { _id: req.params.id, user: req.user._id },
            { read: true },
            { new: true }
        );

        if (!notification) return res.status(404).json({ success: false, message: "Notification not found" });
        return res.status(200).json({ success: true, message: "Notification marked as read", notification });
    } catch (error) {
        next(error);
    }
};

const markAllNotificationsRead = async (req, res, next) => {
    try {
        const result = await Notification.updateMany({ user: req.user._id, read: false }, { read: true });
        return res.status(200).json({ success: true, message: "All notifications marked as read", updatedCount: result.modifiedCount });
    } catch (error) {
        next(error);
    }
};

module.exports = { getNotifications, markNotificationRead, markAllNotificationsRead };
