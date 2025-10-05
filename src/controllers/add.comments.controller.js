const { db, admin } = require("../config/firebase");

// POST: Add a comment to a question
const addComment = async (req, res) => {
  try {
    const { commentedBy, userRole, phone, profileImgUrl, content, questionId } =
      req.body;

    if (!content || !commentedBy || !questionId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const commentsRef = db
      .collection("questions")
      .doc(questionId)
      .collection("comments");
    const newCommentRef = commentsRef.doc();

    const unixTimestamp = Date.now(); // Universal Unix timestamp in ms

    const commentData = {
      commentedBy,
      userRole,
      phone,
      profileImgUrl: profileImgUrl || null,
      content,
      timestamp: unixTimestamp,
    };

    // Add the comment
    await newCommentRef.set(commentData);

    // Increment the comments count in the question document
    const questionRef = db.collection("questions").doc(questionId);
    await questionRef.update({
      commentsCount: admin.firestore.FieldValue.increment(1),
    });

    res.status(201).json({ id: newCommentRef.id, ...commentData });
  } catch (error) {
    console.error("Error adding comment:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};


// GET: Fetch comments for a question with pagination
const getComments = async (req, res) => {
  try {
    const { limit = 10, lastVisible, questionId } = req.body;

    let query = db
      .collection("questions")
      .doc(questionId)
      .collection("comments")
      .orderBy("timestamp", "desc")
      .limit(Number(limit));

    if (lastVisible) {
      const lastDoc = await db
        .collection("questions")
        .doc(questionId)
        .collection("comments")
        .doc(lastVisible)
        .get();

      if (lastDoc.exists) {
        query = query.startAfter(lastDoc.data().timestamp); // ✅ use Unix timestamp
      }
    }

    const snapshot = await query.get();
    const comments = [];

    snapshot.forEach((doc) => {
      comments.push({ id: doc.id, ...doc.data() });
    });

    res.json({
      comments,
      lastVisible:
        snapshot.docs.length > 0
          ? snapshot.docs[snapshot.docs.length - 1].id
          : null,
    });
  } catch (error) {
    console.error("Error fetching comments:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// GET: Fetch comments count for a question
const getCommentsCount = async (req, res) => {
  try {
    const { questionId } = req.params;

    if (!questionId) {
      return res.status(400).json({ error: "Missing questionId" });
    }

    const questionSnapshot = await db
      .collection("questions")
      .doc(questionId)
      .get();

    if (!questionSnapshot.exists) {
      return res.status(404).json({ error: "Question not found" });
    }

    const data = questionSnapshot.data();
    const commentsCount = data.commentsCount || 0;

    res.status(200).json({ questionId, commentsCount });
  } catch (error) {
    console.error("Error fetching comments count:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = {
  addComment,
  getComments,
  getCommentsCount,
};
