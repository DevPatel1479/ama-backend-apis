const { db, admin } = require("../config/firebase");

const COLLECTION_NAME = "scheduled_notifications";

exports.createScheduledNotification = async (req, res) => {
  try {
    const {
      user_id,
      topic, // string OR array
      n_title,
      n_body,
      send_weekly = false,
      scheduledDate, // YYYY-MM-DD
      scheduledTime, // HH:mm
    } = req.body;

    // 🔐 Validation (matches sendTopicNotification)
    if (
      !user_id ||
      !topic ||
      !n_title ||
      !n_body ||
      !scheduledDate ||
      !scheduledTime
    ) {
      return res.status(400).json({
        success: false,
        message:
          "user_id, topic, n_title, n_body, scheduledDate, scheduledTime are required",
      });
    }

    // Normalize topic → always array in DB
    const topics = Array.isArray(topic) ? topic : [topic];

    // Combine date + time → UTC
    const [hour, minute] = scheduledTime.split(":").map(Number);
    const [year, month, day] = scheduledDate.split("-").map(Number);

    const scheduledAt = new Date(Date.UTC(year, month - 1, day, hour, minute));

    const docData = {
      user_id,
      topic: topics, // always array for scheduler
      n_title,
      n_body,
      send_weekly: !!send_weekly,

      scheduled_at: admin.firestore.Timestamp.fromDate(scheduledAt),

      status: "pending",
      retries: 0,
      last_error: null,

      created_at: admin.firestore.Timestamp.now(),
    };

    const docRef = await db.collection(COLLECTION_NAME).add(docData);

    return res.status(201).json({
      success: true,
      message: "Scheduled notification created",
      id: docRef.id,
    });
  } catch (error) {
    console.error("Error creating scheduled notification:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

exports.getDueScheduledNotifications = async (req, res) => {
  try {
    const now = admin.firestore.Timestamp.now();

    const snapshot = await db
      .collection(COLLECTION)
      .where("scheduled_at", "<=", now)
      .where("status", "==", "pending")
      .limit(50) // safety limit
      .get();

    const notifications = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return res.status(200).json({
      success: true,
      data: notifications,
    });
  } catch (error) {
    console.error("Fetch due notifications error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch scheduled notifications",
      error: error.message,
    });
  }
};

exports.updateScheduledNotificationStatus = async (req, res) => {
  try {
    const { id, status, error } = req.body;

    if (!id || !status) {
      return res.status(400).json({
        success: false,
        message: "id and status are required",
      });
    }

    const updateData = {
      status,
    };

    if (error) {
      updateData.last_error = error;
      updateData.retries = admin.firestore.FieldValue.increment(1);
    }

    await db.collection(COLLECTION).doc(id).update(updateData);

    return res.status(200).json({
      success: true,
      message: "Scheduled notification updated",
    });
  } catch (error) {
    console.error("Update scheduled notification error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update scheduled notification",
      error: error.message,
    });
  }
};
