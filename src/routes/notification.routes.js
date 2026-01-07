const express = require("express");
const router = express.Router();
const {
  sendTopicNotification,
  getNotificationsByRole,
  getUserNotificationHistory,
  getLastSeenNotificationTimestamp,
  storeLastSeenNotificationTimestamp,

  sendTopicNotificationV2,
  getUserNotificationHistoryV2,
} = require("../controllers/notification.controller");

router.post("/send-topic-notification", sendTopicNotification);
router.post("/last-seen", getLastSeenNotificationTimestamp);
router.post("/mark-seen", storeLastSeenNotificationTimestamp);
router.get("/get-notification/:role", getNotificationsByRole);
router.get("/history/:user_id", getUserNotificationHistory);

router.post("/send-topic-notification/v2", sendTopicNotificationV2);
router.get("/history/:user_id/v2", getUserNotificationHistoryV2);

module.exports = router;
