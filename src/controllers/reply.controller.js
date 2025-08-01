// src/controllers/reply.controller.js
const { addReplyToComment } = require('../services/add.reply.service');

const addReplyController = async (req, res) => {
  try {
    const { questionId, commentId } = req.params;
    const { reply, name, phone, role } = req.body;

    if (!reply || !name || !phone || !role) {
      return res.status(400).json({ message: 'Missing fields' });
    }

    const addedReply = await addReplyToComment({
      questionId,
      commentId,
      replyData: { reply, name, phone, role }
    });

    res.status(200).json({ message: 'Reply added successfully', data: addedReply });
  } catch (err) {
    console.error('Add Reply Error:', err.message);
    res.status(500).json({ message: 'Internal Server Error', error: err.message });
  }
};

module.exports = { addReplyController };
