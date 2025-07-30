const express = require("express");
const router = express.Router();
const { sendOtpController, verifyOtpController } = require("../controllers/otp.controller");

router.post("/send-otp", sendOtpController);
router.post("/verify-otp", verifyOtpController);

module.exports = router;
