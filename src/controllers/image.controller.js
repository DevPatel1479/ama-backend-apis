const { db } = require("../config/firebase");

/**
 * Fetch images by type and sort by priority
 */
const getImagesByType = async (req, res) => {
  try {
    const { type } = req.params;

    const allowedTypes = ["ama", "casedesk", "home", "services"];

    if (!allowedTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Invalid image type",
      });
    }

    const docRef = db.collection("images").doc(type);
    const snapshot = await docRef.get();

    if (!snapshot.exists) {
      return res.status(404).json({
        success: false,
        message: "Images not found",
      });
    }

    const data = snapshot.data();

    const urls = Array.isArray(data.urls)
      ? data.urls.sort((a, b) => a.priority - b.priority)
      : [];

    return res.status(200).json({
      success: true,
      count: urls.length,
      data: urls,
    });
  } catch (error) {
    console.error("Image fetch error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

module.exports = {
  getImagesByType,
};
