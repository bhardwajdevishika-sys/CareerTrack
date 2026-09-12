const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const multer = require("multer");

const uploadsDirectory = path.join(__dirname, "..", "..", "uploads");

const storage = multer.diskStorage({
    destination: (req, file, callback) => {
        fs.mkdirSync(uploadsDirectory, { recursive: true });
        callback(null, uploadsDirectory);
    },
    filename: (req, file, callback) => {
        callback(null, `${Date.now()}-${crypto.randomUUID()}${path.extname(file.originalname).toLowerCase()}`);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, callback) => {
        const pdfMimeTypes = ["application/pdf", "application/x-pdf", "application/octet-stream"];
        const isPdf = pdfMimeTypes.includes(file.mimetype) && path.extname(file.originalname).toLowerCase() === ".pdf";
        callback(isPdf ? null : new Error("Only PDF resume files are allowed"), isPdf);
    }
});

const uploadResume = (req, res, next) => {
    upload.single("resume")(req, res, (error) => {
        if (!error) return next();

        const message = error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE"
            ? "Resume file must be 5 MB or smaller"
            : error.message;

        return res.status(400).json({ success: false, message });
    });
};

module.exports = { uploadResume, uploadsDirectory };
