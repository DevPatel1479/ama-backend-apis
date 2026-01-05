const express = require("express");
const router = express.Router();
const {
  uploadProfilePhoto,
  updateProfilePhoto,
  getProfilePhoto,
  uploadProfilePhotoV2,
  updateProfilePhotoV2,
  getProfilePhotoV2,
} = require("../controllers/profile.upload.controller");

router.post("/upload-profile", uploadProfilePhoto);
router.post("/update-profile", updateProfilePhoto);
router.post("/get-photo", getProfilePhoto);

router.post("/upload-profile/v2", uploadProfilePhotoV2);
router.post("/update-profile/v2", updateProfilePhotoV2);
router.post("/get-photo/v2", getProfilePhotoV2);

module.exports = router;
