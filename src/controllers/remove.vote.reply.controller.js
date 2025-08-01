// src/controllers/remove.vote.reply.controller.js
const { removeVoteOnReply } = require('../services/remove.vote.reply.service');

const removeVoteReplyController = async (req, res) => {
  try {
    const { questionId, commentId, replyId } = req.params;
    const { type } = req.body;

    if (!['upvote', 'downvote'].includes(type)) {
      return res.status(400).json({ message: 'Invalid vote type' });
    }

    const updatedReply = await removeVoteOnReply({ questionId, commentId, replyId, type });

    res.status(200).json({ message: `Reply ${type} removed successfully`, data: updatedReply });
  } catch (err) {
    console.error('Remove Vote Reply Error:', err.message);
    res.status(500).json({ message: 'Internal Server Error', error: err.message });
  }
};

module.exports = { removeVoteReplyController };
