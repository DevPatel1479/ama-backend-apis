const { db } = require("../config/firebase");
const admin = require("firebase-admin"); // ✅ add this line

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

    if (!questionId || !commentId) {
      return res.status(400).json({
        success: false,
        message: "questionId and commentId are required",
      });
    }

    const questionRef = db.collection("questions").doc(questionId);
    const commentRef = questionRef.collection("comments").doc(commentId);

    await db.runTransaction(async (tx) => {
      const snap = await tx.get(commentRef);

      if (!snap.exists) {
        throw new Error("Comment not found");
      }

      // 🔥 delete comment
      tx.delete(commentRef);

      // 🔥 safely decrement count
      tx.update(questionRef, {
        commentsCount: admin.firestore.FieldValue.increment(-1),
      });
    });

    return res.status(200).json({
      success: true,
      message: "Comment deleted successfully",
      commentId,
    });
  } catch (error) {
    console.error("Delete comment error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
