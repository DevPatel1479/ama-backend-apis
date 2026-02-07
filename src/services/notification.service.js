const { db, admin } = require("../config/firebase");

exports.sendAnswerNotificationBackground = async ({
  phone,
  answered_by,
  answer_content,
}) => {
  // console.log("calling this  ... ");
  try {
    const phoneDocId = `91${phone}`;

    const userDoc = await db.collection("login_users").doc(phoneDocId).get();
    if (!userDoc.exists) return;

    const fcmToken = userDoc.data()?.fcm_token;
    if (!fcmToken) return;

    const truncateText = (text, maxLength = 120) => {
      if (!text) return "";
      return text.length > maxLength
        ? text.substring(0, maxLength) + "..."
        : text;
    };

    const shortAnswer = truncateText(answer_content, 120);

    const n_title = `New answer from ${answered_by} on your AMA question`;
    const n_body = shortAnswer;

    const unixTs = Math.floor(Date.now() / 1000);

    // Send FCM
    await admin.messaging().send({
      token: fcmToken,
      notification: { title: n_title, body: n_body },
      data: {
        click_action: "FLUTTER_NOTIFICATION_CLICK",
        answer_content,
        type: "ama_answer",
      },
    });

    // Store notification
    await db
      .collection("question_notifications")
      .doc(phoneDocId)
      .collection("messages")
      .add({
        title: n_title,
        body: answer_content,
        answered_by,
        timestamp: unixTs,
      });
  } catch (err) {
    console.error("Background notification failed:", err);
  }
};
