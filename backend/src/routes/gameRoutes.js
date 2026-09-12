const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { submitGameResult, getGameStats } = require("../controllers/gameController");

const router = express.Router();
router.use(protect);
router.post("/result", submitGameResult);
router.get("/stats", getGameStats);

module.exports = router;
