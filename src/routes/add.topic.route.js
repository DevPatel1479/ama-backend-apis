const express = require("express");
const router = express.Router();
const { assignWeekTopicToClients } = require("../controllers/assign.week.topic.controller");

router.post("/assign-week-topic", assignWeekTopicToClients);

module.exports = router;
