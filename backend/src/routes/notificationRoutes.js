const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { validateResourceId } = require("../middleware/validateStudyData");
const { getNotifications, markNotificationRead, markAllNotificationsRead } = require("../controllers/notificationController");

const router = express.Router();

router.use(protect);
router.get("/", getNotifications);
router.put("/read-all", markAllNotificationsRead);
router.put("/:id/read", validateResourceId("id"), markNotificationRead);

module.exports = router;
