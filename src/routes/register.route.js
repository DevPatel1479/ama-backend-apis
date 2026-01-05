const express = require("express");
const router = express.Router();
const {
  registerUser,
  registerUserV2,
} = require("../controllers/register.controller");

router.post("/register", registerUser);
router.post("/register/v2", registerUserV2);

module.exports = router;
