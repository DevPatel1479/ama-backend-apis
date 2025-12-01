// controllers/fileDispute.controller.js
const { db } = require("../config/firebase");

/**
 * @desc  Handle filing a dispute
 * @route POST /api/file-dispute
 * @body  { user_id, selected_service, query, name }
 */
exports.fileDispute = async (req, res) => {
  try {
    const { user_id, selected_service, query, name } = req.body;

    // ✅ Validate request
    if (!user_id || !selected_service || !query || !name) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required fields: user_id, selected_service, query, name",
      });
    }
    const phone = user_id.split("_")[1];
    const disputesRef = db.collection("file_disputes").doc(`91${phone}`);

    // ✅ Create a new dispute object
    const newDispute = {
      selected_service,
      query,
      name,
      submittedAt: Date.now(), // Unix epoch timestamp
    };

    // ✅ Use Firestore transaction to safely append
    await db.runTransaction(async (transaction) => {
      const doc = await transaction.get(disputesRef);
      if (doc.exists) {
        const existingData = doc.data();
        const existingDisputes = existingData.disputes || [];
        existingDisputes.push(newDispute);
        transaction.update(disputesRef, { disputes: existingDisputes });
      } else {
        transaction.set(disputesRef, {
          phone: `91${phone}`,
          disputes: [newDispute],
        });
      }
    });

    return res.status(200).json({
      success: true,
      message: "Dispute filed successfully",
      data: newDispute,
    });
  } catch (error) {
    console.error("Error filing dispute:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};
