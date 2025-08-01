// src/controllers/vote.reply.controller.js
const { voteOnReply } = require('../services/vote.reply.service');

const voteReplyController = async (req, res) => {
  try {
    const { questionId, commentId, replyId } = req.params;
    const { type } = req.body;

    if (!['upvote', 'downvote'].includes(type)) {
      return res.status(400).json({ message: 'Invalid vote type' });
    }

    const updatedReply = await voteOnReply({ questionId, commentId, replyId, type });

    res.status(200).json({ message: `Reply ${type}d successfully`, data: updatedReply });
  } catch (err) {
    console.error('Vote Reply Error:', err.message);
    res.status(500).json({ message: 'Internal Server Error', error: err.message });
  }
};

module.exports = { voteReplyController };
