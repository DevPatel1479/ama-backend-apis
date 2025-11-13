const express = require("express");
const router = express.Router();
const {
  sendTopicNotification,
  getNotificationsByRole,
  getUserNotificationHistory,
} = require("../controllers/notification.controller");

router.post("/send-topic-notification", sendTopicNotification);
router.get("/get-notification/:role", getNotificationsByRole);
router.get("/history/:user_id", getUserNotificationHistory);

module.exports = router;
