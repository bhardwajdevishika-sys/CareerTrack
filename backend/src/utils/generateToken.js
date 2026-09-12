const jwt = require("jsonwebtoken");

// Creates the signed token returned after successful authentication.
const generateToken = (userId) => {
    return jwt.sign(
        { userId },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
    );
};

module.exports = generateToken;
