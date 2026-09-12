// Converts unknown routes and application errors into consistent API responses.
const notFound = (req, res, next) => {
    res.status(404);
    next(new Error(`Route not found: ${req.originalUrl}`));
};

const errorHandler = (error, req, res, next) => {
    let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    let message = error.message || "Internal server error";

    if (error.code === 11000) {
        statusCode = 409;
        message = "An account with this email already exists";
    }

    res.status(statusCode).json({
        success: false,
        message
    });
};

module.exports = {
    notFound,
    errorHandler
};
