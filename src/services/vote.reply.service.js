// src/services/vote.reply.service.js
const { db } = require('../config/firebase');

async function voteOnReply({ questionId, commentId, replyId, type }) {
  const questionRef = db.collection('questions').doc(questionId);

  return db.runTransaction(async (t) => {
    const doc = await t.get(questionRef);
    if (!doc.exists) throw new Error('Question not found');

    const data = doc.data();
    const comments = data.comments || [];

    const commentIndex = comments.findIndex(c => c.id === commentId);
    if (commentIndex === -1) throw new Error('Comment not found');

    const replies = comments[commentIndex].replies || [];
    const replyIndex = replies.findIndex(r => r.id === replyId);
    if (replyIndex === -1) throw new Error('Reply not found');

    // Update vote
    if (type === 'upvote') {
      replies[replyIndex].upvotes = (replies[replyIndex].upvotes || 0) + 1;
    } else if (type === 'downvote') {
      replies[replyIndex].downvotes = (replies[replyIndex].downvotes || 0) + 1;
    } else {
      throw new Error('Invalid vote type');
    }

    comments[commentIndex].replies = replies;
    await t.update(questionRef, { comments });

    return replies[replyIndex];
  });
}

module.exports = { voteOnReply };
