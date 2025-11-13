const express = require("express");
const router = express.Router();
const {
  getLeadByPhone,
  updateUserData,
} = require("../controllers/lead.controller");

// GET /api/leads/:phone
router.get("/:phone", getLeadByPhone);
router.put("/update", updateUserData);

module.exports = router;
