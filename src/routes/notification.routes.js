const express = require("express");
const router = express.Router();
const {
  sendTopicNotification,
  getNotificationsByRole,
  getNotificationsByRoleV2,
  getUserNotificationHistory,

  sendTopicNotificationV2,
  getUserNotificationHistoryV2,
  getLastOpenedNotificationTime,
  updateLastOpenedNotificationTime,
  adminGetLastOpenedNotificationTime,
  adminUpdateLastOpenedNotificationTime,
} = require("../controllers/notification.controller");

router.post("/send-topic-notification", sendTopicNotification);
router.post("/last-seen", getLastOpenedNotificationTime);
router.post("/mark-seen", updateLastOpenedNotificationTime);

router.post("/admin/last-seen", adminGetLastOpenedNotificationTime);

router.post("/admin/mark-seen", adminUpdateLastOpenedNotificationTime);

router.get("/get-notification/:role", getNotificationsByRole);
router.get("/get-notification/v2/:role", getNotificationsByRoleV2);
router.get("/history/:user_id", getUserNotificationHistory);

router.post("/send-topic-notification/v2", sendTopicNotificationV2);
router.get("/history/:user_id/v2", getUserNotificationHistoryV2);

module.exports = router;
