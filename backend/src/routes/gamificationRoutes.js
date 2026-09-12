const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const {
    getGamificationStatus, getXPHistory,
    claimDailyReward, getChallenges,
    getAchievements, buyStreakFreeze, getLeaderboard
} = require("../controllers/gamificationController");

const router = express.Router();
router.use(protect);

router.get("/status", getGamificationStatus);
router.get("/xp-history", getXPHistory);
router.post("/daily-reward", claimDailyReward);
router.get("/challenges", getChallenges);
router.get("/achievements", getAchievements);
router.post("/freeze", buyStreakFreeze);
router.get("/leaderboard", getLeaderboard);

module.exports = router;
