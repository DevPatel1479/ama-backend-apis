// routes/feedbackRoutes.js
const express = require("express");
const router = express.Router();
const { submitFeedback } = require("../controllers/feedback.controller");

// POST /api/feedback/submit
router.post("/submit", submitFeedback);

module.exports = router;
