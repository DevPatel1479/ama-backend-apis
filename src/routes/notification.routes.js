const express = require('express');
const router = express.Router();
const { sendTopicNotification } = require('../controllers/notification.controller');

router.post('/send-topic-notification', sendTopicNotification);

module.exports = router;
