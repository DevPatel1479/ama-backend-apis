const express = require("express");
const router = express.Router();

const {
  sendNotificationToAllAdvocates,
  sendNotificationToAllAdvocatesV2,
} = require("../controllers/advocate.notification.controller");

router.post("/send", sendNotificationToAllAdvocates);

router.post("/send/v2", sendNotificationToAllAdvocatesV2);

module.exports = router;
