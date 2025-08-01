// controllers/questionController.js

const { db, admin } = require('../config/firebase');
const { v4: uuidv4 } = require('uuid'); // To generate unique comment IDs

exports.addComment = async (req, res) => {
  try {
    const { questionId, comment, phone, name, role } = req.body;

    if (!questionId || !comment || !phone || !name || !role) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields.',
      });
    }

    const questionRef = db.collection('questions').doc(questionId);
    const doc = await questionRef.get();

    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Question not found.',
      });
    }

    const newComment = {
      id: uuidv4(), // 🔑 Unique comment ID
      comment,
      phone,
      name,
      role,
      upvotes: 0,
      downvotes: 0,
      commented_at: Math.floor(Date.now() / 1000)
    };

    await questionRef.update({
      comments: admin.firestore.FieldValue.arrayUnion(newComment)
    });

    return res.status(200).json({
      success: true,
      message: 'Comment added successfully.',
      comment: newComment
    });

  } catch (error) {
    console.error('Error adding comment:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error. Try again.',
      error: error.message
    });
  }
};
