// src/routes/reply.route.js
const express = require('express');
const router = express.Router();
const { addReplyController } = require('../controllers/reply.controller');
const { voteReplyController } = require('../controllers/vote.reply.controller');
const { paginateRepliesController } = require('../controllers/paginate.replies.controller');
const { removeVoteReplyController } = require('../controllers/remove.vote.reply.controller');

// POST /api/reply/:questionId/:commentId
router.post('/:questionId/:commentId', addReplyController);
router.get('/:questionId/:commentId', paginateRepliesController);
router.patch('/:questionId/:commentId/:replyId/vote', voteReplyController);
router.patch('/:questionId/:commentId/:replyId/vote/remove', removeVoteReplyController);

module.exports = router;
