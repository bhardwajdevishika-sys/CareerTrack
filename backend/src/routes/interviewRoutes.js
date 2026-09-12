const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { validateResourceId } = require("../middleware/validateStudyData");
const { validateInterview, validateInterviewFilters } = require("../middleware/validatePhaseFour");
const { getInterviews, createInterview, updateInterview, deleteInterview } = require("../controllers/interviewController");

const router = express.Router();

router.use(protect);
router.route("/").get(validateInterviewFilters, getInterviews).post(validateInterview(), createInterview);
router.route("/:id").put(validateResourceId("id"), validateInterview(true), updateInterview).delete(validateResourceId("id"), deleteInterview);

module.exports = router;
