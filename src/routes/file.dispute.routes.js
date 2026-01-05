// routes/file.dispute.routes.js
const express = require("express");
const router = express.Router();
const {
  fileDispute,
  fileDisputeV2,
} = require("../controllers/file.dispute.controller");

// POST /api/file-dispute
router.post("/file-dispute", fileDispute);

router.post("/file-dispute/v2", fileDisputeV2);
module.exports = router;
