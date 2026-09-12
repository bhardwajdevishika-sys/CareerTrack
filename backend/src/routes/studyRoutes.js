const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { getSessions, getStudyStats, createSession, deleteSession } = require("../controllers/studyController");

const router = express.Router();
router.use(protect);

router.get("/stats", getStudyStats);
router.route("/").get(getSessions).post(createSession);
router.delete("/:id", deleteSession);

module.exports = router;
