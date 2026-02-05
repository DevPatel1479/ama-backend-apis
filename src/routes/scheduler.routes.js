const express = require("express");
const router = express.Router();

const {
  runScheduledNotifications,
} = require("../controllers/scheduled.worker.controller");

// 🔐 Optional security via header
router.post("/run-scheduler", runScheduledNotifications);

module.exports = router;
