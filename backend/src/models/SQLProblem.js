const mongoose = require("mongoose");

const SQL_TOPICS = [
    "SELECT", "WHERE", "GROUP BY", "HAVING", "JOIN",
    "Subqueries", "CTE", "Window Functions", "CASE", "Aggregation", "Date Functions"
];
const SQL_PLATFORMS = ["LeetCode", "HackerRank", "SQLZoo", "Mode Analytics", "Other"];
const SQL_STATUS = ["not-started", "attempted", "solved"];
const SQL_DIFFICULTY = ["easy", "medium", "hard"];

const sqlProblemSchema = new mongoose.Schema(
    {
        title: { type: String, required: true, trim: true },
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
        topic: { type: String, enum: SQL_TOPICS, required: true },
        difficulty: { type: String, enum: SQL_DIFFICULTY, required: true },
        platform: { type: String, enum: SQL_PLATFORMS, default: "LeetCode" },
        status: { type: String, enum: SQL_STATUS, default: "not-started" },
        link: { type: String, default: "" },
        notes: { type: String, default: "" },
        xpAwarded: { type: Boolean, default: false },
        solvedAt: { type: Date }
    },
    { timestamps: true }
);

sqlProblemSchema.index({ user: 1, status: 1 });
sqlProblemSchema.index({ user: 1, topic: 1 });

module.exports = mongoose.model("SQLProblem", sqlProblemSchema);
module.exports.SQL_TOPICS = SQL_TOPICS;
module.exports.SQL_PLATFORMS = SQL_PLATFORMS;
module.exports.SQL_STATUS = SQL_STATUS;
module.exports.SQL_DIFFICULTY = SQL_DIFFICULTY;
