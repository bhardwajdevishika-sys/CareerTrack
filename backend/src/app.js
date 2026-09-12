const express = require("express");
const cors = require("cors");

// Existing routes
const authRoutes = require("./routes/authRoutes");
const topicRoutes = require("./routes/topicRoutes");
const problemRoutes = require("./routes/problemRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const roadmapRoutes = require("./routes/roadmapRoutes");
const interviewRoutes = require("./routes/interviewRoutes");
const resumeRoutes = require("./routes/resumeRoutes");
const notificationRoutes = require("./routes/notificationRoutes");

// New CareerTrack routes
const sqlRoutes = require("./routes/sqlRoutes");
const goalRoutes = require("./routes/goalRoutes");
const taskRoutes = require("./routes/taskRoutes");
const studyRoutes = require("./routes/studyRoutes");
const gamificationRoutes = require("./routes/gamificationRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const aiRoutes = require("./routes/aiRoutes");
const jobRoutes = require("./routes/jobRoutes");
const gameRoutes = require("./routes/gameRoutes");
const noteRoutes = require("./routes/noteRoutes");

const { notFound, errorHandler } = require("./middleware/errorMiddleware");

const app = express();

app.use(cors({
    origin: [
        "http://localhost:5173",
        "https://prep-pilot-sand.vercel.app"
    ],
    credentials: true
}));
app.use(express.json());

// ── Existing API routes ────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/topics", topicRoutes);
app.use("/api/problems", problemRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/roadmap", roadmapRoutes);
app.use("/api/interviews", interviewRoutes);
app.use("/api/resume", resumeRoutes);
app.use("/api/notifications", notificationRoutes);

// ── New CareerTrack API routes ─────────────────────────────────────────────────
app.use("/api/sql", sqlRoutes);
app.use("/api/goals", goalRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/study", studyRoutes);
app.use("/api/gamification", gamificationRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/games", gameRoutes);
app.use("/api/notes", noteRoutes);

// ── Health & info ──────────────────────────────────────────────────────────────
app.get("/", (_req, res) => res.send("CareerTrack Backend — Running"));
app.get("/health", (_req, res) => res.json({ status: "OK" }));

app.use(notFound);
app.use(errorHandler);

module.exports = app;
