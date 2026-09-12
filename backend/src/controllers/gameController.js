const GameResult = require("../models/GameResult");
const { awardXP } = require("../services/xpService");
const { recordActivity } = require("../services/streakService");

// XP per game type based on score ranges
const calcGameXP = (gameType, score) => {
    if (score <= 0) return 0;
    if (score >= 80) return 15;
    if (score >= 50) return 10;
    return 5;
};

const submitGameResult = async (req, res, next) => {
    try {
        const { gameType, score, duration } = req.body;

        const result = await GameResult.create({
            user: req.user._id,
            gameType,
            score,
            duration
        });

        const xpAmount = calcGameXP(gameType, score);
        let xpResult = { xpAdded: 0 };

        if (xpAmount > 0) {
            xpResult = await awardXP(
                req.user._id,
                "game_complete",
                `Game: ${gameType} (score: ${score})`,
                null, null,
                xpAmount
            );
            result.xpAwarded = xpAmount;
            await result.save();
        }

        await recordActivity(req.user._id);

        return res.status(201).json({ success: true, result, gamification: { xpResult } });
    } catch (error) { next(error); }
};

const getGameStats = async (req, res, next) => {
    try {
        const stats = await GameResult.aggregate([
            { $match: { user: req.user._id } },
            {
                $group: {
                    _id: "$gameType",
                    bestScore: { $max: "$score" },
                    attempts: { $sum: 1 },
                    avgScore: { $avg: "$score" }
                }
            }
        ]);

        return res.json({ success: true, stats });
    } catch (error) { next(error); }
};

module.exports = { submitGameResult, getGameStats };
