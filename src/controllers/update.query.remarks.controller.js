const { db } = require("../config/firebase");

exports.updateQueryRemarks = async (req, res) => {
  try {
    const {
      queryId,
      parentDocId: providedParentDocId = null,
      remarks,
      operatorRole,
    } = req.body;

    // Validate
    if (!queryId || !remarks) {
      return res.status(400).json({
        success: false,
        message: "queryId and remarks are required.",
      });
    }

    // Optional role guard (if needed)
    if (operatorRole) {
      const role = String(operatorRole).toLowerCase();
      if (!["admin", "advocate"].includes(role)) {
        return res.status(403).json({
          success: false,
          message: "Unauthorized role.",
        });
      }
    }

    const cleanRemarks = remarks.trim();
    if (!cleanRemarks) {
      return res.status(400).json({
        success: false,
        message: "Remarks cannot be empty.",
      });
    }

    const allDocRef = db.collection("allQueries").doc(queryId);
    const allSnap = await allDocRef.get();

    if (!allSnap.exists) {
      return res.status(404).json({
        success: false,
        message: "Query not found in allQueries.",
      });
    }

    const allData = allSnap.data();
    const parentDocId = providedParentDocId || allData.parentDocId;

    if (!parentDocId) {
      return res.status(400).json({
        success: false,
        message: "parentDocId not found.",
      });
    }

    const userQueryRef = db
      .collection("queries")
      .doc(parentDocId)
      .collection("userQueries")
      .doc(queryId);

    // FAST UPDATE PAYLOAD
    const updatePayload = {
      remarks: cleanRemarks,
      remarks_updated_at: Math.floor(Date.now() / 1000),
    };

    // Batch write (atomic)
    const batch = db.batch();
    batch.update(allDocRef, updatePayload);
    batch.update(userQueryRef, updatePayload);

    await batch.commit();

    return res.status(200).json({
      success: true,
      message: "Remarks updated successfully.",
      data: {
        queryId,
        parentDocId,
        remarks: cleanRemarks,
      },
    });
  } catch (error) {
    console.error("Error in updateQueryRemarks:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};
