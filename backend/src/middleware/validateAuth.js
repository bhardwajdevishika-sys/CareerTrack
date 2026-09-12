const validator = require("validator");

const sendValidationError = (res, message) => {
    return res.status(400).json({
        success: false,
        message
    });
};

// Validates data required to create a new account before it reaches the controller.
const validateRegistration = (req, res, next) => {
    const { name, email, password } = req.body;

    if (typeof name !== "string" || !name.trim()) {
        return sendValidationError(res, "Name is required");
    }

    if (typeof email !== "string" || !validator.isEmail(email)) {
        return sendValidationError(res, "A valid email is required");
    }

    if (typeof password !== "string" || !validator.isLength(password, { min: 6 })) {
        return sendValidationError(res, "Password must be at least 6 characters long");
    }

    next();
};

// Validates credentials before attempting login.
const validateLogin = (req, res, next) => {
    const { email, password } = req.body;

    if (typeof email !== "string" || !validator.isEmail(email)) {
        return sendValidationError(res, "A valid email is required");
    }

    if (typeof password !== "string" || !password) {
        return sendValidationError(res, "Password is required");
    }

    next();
};

// Allows profile changes while validating only fields that are provided.
const validateProfileUpdate = (req, res, next) => {
    const { name, email } = req.body;

    if (name === undefined && email === undefined) {
        return sendValidationError(res, "Provide a name or email to update");
    }

    if (name !== undefined && (typeof name !== "string" || !name.trim())) {
        return sendValidationError(res, "Name cannot be empty");
    }

    if (email !== undefined && (typeof email !== "string" || !validator.isEmail(email))) {
        return sendValidationError(res, "A valid email is required");
    }

    next();
};

module.exports = {
    validateRegistration,
    validateLogin,
    validateProfileUpdate
};
