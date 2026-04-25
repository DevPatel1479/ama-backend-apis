const { db, admin } = require("../config/firebase");

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
    const previewRemarks =
      cleanRemarks.length > 40
        ? cleanRemarks.substring(0, 40) + "..."
        : cleanRemarks;
    const loginUsersRef = db.collection("login_users").doc(parentDocId);
    const loginUserSnap = await loginUsersRef.get();
    if (loginUserSnap.exists) {
      const userData = loginUserSnap.data();
      const fcmToken = userData.fcm_token;

      if (fcmToken) {
        const msg = {
          token: fcmToken,

          notification: {
            title: "Query Remarks Updated",
            body: `Remarks: ${previewRemarks}`,
          },

          android: {
            priority: "high",
            notification: {
              channel_id: "high_importance_channel",
            },
          },

          apns: {
            payload: {
              aps: {
                sound: "default",
                alert: {
                  title: "Query Remarks Updated",
                  body: `Remarks: ${previewRemarks}`,
                },
              },
            },
          },

          data: {
            type: "QUERY_REMARKS_UPDATED",
            queryId: queryId,
          },
        };

        try {
          await admin.messaging().send(msg);
          console.log("📩 Remarks update FCM sent");
        } catch (fcmErr) {
          console.error("FCM sending error:", fcmErr);
        }
      } else {
        console.log("⚠ No FCM token found for user:", parentDocId);
      }
    }

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
