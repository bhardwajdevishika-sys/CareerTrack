const OpenAI = require("openai").default;
const User = require("../models/User");
const Problem = require("../models/Problem");
const SQLProblem = require("../models/SQLProblem");
const StudySession = require("../models/StudySession");
const Goal = require("../models/Goal");
const JobApplication = require("../models/JobApplication");
const { getLevelInfo } = require("../services/xpService");

const getOpenAI = () => {
    const key = process.env.OPENAI_API_KEY;
    if (!key) return null;
    return new OpenAI({ apiKey: key });
};

const buildUserContext = async (userId) => {
    const [user, dsaSolved, sqlSolved, recentStudy, activeGoals, applications] = await Promise.all([
        User.findById(userId).select("name targetRole skills xp level currentStreak longestStreak"),
        Problem.countDocuments({ user: userId, status: "solved" }),
        SQLProblem.countDocuments({ user: userId, status: "solved" }),
        StudySession.aggregate([
            { $match: { user: userId } },
            { $group: { _id: "$category", totalMin: { $sum: "$durationMinutes" } } }
        ]),
        Goal.find({ user: userId, status: "active" }).select("title category deadline").limit(5),
        JobApplication.find({ user: userId }).select("company role status").sort({ applicationDate: -1 }).limit(5)
    ]);

    const levelInfo = getLevelInfo(user.xp);

    return {
        name: user.name,
        targetRole: user.targetRole || "Software Developer",
        skills: user.skills?.join(", ") || "Not specified",
        level: user.level,
        xp: user.xp,
        currentStreak: user.currentStreak,
        dsaSolved,
        sqlSolved,
        studyBreakdown: recentStudy.map((s) => `${s._id}: ${Math.round(s.totalMin / 60)}h`).join(", ") || "No sessions recorded",
        activeGoals: activeGoals.map((g) => `${g.title} (${g.category})`).join(", ") || "None",
        recentApplications: applications.map((a) => `${a.company} - ${a.role} (${a.status})`).join(", ") || "None"
    };
};

const buildSystemPrompt = (ctx) => `You are a CareerTrack AI Career Assistant helping a student with placement preparation.

Student Profile:
- Name: ${ctx.name}
- Target Role: ${ctx.targetRole}
- Skills: ${ctx.skills}
- CareerTrack Level: ${ctx.level} (${ctx.xp} XP)
- Current Streak: ${ctx.currentStreak} days
- DSA Problems Solved: ${ctx.dsaSolved}
- SQL Problems Solved: ${ctx.sqlSolved}
- Study Hours by Category: ${ctx.studyBreakdown}
- Active Goals: ${ctx.activeGoals}
- Recent Job Applications: ${ctx.recentApplications}

Instructions:
1. Give personalized advice based on this actual user data.
2. Identify specific weak areas from the numbers above.
3. Be concise, practical, and motivating.
4. Use bullet points for recommendations.
5. Reference the user's actual stats when making suggestions.
6. Do NOT give generic advice when specific data is available.
7. Keep responses under 400 words.`;

