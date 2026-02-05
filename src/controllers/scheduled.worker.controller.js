const axios = require("axios");
const firebaseAdmin = require("firebase-admin");
const { db } = require("../config/firebase");

const COLLECTION_NAME = "scheduled_notifications";
const BATCH_SIZE = 20;

exports.runScheduledNotifications = async (req, res) => {
  try {
    const now = firebaseAdmin.firestore.Timestamp.now();

    // 1️⃣ Fetch pending jobs
    const snapshot = await db
      .collection(COLLECTION_NAME)
      .where("scheduled_at", "<=", now)
      .where("status", "==", "pending")
      .limit(BATCH_SIZE)
      .get();

    if (snapshot.empty) {
      return res.status(200).json({
        success: true,
        message: "No scheduled notifications to process",
      });
    }

    // 2️⃣ LOCK jobs → status = processing
    const lockBatch = db.batch();
    snapshot.docs.forEach((doc) => {
      lockBatch.update(doc.ref, {
        status: "processing",
        processing_at: now,
      });
    });
    await lockBatch.commit();

    // 3️⃣ FIRE REQUESTS IN PARALLEL
    const tasks = snapshot.docs.map(async (doc) => {
      const data = doc.data();

      try {
        await axios.post(
          `${process.env.BASE_API_URL}/notifications/send-topic-notification`,
          {
            user_id: data.user_id,
            topic: data.topic,
            n_title: data.n_title,
            n_body: data.n_body,
            send_weekly: data.send_weekly,
          },
        );

        return {
          ref: doc.ref,
          status: "sent",
        };
      } catch (err) {
        return {
          ref: doc.ref,
          status: "failed",
          error: err.message,
        };
      }
    });

    const results = await Promise.allSettled(tasks);

    // 4️⃣ BATCH UPDATE RESULTS
    const resultBatch = db.batch();

    results.forEach((result) => {
      if (result.status !== "fulfilled") return;

      const { ref, status, error } = result.value;

      if (status === "sent") {
        resultBatch.update(ref, {
          status: "sent",
          sent_at: firebaseAdmin.firestore.Timestamp.now(),
        });
      } else {
        resultBatch.update(ref, {
          status: "failed",
          last_error: error,
          retries: firebaseAdmin.firestore.FieldValue.increment(1),
        });
      }
    });

    await resultBatch.commit();

    return res.status(200).json({
      success: true,
      processed: results.length,
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
