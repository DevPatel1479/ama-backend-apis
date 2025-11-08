// routes/file.dispute.routes.js
const express = require("express");
const router = express.Router();
const { fileDispute } = require("../controllers/file.dispute.controller");

// POST /api/file-dispute
router.post("/file-dispute", fileDispute);

module.exports = router;
