const express = require("express");
const router = express.Router();
const { updateLoginStatus } = require("../controllers/login.status.controller");

router.post("/login-status", updateLoginStatus);

module.exports = router;
