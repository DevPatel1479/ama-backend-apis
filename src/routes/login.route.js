const express = require("express");
const router = express.Router();
const { loginUser, loginUserV2 } = require("../controllers/login.controller");

router.post("/login", loginUser);
router.post("/login/v2", loginUserV2);
module.exports = router;
