const mongoose = require("mongoose");

const GAME_TYPES = ["memory", "number_sequence", "pattern_recognition", "reaction", "logical_reasoning", "quick_aptitude"];

const gameResultSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
        gameType: { type: String, enum: GAME_TYPES, required: true },
        score: { type: Number, required: true, min: 0 },
        duration: { type: Number }, // seconds
        xpAwarded: { type: Number, default: 0 }
    },
    { timestamps: true }
);

gameResultSchema.index({ user: 1, gameType: 1, score: -1 });

module.exports = mongoose.model("GameResult", gameResultSchema);
module.exports.GAME_TYPES = GAME_TYPES;
