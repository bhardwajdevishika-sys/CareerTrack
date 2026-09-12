const fs = require("fs");
const path = require("path");
const { PDFParse } = require("pdf-parse");

const Resume = require("../models/Resume");
const { uploadsDirectory } = require("../middleware/resumeUpload");

const getResumes = async (req, res, next) => {
    try {
        const resumes = await Resume.find({
            user: req.user._id
        }).sort({ version: -1 });

        return res.status(200).json({
            success: true,
            resumes
        });
    } catch (error) {
        next(error);
    }
};

const uploadResume = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "A PDF resume file is required"
            });
        }

        const latestResume = await Resume.findOne({
            user: req.user._id
        })
            .sort({ version: -1 })
            .select("version");

        const resume = await Resume.create({
            user: req.user._id,
            fileName: req.file.originalname,
            filePath: req.file.filename,
            version: (latestResume?.version || 0) + 1,
            notes: req.body.notes?.trim() || "",
            uploadedAt: new Date()
        });

        return res.status(201).json({
            success: true,
            message: "Resume uploaded successfully",
            resume
        });
    } catch (error) {
        next(error);
    }
};

const analyzeResume = async (req, res, next) => {
    try {
        const resume = await Resume.findOne({
            _id: req.params.id,
            user: req.user._id
        });

        if (!resume) {
            return res.status(404).json({
                success: false,
                message: "Resume not found"
            });
        }

        const filePath = path.join(
            uploadsDirectory,
            resume.filePath
        );

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({
                success: false,
                message: "Resume file is unavailable"
            });
        }

        const pdfBuffer = await fs.promises.readFile(filePath);

        // pdf-parse v2 API
        const parser = new PDFParse({
            data: pdfBuffer
        });

        const result = await parser.getText();

        await parser.destroy();

        const extractedText = result.text?.trim();

        if (!extractedText) {
            return res.status(400).json({
                success: false,
                message: "Could not extract text from this PDF"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Resume text extracted successfully",
            analysis: {
                resumeId: resume._id,
                fileName: resume.fileName,
                text: extractedText,
                pages: result.total || result.numpages || 0
            }
        });
    } catch (error) {
        next(error);
    }
};

const deleteResume = async (req, res, next) => {
    try {
        const resume = await Resume.findOne({
            _id: req.params.id,
            user: req.user._id
        });

        if (!resume) {
            return res.status(404).json({
                success: false,
                message: "Resume not found"
            });
        }

        const filePath = path.join(
            uploadsDirectory,
            resume.filePath
        );

        await fs.promises.unlink(filePath).catch((error) => {
            if (error.code !== "ENOENT") {
                throw error;
            }
        });

        await resume.deleteOne();

        return res.status(200).json({
            success: true,
            message: "Resume deleted successfully"
        });
    } catch (error) {
        next(error);
    }
};

const downloadResume = async (req, res, next) => {
    try {
        const resume = await Resume.findOne({
            _id: req.params.id,
            user: req.user._id
        });

        if (!resume) {
            return res.status(404).json({
                success: false,
                message: "Resume not found"
            });
        }

        const filePath = path.join(
            uploadsDirectory,
            resume.filePath
        );

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({
                success: false,
                message: "Resume file is unavailable"
            });
        }

        return res.download(
            filePath,
            resume.fileName,
            (error) => {
                if (error && !res.headersSent) {
                    next(error);
                }
            }
        );
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getResumes,
    uploadResume,
    analyzeResume,
    deleteResume,
    downloadResume
};
