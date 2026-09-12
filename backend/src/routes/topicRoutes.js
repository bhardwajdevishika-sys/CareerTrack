const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const {
    validateResourceId,
    validateTopic
} = require("../middleware/validateStudyData");
const {
    getTopics,
    createTopic,
    updateTopic,
    deleteTopic
} = require("../controllers/topicController");

const router = express.Router();

router.use(protect);

router.route("/")
    .get(getTopics)
    .post(validateTopic(), createTopic);

router.route("/:id")
    .put(validateResourceId("id"), validateTopic(true), updateTopic)
    .delete(validateResourceId("id"), deleteTopic);

module.exports = router;
