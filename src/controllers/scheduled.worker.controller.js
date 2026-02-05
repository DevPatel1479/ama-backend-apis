const axios = require("axios");
const firebaseAdmin = require("firebase-admin");
const { db } = require("../config/firebase");

const COLLECTION_NAME = "scheduled_notifications";

// 🔥 MAIN WORKER FUNCTION
exports.runScheduledNotifications = async (req, res) => {
  try {
    const now = firebaseAdmin.firestore.Timestamp.now();

    const snapshot = await db
      .collection(COLLECTION_NAME)
      .where("scheduled_at", "<=", now)
      .where("status", "==", "pending")
      .limit(20)
      .get();

    if (snapshot.empty) {
      return res.status(200).json({
        success: true,
        message: "No scheduled notifications to process",
      });
    }

    for (const doc of snapshot.docs) {
      const data = doc.data();

      try {
        // 🔁 CALL EXISTING sendTopicNotification API
        await axios.post(
          `${process.env.BASE_API_URL}/send-topic-notification`,
          {
            user_id: data.user_id,
            topic: data.topic,
            n_title: data.n_title,
            n_body: data.n_body,
            send_weekly: data.send_weekly,
          },
        );

        // ✅ MARK AS SENT
        await doc.ref.update({
          status: "sent",
          sent_at: firebaseAdmin.firestore.Timestamp.now(),
        });
      } catch (err) {
        console.error("Send failed:", err.message);

        await doc.ref.update({
          status: "failed",
          last_error: err.message,
          retries: firebaseAdmin.firestore.FieldValue.increment(1),
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: "Scheduled notifications processed",
    });
  } catch (error) {
    console.error("Scheduler worker error:", error);
    return res.status(500).json({
      success: false,
      message: "Scheduler failed",
      error: error.message,
    });
  }
};
