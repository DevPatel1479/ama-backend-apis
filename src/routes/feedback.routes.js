// routes/feedbackRoutes.js
const express = require("express");
const router = express.Router();
const {
  submitFeedback,
  submitFeedbackV2,
} = require("../controllers/feedback.controller");

// POST /api/feedback/submit
router.post("/submit", submitFeedback);

router.post("/submit/v2", submitFeedbackV2);

module.exports = router;
