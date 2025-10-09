const express = require("express");
const router = express.Router();
const {
  sendTopicNotification,
  getNotificationsByRole,
} = require("../controllers/notification.controller");

router.post("/send-topic-notification", sendTopicNotification);
router.get("/get-notification/:role", getNotificationsByRole);

module.exports = router;
