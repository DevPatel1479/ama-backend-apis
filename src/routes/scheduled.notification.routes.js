const express = require("express");
const router = express.Router();

const {
  createScheduledNotification,
  getDueScheduledNotifications,
  updateScheduledNotificationStatus,
} = require("../controllers/scheduled.notification.controller");

// From Flutter app
router.post("/schedule", createScheduledNotification);

// From Cloud Scheduler / Cloud Function
router.get("/schedule/due", getDueScheduledNotifications);

// Update after send (sent / failed)
router.post("/schedule/status", updateScheduledNotificationStatus);

module.exports = router;
