const { db, admin } = require("../config/firebase");

/**
 * DELETE COMMENT
 * Only admin allowed
 */
exports.deleteComment = async (req, res) => {
  try {
    const { questionId, commentId, role } = req.body;

    if (role !== "admin") {
      return res.status(401).json({
        success: false,
        message: "Admin only",
      });
    }

    const questionRef = db.collection("questions").doc(questionId);
    const commentRef = questionRef.collection("comments").doc(commentId);

    await db.runTransaction(async (tx) => {
      const commentSnap = await tx.get(commentRef);

      if (!commentSnap.exists) {
        throw new Error("Comment not found");
      }

      // 🔥 delete comment
      tx.delete(commentRef);

      // 🔥 decrement count safely
      tx.update(questionRef, {
        commentsCount: admin.firestore.FieldValue.increment(-1),
      });
    });

    return res.status(200).json({
      success: true,
      message: "Comment deleted",
      commentId,
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
