const express = require("express");
const router = express.Router();
const {
  sendOtpController,
  verifyOtpController,
  sendOtpControllerV2,
  verifyOtpControllerV2,
} = require("../controllers/otp.controller");

router.post("/send-otp", sendOtpController);
router.post("/verify-otp", verifyOtpController);
router.post("/send-otp/v2", sendOtpControllerV2);
router.post("/verify-otp/v2", verifyOtpControllerV2);

module.exports = router;
