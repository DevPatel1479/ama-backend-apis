// src/services/paginate.replies.service.js
const { db } = require('../config/firebase');

async function paginateReplies({ questionId, commentId, limit = 10, offset = 0 }) {
  const questionRef = db.collection('questions').doc(questionId);
  const doc = await questionRef.get();

  if (!doc.exists) throw new Error('Question not found');

  const comments = doc.data().comments || [];
  const comment = comments.find(c => c.id === commentId);
  if (!comment) throw new Error('Comment not found');

  const replies = comment.replies || [];

  // Pagination logic
  const paginated = replies.slice(offset, offset + limit);

  return {
    total: replies.length,
    replies: paginated
  };
}

module.exports = { paginateReplies };
