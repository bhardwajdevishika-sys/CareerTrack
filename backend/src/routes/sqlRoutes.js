const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { getSQLProblems, createSQLProblem, updateSQLProblem, deleteSQLProblem } = require("../controllers/sqlController");

const router = express.Router();
router.use(protect);

router.route("/").get(getSQLProblems).post(createSQLProblem);
router.route("/:id").put(updateSQLProblem).delete(deleteSQLProblem);

module.exports = router;
