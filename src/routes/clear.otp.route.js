const express = require("express");
const router = express.Router();

const {clearOtpSessionForUser} = require("../controllers/clear.otp.controller");


router.post("/clear-otp", clearOtpSessionForUser);

module.exports = router;

