const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { validateResourceId } = require("../middleware/validateStudyData");
const { validateResumeMetadata } = require("../middleware/validatePhaseFour");
const { uploadResume: uploadResumeFile } = require("../middleware/resumeUpload");

const {
    getResumes,
    uploadResume,
    analyzeResume,
    deleteResume,
    downloadResume
} = require("../controllers/resumeController");

const router = express.Router();

router.use(protect);

router
    .route("/")
    .get(getResumes)
    .post(uploadResumeFile, validateResumeMetadata, uploadResume);

router.post(
    "/:id/analyze",
    validateResourceId("id"),
    analyzeResume
);

router.get(
    "/:id/download",
    validateResourceId("id"),
    downloadResume
);

router.delete(
    "/:id",
    validateResourceId("id"),
    deleteResume
);

module.exports = router;