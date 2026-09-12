const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { chat, getInsight } = require("../controllers/aiController");

const router = express.Router();
router.use(protect);
router.post("/chat", chat);
router.get("/insight/:type", getInsight);

module.exports = router;
