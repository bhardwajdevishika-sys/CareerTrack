const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { getApplications, createApplication, updateApplication, deleteApplication } = require("../controllers/jobController");

const router = express.Router();
router.use(protect);
router.route("/").get(getApplications).post(createApplication);
router.route("/:id").put(updateApplication).delete(deleteApplication);

module.exports = router;
