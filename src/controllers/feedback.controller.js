// controllers/feedbackController.js
const { db } = require("../config/firebase");

exports.submitFeedback = async (req, res) => {
  try {
    const { user_id, rate, feedback } = req.body;

    if (!user_id || !rate || !feedback) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: user_id, rate, feedback",
      });
    }

    // reference to feedback collection with user_id as document id
    const feedbackRef = db.collection("feedback").doc(user_id);

    await feedbackRef.set(
      {
        rate,
        feedback,
        submittedAt: new Date().toISOString(),
      },
      { merge: true } // merge in case user resubmits
    );

    return res.status(200).json({
      success: true,
      message: "Feedback submitted successfully",
    });
  } catch (error) {
    console.error("Error submitting feedback:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while submitting feedback",
      error: error.message,
    });
  }
};