const getFallbackResponse = (ctx, type) => {
    const weakAreas = [];
    if (ctx.dsaSolved < 20) weakAreas.push("DSA fundamentals");
    if (ctx.sqlSolved < 10) weakAreas.push("SQL practice");
    if (ctx.currentStreak < 3) weakAreas.push("daily consistency");

    const responses = {
        daily_plan: `**Today's Personalized Plan for ${ctx.name}:**

• 🧠 **DSA**: ${ctx.dsaSolved < 30 ? "Solve 2 problems (focus on your weaker topics)" : "Attempt 1 hard problem for mastery"}
• 🗄️ **SQL**: ${ctx.sqlSolved < 15 ? "Solve 1 SQL problem — JOINs and aggregations are high-priority" : "Practice Window Functions and CTEs"}
• 📚 **Study**: Log at least 60 minutes of focused prep
• ✅ **Tasks**: Complete 3 tasks from your list
• 🔥 **Streak**: ${ctx.currentStreak > 0 ? `You're on a ${ctx.currentStreak}-day streak — protect it!` : "Start your streak today with any meaningful activity"}

${weakAreas.length > 0 ? `**Focus areas for growth**: ${weakAreas.join(", ")}` : "Keep up the great work!"}`,

        weak_areas: `**Weak Area Analysis for ${ctx.name}:**

${ctx.dsaSolved < 20 ? "• 🔴 **DSA**: Only " + ctx.dsaSolved + " problems solved. Target: 50+ for solid placement readiness.\n" : "• 🟢 **DSA**: Good progress (" + ctx.dsaSolved + " solved)\n"}${ctx.sqlSolved < 10 ? "• 🔴 **SQL**: Only " + ctx.sqlSolved + " problems. SQL is tested in most data/backend roles.\n" : "• 🟢 **SQL**: " + ctx.sqlSolved + " solved — solid foundation\n"}${ctx.currentStreak < 5 ? "• 🟡 **Consistency**: " + ctx.currentStreak + "-day streak. Daily practice is key for placement success.\n" : "• 🟢 **Consistency**: " + ctx.currentStreak + "-day streak — excellent!\n"}

**Priority recommendation**: ${weakAreas.length > 0 ? `Focus on ${weakAreas[0]} first` : "Maintain your strong performance and explore advanced topics"}.`,

        interview_questions: `**Practice Interview Questions for ${ctx.targetRole}:**

**Technical (DSA):**
• Explain time complexity of binary search
• How would you detect a cycle in a linked list?
• Difference between BFS and DFS

**SQL:**
• Write a query to find duplicate records
• Explain the difference between INNER JOIN and LEFT JOIN
• When would you use a CTE vs subquery?

**Behavioral:**
• Tell me about a challenging project you built
• How do you approach debugging a complex problem?
• Describe your preparation strategy for placements

**Role-specific (${ctx.targetRole}):**
• What projects demonstrate your skills?
• How do you stay updated with technology?`,

        recommendations: `**Personalized Recommendations:**

Based on your profile (Level ${ctx.level}, ${ctx.dsaSolved} DSA, ${ctx.sqlSolved} SQL):

${ctx.dsaSolved < 50 ? "1. **DSA Priority**: Aim for 50 solved problems. Focus on Arrays, Trees, and DP\n" : "1. **DSA**: Strong foundation! Move to hard problems\n"}${ctx.sqlSolved < 20 ? "2. **SQL Gap**: Dedicate 20 min/day to SQL — especially JOINs and Window Functions\n" : "2. **SQL**: Good progress! Practice advanced queries\n"}3. **Applications**: ${ctx.recentApplications === "None" ? "Start applying to companies — even practice applications build experience\n" : "You have active applications — prepare role-specific answers\n"}4. **Streak**: ${ctx.currentStreak > 7 ? "Excellent consistency! Consider adding mock interviews\n" : "Build to a 7-day streak for the 'On Fire' achievement and a habit boost\n"}5. **Goals**: ${ctx.activeGoals === "None" ? "Set at least one measurable goal to track progress" : "Review your goals and update progress daily"}`
    };

    return responses[type] || responses.recommendations;
};

const chat = async (req, res, next) => {
    try {
        const { message, type = "chat" } = req.body;
        if (!message) return res.status(400).json({ success: false, message: "Message is required" });

        const ctx = await buildUserContext(req.user._id);
        const openai = getOpenAI();

        if (!openai) {
            // No API key — use smart fallback
            const fallbackTypes = ["daily_plan", "weak_areas", "interview_questions", "recommendations"];
            const matchedType = fallbackTypes.find((t) => message.toLowerCase().includes(t.replace("_", " "))) || type;
            return res.json({
                success: true,
                response: getFallbackResponse(ctx, matchedType),
                source: "fallback"
            });
        }

        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: buildSystemPrompt(ctx) },
                { role: "user", content: message }
            ],
            max_tokens: 600,
            temperature: 0.7
        });

        return res.json({
            success: true,
            response: completion.choices[0].message.content,
            source: "ai"
        });
    } catch (error) {
        // If OpenAI fails, fall back gracefully
        try {
            const ctx = await buildUserContext(req.user._id);
            return res.json({
                success: true,
                response: getFallbackResponse(ctx, req.body.type || "recommendations"),
                source: "fallback"
            });
        } catch {
            next(error);
        }
    }
};

const getInsight = async (req, res, next) => {
    try {
        const { type } = req.params;
        const ctx = await buildUserContext(req.user._id);

        const prompts = {
            daily_plan: "Give me a specific action plan for today based on my current progress and weaknesses.",
            weak_areas: "Analyze my stats and tell me exactly where I'm weakest and what to do about it.",
            career_roadmap: `Create a 4-week roadmap to help me get placed as a ${ctx.targetRole} given my current skill level.`,
            interview_questions: `Give me 5 interview questions I should practice for ${ctx.targetRole} roles based on my current preparation level.`,
            recommendations: "Give me your top 5 actionable recommendations to improve my placement chances this week."
        };

        const prompt = prompts[type] || prompts.recommendations;
        const openai = getOpenAI();

        if (!openai) {
            return res.json({ success: true, response: getFallbackResponse(ctx, type), source: "fallback" });
        }

        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: buildSystemPrompt(ctx) },
                { role: "user", content: prompt }
            ],
            max_tokens: 600,
            temperature: 0.7
        });

        return res.json({ success: true, response: completion.choices[0].message.content, source: "ai" });
    } catch (error) {
        try {
            const ctx = await buildUserContext(req.user._id);
            return res.json({ success: true, response: getFallbackResponse(ctx, req.params.type || "recommendations"), source: "fallback" });
        } catch {
            next(error);
        }
    }
};

module.exports = { chat, getInsight };
