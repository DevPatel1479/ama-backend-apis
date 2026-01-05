const express = require("express");
const router = express.Router();
const {
  getLeadByPhone,
  updateUserData,
  getLeadByPhoneV2,
  updateUserDataV2,
} = require("../controllers/lead.controller");

// GET /api/leads/:phone
router.get("/:phone", getLeadByPhone);
router.put("/update", updateUserData);
router.get("/:phone/v2", getLeadByPhoneV2);
router.put("/update/v2", updateUserDataV2);

module.exports = router;
