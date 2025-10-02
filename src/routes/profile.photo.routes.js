const express = require("express");
const router = express.Router();
const {
  uploadProfilePhoto,
  updateProfilePhoto,
} = require("../controllers/profile.upload.controller");

router.post("/upload-profile", uploadProfilePhoto);
router.post("/update-profile", updateProfilePhoto);

module.exports = router;
