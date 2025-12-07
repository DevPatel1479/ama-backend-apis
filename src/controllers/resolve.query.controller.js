// required: firestore handles & admin SDK from your config
const { db, admin } = require("../config/firebase");
const FieldValue = admin.firestore.FieldValue;

exports.resolveQuery = async (req, res) => {
  try {
    const {
      operatorRole,
      operatorName,
      operatorPhone = null,
      queryId,
      parentDocId: providedParentDocId = null,
      remarks,
    } = req.body;

    // Validate required fields
    if (!operatorRole || !queryId) {
      return res.status(400).json({
        success: false,
        message: "operatorRole and queryId are required.",
      });
    }

    // Only admin or advocate allowed
    const roleLower = String(operatorRole).toLowerCase();
    if (!["admin", "advocate"].includes(roleLower)) {
      return res.status(403).json({
        success: false,
        message:
          "Only users with role 'admin' or 'advocate' can resolve queries.",
      });
    }

    // 1) Read the mirrored top-level doc to get parentDocId and current status
    const allDocRef = db.collection("allQueries").doc(queryId);
    const allSnap = await allDocRef.get();

    if (!allSnap.exists) {
      return res.status(404).json({
        success: false,
        message: "Query not found in allQueries.",
      });
    }

    const allData = allSnap.data();
    const parentDocId = providedParentDocId || allData.parentDocId || null;

    if (!parentDocId) {
      return res.status(400).json({
        success: false,
        message:
          "Parent document id not found. Provide parentDocId or ensure allQueries doc has parentDocId.",
      });
    }

    // If already resolved, return informative response (idempotent safe)
    if (allData.status === "resolved") {
      return res.status(200).json({
        success: true,
        message: "Query is already resolved.",
        data: { queryId, status: "resolved" },
      });
    }

    // 2) Prepare subcollection doc ref
    const userQueryRef = db
      .collection("queries")
      .doc(parentDocId)
      .collection("userQueries")
      .doc(queryId);

    // Optionally verify subcollection doc exists and current status
    const userQuerySnap = await userQueryRef.get();
    if (!userQuerySnap.exists) {
      return res.status(404).json({
        success: false,
        message: `Query not found under parent ${parentDocId}.`,
      });
    }

    const userQueryData = userQuerySnap.data();
    if (userQueryData.status === "resolved") {
      // Keep idempotent behavior if subcollection already resolved but mirror wasn't
      return res.status(200).json({
        success: true,
        message: "Query is already resolved (subcollection).",
        data: { queryId, status: "resolved" },
      });
    }

    // 3) Build the update payload (only include remarks if provided)
    const timestamp = Math.floor(Date.now() / 1000);
    const updatePayload = {
      status: "resolved",
      resolved_at: timestamp,
      resolved_by: {
        role: operatorRole,
        phone: operatorPhone ? `91${operatorPhone}` : null,
        name: operatorName,
      },
    };

    // Only attach remarks key if provided (so it doesn't create empty value)
    if (typeof remarks === "string" && remarks.trim().length > 0) {
      updatePayload.remarks = remarks.trim();
    }

    // 4) Use a batch to update both documents atomically
    const batch = db.batch();
    batch.update(allDocRef, updatePayload);
    batch.update(userQueryRef, updatePayload);

    await batch.commit();

    // Get query content for notification preview
    const rawQueryText = userQueryData.query || userQueryData.userQuery || "";
    const trimmedQuery =
      rawQueryText.length > 40
        ? rawQueryText.substring(0, 40) + "..."
        : rawQueryText;

    const loginUsersRef = db.collection("login_users").doc(parentDocId);
    const loginUserSnap = await loginUsersRef.get();

    if (loginUserSnap.exists) {
      const userData = loginUserSnap.data();
      const fcmToken = userData.fcm_token;

      if (fcmToken) {
        const msg = {
          token: fcmToken,

          // ------------------ NOTIFICATION UI ------------------
          notification: {
            title: "Client Query Update",
            body: `Query resolved: ${trimmedQuery}`,
          },

          // Android settings
          android: {
            priority: "high",
            notification: {
              channel_id: "high_importance_channel",
            },
          },

          // iOS settings
          apns: {
            payload: {
              aps: {
                sound: "default",
                alert: {
                  title: "Client Query Update",
                  body: `Query resolved: ${trimmedQuery}`,
                },
              },
            },
          },

          // Extra data for app to open correct screen
          data: {
            type: "QUERY_RESOLVED",
            queryId: queryId,
          },
        };

        try {
          await admin.messaging().send(msg);
          console.log("📩 FCM Notification Sent");
        } catch (fcmErr) {
          console.error("FCM sending error:", fcmErr);
        }
      } else {
        console.log("⚠ No FCM token found for user:", parentDocId);
      }
    }

    // 5) Return success with updated fields (merge with previous data for clarity)
    return res.status(200).json({
      success: true,
      message: "Query marked as resolved.",
      data: {
        queryId,
        parentDocId,
        ...updatePayload,
      },
    });
  } catch (error) {
    console.error("Error in resolveQuery:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};
