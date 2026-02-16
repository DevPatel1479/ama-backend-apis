const { db, admin } = require("../config/firebase");

exports.sendCommentNotificationBackground = async ({
  questionOwnerPhone,
  commented_by,
  comment_content,
  user_role,
  commentId,
  questionId,
}) => {
  try {
    if (!questionOwnerPhone) return;

    const phoneDocId = `91${questionOwnerPhone}`;

    // ✅ Read user once
    const userDoc = await db.collection("login_users").doc(phoneDocId).get();
    if (!userDoc.exists) return;

    const fcmToken = userDoc.data()?.fcm_token;
    if (!fcmToken) return;
    console.log(`found fcm token ... ${fcmToken}`);
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

    // 🔹 Run FCM send and Firestore write in parallel
    await Promise.all([
      admin.messaging().send({
        token: fcmToken,
        notification: {
          title: n_title,
          body: n_body,
        },
        data: {
          click_action: "FLUTTER_NOTIFICATION_CLICK",
          comment_content,
          type: "ama_comment",
          questionId: questionId,
          commentId: commentId,
        },
        apns: {
          payload: {
            aps: {
              contentAvailable: true,
            },
          },
        },
      }),

      db.collection("notifications").doc(user_role).collection("messages").add({
        n_title: n_title,
        n_body: comment_content,
        phone: questionOwnerPhone,
        sent_by: commented_by,
        timestamp: unixTs,
      }),
    ]);
  } catch (err) {
    console.error("Comment notification failed:", err);
  }
};
