const { db } = require("../config/firebase");

/**
 * DELETE COMMENT
 * Only admin allowed
 */
exports.deleteComment = async (req, res) => {
  try {
    const { commentId, role } = req.body;

    // 🔐 role validation
    if (role !== "admin") {
      return res.status(401).json({
        success: false,
        message: "Unauthenticated: Admin access required",
      });
    }

    if (!commentId) {
      return res.status(400).json({
        success: false,
        message: "Comment ID is required",
      });
    }

    const commentRef = db.collection("userComments").doc(commentId);

    // 🔍 existence check
    const commentSnap = await commentRef.get();

    if (!commentSnap.exists) {
      return res.status(404).json({
        success: false,
        message: "Comment not found",
      });
    }

    // ⚡ efficient delete
    await commentRef.delete();

    return res.status(200).json({
      success: true,
      message: "Comment deleted successfully",
      commentId,
    });
  } catch (error) {
    console.error("Delete Comment Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
