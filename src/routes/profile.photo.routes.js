const express = require("express");
const router = express.Router();
const {
  uploadProfilePhoto,
  updateProfilePhoto,
  getProfilePhoto,
} = require("../controllers/profile.upload.controller");

router.post("/upload-profile", uploadProfilePhoto);
router.post("/update-profile", updateProfilePhoto);
router.post("/get-photo", getProfilePhoto);

module.exports = router;
