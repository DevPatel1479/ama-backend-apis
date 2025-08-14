const express = require("express");
const router = express.Router();
const fcmController = require("../controllers/fcm.controller");

router.post("/store-fcm-token", fcmController.storeFcmToken);
router.put("/update-fcm-token", fcmController.updateFcmToken);

module.exports = router;
