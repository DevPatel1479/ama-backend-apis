const express = require("express");
const router = express.Router();
const fcmController = require("../controllers/fcm.controller");

router.post("/store-fcm-token", fcmController.storeFcmToken);
router.put("/update-fcm-token", fcmController.updateFcmToken);

router.post("/store-fcm-token/v2", fcmController.storeFcmTokenV2);
router.put("/update-fcm-token/v2", fcmController.updateFcmTokenV2);

module.exports = router;
