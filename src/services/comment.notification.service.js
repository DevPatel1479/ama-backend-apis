const { db, admin } = require("../config/firebase");

exports.sendCommentNotificationBackground = async ({
  questionOwnerPhone,
  commented_by,
  comment_content,
}) => {
  try {
    const phoneDocId = `91${questionOwnerPhone}`;

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

    const shortComment = truncateText(comment_content, 120);

    const n_title = `${commented_by} commented on your AMA question`;
    const n_body = shortComment;

    const unixTs = Math.floor(Date.now() / 1000);

    // 🔥 Send FCM
    await admin.messaging().send({
      token: fcmToken,
      notification: {
        title: n_title,
        body: n_body,
      },
      data: {
        click_action: "FLUTTER_NOTIFICATION_CLICK",
        comment_content,
        type: "ama_comment",
      },
    });

    // 🔥 Store Notification (SAME STRUCTURE AS ANSWER)
    await db
      .collection("question_notifications")
      .doc(phoneDocId)
      .collection("messages")
      .add({
        title: n_title,
        body: comment_content,
        commented_by,
        type: "comment",
        timestamp: unixTs,
      });
  } catch (err) {
    console.error("Comment notification failed:", err);
  }
};
