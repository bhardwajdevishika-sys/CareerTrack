const mongoose = require("mongoose");

const dailyRewardSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
        claimedDate: { type: String, required: true }, // YYYY-MM-DD string — prevents tz issues
        xpAwarded: { type: Number, required: true },
        coinsAwarded: { type: Number, required: true },
        streakDay: { type: Number, default: 1 } // consecutive check-in count
    },
    { timestamps: true }
);

dailyRewardSchema.index({ user: 1, claimedDate: 1 }, { unique: true });

module.exports = mongoose.model("DailyReward", dailyRewardSchema);
