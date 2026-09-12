require("dotenv").config();

const app = require("./app");
const connectDB = require("./config/db");
const { seedAchievements } = require("./services/achievementService");

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    await connectDB();

    // Seed static achievement definitions once on startup
    try {
        await seedAchievements();
        console.log("Achievements seeded.");
    } catch (err) {
        console.error("Achievement seeding failed (non-fatal):", err.message);
    }

    app.listen(PORT, () => {
        console.log(`CareerTrack server running on port ${PORT}`);
    });
};

startServer();
