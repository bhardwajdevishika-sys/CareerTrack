/**
 * Achievement Service
 *
 * Checks all relevant achievements after user activity.
 * Unlocks automatically if threshold met and not already unlocked.
 */

const { Achievement, UserAchievement } = require("../models/Achievement");
const { awardXP } = require("./xpService");
const User = require("../models/User");
const Problem = require("../models/Problem");
const SQLProblem = require("../models/SQLProblem");
const StudySession = require("../models/StudySession");
const Goal = require("../models/Goal");

/**
 * Seed achievements into DB if not already there.
 * Call once at server startup.
 */
const seedAchievements = async () => {
    const ACHIEVEMENTS = [
        { slug: "first_step", title: "First Step", description: "Complete your first activity", icon: "🌱", category: "general", xpReward: 10, condition: { metric: "any_activity", threshold: 1 } },
        { slug: "dsa_beginner", title: "DSA Beginner", description: "Solve 10 DSA problems", icon: "💡", category: "dsa", xpReward: 20, condition: { metric: "dsa_solved", threshold: 10 } },
        { slug: "dsa_intermediate", title: "DSA Hustler", description: "Solve 25 DSA problems", icon: "⚡", category: "dsa", xpReward: 30, condition: { metric: "dsa_solved", threshold: 25 } },
        { slug: "dsa_warrior", title: "DSA Warrior", description: "Solve 50 DSA problems", icon: "🗡️", category: "dsa", xpReward: 50, condition: { metric: "dsa_solved", threshold: 50 } },
        { slug: "dsa_master", title: "DSA Master", description: "Solve 100 DSA problems", icon: "🏆", category: "dsa", xpReward: 100, condition: { metric: "dsa_solved", threshold: 100 } },
        { slug: "sql_starter", title: "SQL Starter", description: "Solve 5 SQL problems", icon: "🗄️", category: "sql", xpReward: 15, condition: { metric: "sql_solved", threshold: 5 } },
        { slug: "sql_analyst", title: "SQL Analyst", description: "Solve 25 SQL problems", icon: "📊", category: "sql", xpReward: 40, condition: { metric: "sql_solved", threshold: 25 } },
        { slug: "sql_master", title: "SQL Master", description: "Solve 50 SQL problems", icon: "🧮", category: "sql", xpReward: 75, condition: { metric: "sql_solved", threshold: 50 } },
        { slug: "streak_week", title: "On Fire", description: "Maintain a 7-day streak", icon: "🔥", category: "streak", xpReward: 30, condition: { metric: "streak", threshold: 7 } },
        { slug: "streak_month", title: "Dedicated", description: "Maintain a 30-day streak", icon: "🌟", category: "streak", xpReward: 100, condition: { metric: "streak", threshold: 30 } },
        { slug: "streak_hundred", title: "Unstoppable", description: "Maintain a 100-day streak", icon: "💎", category: "streak", xpReward: 300, condition: { metric: "streak", threshold: 100 } },
        { slug: "study_10", title: "Focused", description: "Log 10 study sessions", icon: "📚", category: "study", xpReward: 25, condition: { metric: "study_sessions", threshold: 10 } },
        { slug: "study_50", title: "Scholar", description: "Log 50 study sessions", icon: "🎓", category: "study", xpReward: 75, condition: { metric: "study_sessions", threshold: 50 } },
        { slug: "goal_crusher", title: "Goal Crusher", description: "Complete your first goal", icon: "🎯", category: "goals", xpReward: 30, condition: { metric: "goals_completed", threshold: 1 } },
        { slug: "goal_achiever", title: "Achiever", description: "Complete 5 goals", icon: "🏅", category: "goals", xpReward: 60, condition: { metric: "goals_completed", threshold: 5 } },
        { slug: "task_starter", title: "Task Starter", description: "Complete 10 tasks", icon: "✅", category: "tasks", xpReward: 15, condition: { metric: "tasks_completed", threshold: 10 } },
        { slug: "task_master", title: "Task Master", description: "Complete 50 tasks", icon: "📋", category: "tasks", xpReward: 50, condition: { metric: "tasks_completed", threshold: 50 } },
        { slug: "level_5", title: "Rising Star", description: "Reach Level 5", icon: "⭐", category: "general", xpReward: 0, condition: { metric: "level", threshold: 5 } },
        { slug: "level_10", title: "Career Builder", description: "Reach Level 10", icon: "🚀", category: "general", xpReward: 0, condition: { metric: "level", threshold: 10 } },
        { slug: "career_ready", title: "Career Ready", description: "Reach Level 15", icon: "💼", category: "general", xpReward: 0, condition: { metric: "level", threshold: 15 } },
    ];

    for (const a of ACHIEVEMENTS) {
        await Achievement.findOneAndUpdate({ slug: a.slug }, a, { upsert: true, new: true });
    }
};

/**
 * Check and unlock achievements for a user.
 * Returns newly unlocked achievements.
 */
const checkAchievements = async (userId) => {
    const [allAchievements, alreadyUnlocked, user, dsaCount, sqlCount, studyCount, goalsCount] = await Promise.all([
        Achievement.find({}),
        UserAchievement.find({ user: userId }).select("achievement"),
        User.findById(userId).select("currentStreak level"),
        Problem.countDocuments({ user: userId, status: "solved" }),
        SQLProblem.countDocuments({ user: userId, status: "solved" }),
        StudySession.countDocuments({ user: userId }),
        Goal.countDocuments({ user: userId, status: "completed" }),
    ]);

    const unlockedIds = new Set(alreadyUnlocked.map((ua) => ua.achievement.toString()));
    const locked = allAchievements.filter((a) => !unlockedIds.has(a._id.toString()));
    const newlyUnlocked = [];

    for (const achievement of locked) {
        const { metric, threshold } = achievement.condition;
        let metricValue = 0;

        switch (metric) {
            case "dsa_solved":        metricValue = dsaCount; break;
            case "sql_solved":        metricValue = sqlCount; break;
            case "study_sessions":    metricValue = studyCount; break;
            case "goals_completed":   metricValue = goalsCount; break;
            case "streak":            metricValue = user.currentStreak; break;
            case "level":             metricValue = user.level; break;
            case "any_activity":      metricValue = dsaCount + sqlCount + studyCount; break;
            default:                  metricValue = 0;
        }

        if (metricValue >= threshold) {
            await UserAchievement.create({ user: userId, achievement: achievement._id });
            if (achievement.xpReward > 0) {
                await awardXP(userId, "achievement_unlock", `Achievement: ${achievement.title}`, achievement._id.toString(), "Achievement", achievement.xpReward);
            }
            newlyUnlocked.push(achievement);
        }
    }

    return newlyUnlocked;
};

module.exports = { checkAchievements, seedAchievements };
