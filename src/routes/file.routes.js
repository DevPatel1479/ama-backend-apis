const express = require('express');
const multer = require('multer');
const { uploadFile } = require('../controllers/file.controller');

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 3 * 1024 * 1024 }, // 3MB
});



router.post('/upload-question-file', upload.single('file'), uploadFile);

module.exports = router;
