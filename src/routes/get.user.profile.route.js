const express = require('express');
const router = express.Router();
const {getUserProfile}  = require('../controllers/get.user.profile.controller');



router.post("/get-profile", getUserProfile);

module.exports = router;