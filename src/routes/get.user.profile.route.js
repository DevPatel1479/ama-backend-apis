const express = require('express');
const router = express.Router();
const {getUserProfile, getUserCompleteInfo}  = require('../controllers/get.user.profile.controller');



router.post("/get-profile", getUserProfile);
router.post("/get-complete-info", getUserCompleteInfo);


module.exports = router;