const { db } = require("../config/firebase");

/**
 * DELETE QUESTION
 * Only admin can delete
 */
exports.deleteQuestion = async (req, res) => {
  try {
    const { questionId, role } = req.body;

    // 🔐 role check
    if (role !== "admin") {
      return res.status(401).json({
        success: false,
        message: "Unauthenticated: Admin access required",
      });
    }

    if (!questionId) {
      return res.status(400).json({
        success: false,
        message: "Question ID is required",
      });
    }

    const questionRef = db.collection("questions").doc(questionId);

    // 🔍 check existence
    const questionSnap = await questionRef.get();

    if (!questionSnap.exists) {
      return res.status(404).json({
        success: false,
        message: "Question not found",
      });
    }

    // ⚡ efficient direct delete
    await questionRef.delete();

    return res.status(200).json({
      success: true,
      message: "Question deleted successfully",
      questionId,
    });
  } catch (error) {
    console.error("Delete Question Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
