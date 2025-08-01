const express = require('express');
const questionController = require('../controllers/question.controller');

const router = express.Router();

router.post('/post-question', questionController.postQuestion);
router.post('/vote', questionController.vote);
router.post('/remove-vote', questionController.removeVote);
router.post('/get-all-questions', questionController.getAllQuestions);

module.exports = router;
