const { db,admin } = require('../config/firebase');
const {updateCommentVote} = require('../services/update.comment.service');

exports.postQuestion = async (req, res) => {
  try {
    const { phone, role, name, question, file_url } = req.body;
    

    if (!phone || !role || !name || !question) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields.',
      });
    }

    // Get current number of questions
    const questionsSnapshot = await db.collection('questions').get();
    const count = questionsSnapshot.size + 1;
    const docId = `ques_${count}`;
    
    const newQuestion = {
      phone,
      role,
      name,
      question,
      upvotes: 0,
      downvotes: 0,
      posted_at: Math.floor(Date.now() / 1000), // UNIX timestamp
      comments: [],
      file_url:file_url ?? ""
    };

    await db.collection('questions').doc(docId).set(newQuestion);

    return res.status(201).json({
      success: true,
      message: 'Question posted successfully.',
      id: docId,
      data: newQuestion,
    });
  } catch (error) {
    console.error('Error posting question:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error. Try again.',
      error: error.message,
    });
  }
};



// Add Vote (Upvote or Downvote)
exports.vote = async (req, res) => {
  try {
    const { type, target, targetId, phone, name, role, commentId } = req.body;

    if (!type || !target || !targetId || !phone) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const isUpvote = type === 'upvote';
    const voteField = isUpvote ? 'upvotes' : 'downvotes';

    const questionRef = db.collection('questions').doc(targetId);

    if (target === 'question') {
      const doc = await questionRef.get();
      const currentVotes = doc.data()?.[voteField] || 0;
      await questionRef.update({
        [voteField]: currentVotes + 1,
      });
    } else if (target === 'comment' && commentId) {
      await updateCommentVote(targetId, commentId, voteField, 1);
    } else {
      return res.status(400).json({ success: false, message: 'Invalid target' });
    }

    return res.status(200).json({ success: true, message: `${type} added` });

  } catch (error) {
    console.error('Vote Error:', error);
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Remove Vote
exports.removeVote = async (req, res) => {
  try {
    const { type, target, targetId, phone, commentId } = req.body;

    if (!type || !target || !targetId || !phone) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const isUpvote = type === 'upvote';
    const voteField = isUpvote ? 'upvotes' : 'downvotes';

    const questionRef = db.collection('questions').doc(targetId);

    if (target === 'question') {
      const doc = await questionRef.get();
      const currentVotes = doc.data()?.[voteField] || 0;
      await questionRef.update({
        [voteField]: Math.max(currentVotes - 1, 0),
      });
    } else if (target === 'comment' && commentId) {
      await updateCommentVote(targetId, commentId, voteField, -1);
    } else {
      return res.status(400).json({ success: false, message: 'Invalid target' });
    }

    return res.status(200).json({ success: true, message: `${type} removed` });

  } catch (error) {
    console.error('Remove Vote Error:', error);
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};


exports.getAllQuestions = async (req, res) => {
  try {
    const { phone, fetch_my, page = 1, limit = 10 } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required."
      });
    }

    const questionsRef = db.collection('questions');
    let query = questionsRef.orderBy('posted_at', 'desc');

    // Filter based on fetch_my
    if (fetch_my) {
      query = query.where('phone', '==', phone);
    } else {
      query = query.where('phone', '!=', phone);
    }

    const offset = (page - 1) * limit;

    const snapshot = await query.get();
    const allDocs = snapshot.docs;

    const paginatedDocs = allDocs.slice(offset, offset + limit).map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return res.status(200).json({
      success: true,
      currentPage: page,
      totalItems: allDocs.length,
      totalPages: Math.ceil(allDocs.length / limit),
      data: paginatedDocs
    });

  } catch (error) {
    console.error('Error getting questions:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error. Try again.',
      error: error.message
    });
  }
};