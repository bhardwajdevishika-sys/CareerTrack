const express = require("express");
const {
    register,
    login,
    getProfile,
    updateProfile,
    logout
} = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");
const {
    validateRegistration,
    validateLogin,
    validateProfileUpdate
} = require("../middleware/validateAuth");

// Defines public and protected authentication API endpoints.
const router = express.Router();

router.post("/register", validateRegistration, register);
router.post("/login", validateLogin, login);
router.get("/me", protect, getProfile);
router.put("/profile", protect, validateProfileUpdate, updateProfile);
router.post("/logout", protect, logout);

module.exports = router;
