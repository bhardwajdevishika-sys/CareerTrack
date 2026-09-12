const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const {
    validateResourceId,
    validateProblem,
    validateProblemFilters
} = require("../middleware/validateStudyData");
const {
    getProblems,
    createProblem,
    updateProblem,
    deleteProblem
} = require("../controllers/problemController");

const router = express.Router();

router.use(protect);

router.route("/")
    .get(validateProblemFilters, getProblems)
    .post(validateProblem(), createProblem);

router.route("/:id")
    .put(validateResourceId("id"), validateProblem(true), updateProblem)
    .delete(validateResourceId("id"), deleteProblem);

module.exports = router;
