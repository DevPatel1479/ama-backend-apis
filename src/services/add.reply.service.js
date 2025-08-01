// src/services/add.reply.service.js
const { db } = require('../config/firebase');
const { v4: uuidv4 } = require('uuid');

async function addReplyToComment({ questionId, commentId, replyData }) {
  const questionRef = db.collection('questions').doc(questionId);

  return db.runTransaction(async (t) => {
    const doc = await t.get(questionRef);
    if (!doc.exists) throw new Error('Question not found');

    const data = doc.data();
    const comments = data.comments || [];

    const commentIndex = comments.findIndex(c => c.id === commentId);
    if (commentIndex === -1) throw new Error('Comment not found');

    const newReply = {
      id: uuidv4(),
      reply: replyData.reply,
      name: replyData.name,
      phone: replyData.phone,
      role: replyData.role,
      replied_at: Date.now(),
      upvotes: 0,
      downvotes: 0
    };

    if (!comments[commentIndex].replies) {
      comments[commentIndex].replies = [];
    }

    comments[commentIndex].replies.push(newReply);

    await t.update(questionRef, { comments });
    return newReply;
  });
}

module.exports = { addReplyToComment };
