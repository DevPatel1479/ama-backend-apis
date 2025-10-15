const express = require("express");
const router = express.Router();

const {
  sendNotificationToAllAdvocates,
} = require("../controllers/advocate.notification.controller");

router.post("/send", sendNotificationToAllAdvocates);

module.exports = router;
