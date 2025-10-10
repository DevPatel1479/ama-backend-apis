const { db, admin } = require("../config/firebase");

exports.sendTopicNotification = async (req, res) => {
  try {
    const { user_id, topic, n_title, n_body, role_count } = req.body;

    if (!user_id || !topic || !n_title || !n_body) {
      return res.status(400).json({
        success: false,
        message: "user_id, topic, n_title and n_body are required",
      });
    }

    // Extract role from user_id which is in format role_phone
    // e.g. client_9876... -> role = 'client'

    // let role = "";
    // if (topic === "all_clients") {
    //   role = "client";
    // } else {
    //   role = "advocate";
    // }

    // // Prevent writing/sending to admin role (optional)
    // if (role === "admin") {
    //   return res
    //     .status(403)
    //     .json({ success: false, message: "Sending to admin is not allowed" });
    // }

    const topics = Array.isArray(topic) ? topic : [topic];

    // verify user exists (optional but good)
    const userDoc = await db.collection("login_users").doc(user_id).get();
    if (!userDoc.exists) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Send to topics via FCM
    const messagePayload = {
      notification: {
        title: n_title,
        body: n_body,
      },
    };

    const sendPromises = topics.map(async (t) => {
      const msg = { ...messagePayload, topic: t };
      return admin.messaging().send(msg);
    });

    await Promise.all(sendPromises);

    // Write notification record into Firestore under notifications/{role}/messages/{autoId}
    // Use unix timestamp (seconds)
    const unixTs = Math.floor(Date.now() / 1000);
    const messageDoc = {
      n_title,
      n_body,
      timestamp: unixTs, // numeric unix time in seconds
      sent_by: user_id,
      topics: topics,
    };
    const rolesToStore = [];
    if (topics.includes("all_clients")) rolesToStore.push("client");
    if (topics.includes("all_advocates")) rolesToStore.push("advocate");
    if (topics.includes("all_users")) rolesToStore.push("user");

    // // Path: notifications/{role}/messages
    // await db
    //   .collection("notifications")
    //   .doc(role)
    //   .collection("messages")
    //   .add(messageDoc);
    const storePromises = rolesToStore.map((role) =>
      db
        .collection("notifications")
        .doc(role)
        .collection("messages")
        .add(messageDoc)
    );
    await Promise.all(storePromises);
    return res.status(200).json({
      success: true,
      message: `Notification sent to topic(s): ${topics.join(", ")}`,
    });
  } catch (error) {
    console.error("Error sending notification:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to send notification",
      error: error.message,
    });
  }
};

/**
 * GET /notifications/:role
 * query params:
 *   pageSize (optional, default 20)
 *   startAfter (optional) -> unix timestamp (number) to be used as cursor; returns results AFTER this timestamp in descending order
 *
 * Response:
 * {
 *   success: true,
 *   data: [ { id, n_title, n_body, timestamp, sent_by, topics }, ... ],
 *   nextPageCursor: <timestamp|null>
 * }
 *
 * Example:
 * GET /notifications/client?pageSize=10&startAfter=1690000000
 */
exports.getNotificationsByRole = async (req, res) => {
  try {
    const role = (req.params.role || "").toLowerCase();
    if (!role) {
      return res
        .status(400)
        .json({ success: false, message: "Role path param is required" });
    }
    if (role === "admin") {
      return res.status(403).json({
        success: false,
        message: "Access to admin notifications denied",
      });
    }

    const pageSize = parseInt(req.query.pageSize, 10) || 20;
    const startAfter = req.query.startAfter
      ? parseInt(req.query.startAfter, 10)
      : null;

    let queryRef = db
      .collection("notifications")
      .doc(role)
      .collection("messages")
      .orderBy("timestamp", "desc")
      .limit(pageSize);

    if (startAfter !== null && !Number.isNaN(startAfter)) {
      // Since we ordered by timestamp descending, startAfter will skip items with timestamp >= supplied value.
      // We want items after the cursor, so use startAfter(startAfter)
      queryRef = queryRef.startAfter(startAfter);
    }

    const snap = await queryRef.get();

    const results = [];
    let lastTimestamp = null;
    snap.forEach((doc) => {
      const d = doc.data();
      results.push({
        id: doc.id,
        n_title: d.n_title,
        n_body: d.n_body,
        timestamp: d.timestamp,
        sent_by: d.sent_by || null,
        topics: d.topics || [],
      });
      lastTimestamp = d.timestamp;
    });

    // If number of results equals pageSize, return lastTimestamp as nextPageCursor
    const nextPageCursor = results.length === pageSize ? lastTimestamp : null;

    return res.status(200).json({
      success: true,
      data: results,
      nextPageCursor,
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch notifications",
      error: error.message,
    });
  }
};
