// src/controllers/paginate.replies.controller.js
const { paginateReplies } = require('../services/paginate.replies.service');

const paginateRepliesController = async (req, res) => {
  try {
    const { questionId, commentId } = req.params;
    const limit = parseInt(req.query.limit) || 10;
    const offset = parseInt(req.query.offset) || 0;

    const data = await paginateReplies({ questionId, commentId, limit, offset });

    res.status(200).json({
      message: 'Replies fetched successfully',
      totalReplies: data.total,
      replies: data.replies
    });
  } catch (err) {
    console.error('Paginate Replies Error:', err.message);
    res.status(500).json({ message: 'Internal Server Error', error: err.message });
  }
};

module.exports = { paginateRepliesController };
