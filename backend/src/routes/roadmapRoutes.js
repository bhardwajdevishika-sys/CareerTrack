const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { validateResourceId } = require("../middleware/validateStudyData");
const { validateRoadmap, validateRoadmapItemId } = require("../middleware/validatePhaseFour");
const { getRoadmaps, createRoadmap, updateRoadmap, deleteRoadmap, toggleRoadmapItem } = require("../controllers/roadmapController");

const router = express.Router();

router.use(protect);
router.route("/").get(getRoadmaps).post(validateRoadmap(), createRoadmap);
router.put("/:id/items/:itemId/toggle", validateResourceId("id"), validateRoadmapItemId, toggleRoadmapItem);
router.route("/:id").put(validateResourceId("id"), validateRoadmap(true), updateRoadmap).delete(validateResourceId("id"), deleteRoadmap);

module.exports = router;
