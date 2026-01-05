const { db, admin } = require("../config/firebase");

exports.sendNotificationToAllAdvocates = async (req, res) => {
  try {
    const { user_id, n_title, n_body } = req.body;
    const topics = ["all_advocates"];
    if (!user_id || !n_title || !n_body) {
      return res.status(400).json({
        success: false,
        message: "user_id, topic, n_title and n_body are required",
      });
    }
    const parts = user_id.split("_");
    const phone = parts[1];
    const fullPhone = `91${phone}`;
    // Verify user exists (optional)
    const userDoc = await db.collection("login_users").doc(fullPhone).get();
    if (!userDoc.exists) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Prepare notification payload
    const messagePayload = {
      topic: "all_advocates",
      notification: {
        title: n_title,
        body: n_body, // <-- MULTILINE TEXT WORKS FINE HERE
      },
      data: {
        title: n_title,
        body: n_body,
        type: "advocate_notification",
        click_action: "FLUTTER_NOTIFICATION_CLICK",
      },
    };
    const sendPromises = topics.map(async (t) => {
      const msg = { ...messagePayload, topic: t };
      return admin.messaging().send(msg);
    });
    await Promise.all(sendPromises);

    const unixTs = Math.floor(Date.now() / 1000);
    const messageDoc = {
      n_title,
      n_body,
      timestamp: unixTs,
      sent_by: user_id,
      topics: topics,
    };

    const rolesToStore = [];

    if (topics.includes("all_advocates")) rolesToStore.push("advocate");

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
      message: `Notification sent to all advocates`,
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

exports.sendNotificationToAllAdvocatesV2 = async (req, res) => {
  try {
    const { user_id, n_title, n_body } = req.body;
    const topics = ["all_advocates"];
    if (!user_id || !n_title || !n_body) {
      return res.status(400).json({
        success: false,
        message: "user_id, topic, n_title and n_body are required",
      });
    }
    const parts = user_id.split("_");
    const phone = parts[1];
    const fullPhone = `${phone}`;
    // Verify user exists (optional)
    const userDoc = await db.collection("login_users").doc(fullPhone).get();
    if (!userDoc.exists) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Prepare notification payload
    const messagePayload = {
      topic: "all_advocates",
      notification: {
        title: n_title,
        body: n_body, // <-- MULTILINE TEXT WORKS FINE HERE
      },
      data: {
        title: n_title,
        body: n_body,
        type: "advocate_notification",
        click_action: "FLUTTER_NOTIFICATION_CLICK",
      },
    };
    const sendPromises = topics.map(async (t) => {
      const msg = { ...messagePayload, topic: t };
      return admin.messaging().send(msg);
    });
    await Promise.all(sendPromises);

    const unixTs = Math.floor(Date.now() / 1000);
    const messageDoc = {
      n_title,
      n_body,
      timestamp: unixTs,
      sent_by: user_id,
      topics: topics,
    };

    const rolesToStore = [];

    if (topics.includes("all_advocates")) rolesToStore.push("advocate");

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
      message: `Notification sent to all advocates`,
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
