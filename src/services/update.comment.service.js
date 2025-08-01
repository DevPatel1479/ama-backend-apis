const { db } = require('../config/firebase');

async function updateCommentVote(questionId, commentId, type, delta) {
  const questionRef = db.collection('questions').doc(questionId);
  const doc = await questionRef.get();

  if (!doc.exists) throw new Error('Question not found');

  let comments = doc.data().comments || [];

  const updatedComments = comments.map(comment => {
    if (comment.id === commentId) {
      return {
        ...comment,
        [type]: Math.max((comment[type] || 0) + delta, 0),
      };
    }
    return comment;
  });

  await questionRef.update({ comments: updatedComments });
}




module.exports = {
    updateCommentVote
};