const { db } = require("../config/firebase");

const collectionName = "login_users";

function extractPhone(user_id) {
  return user_id.split("_").pop();
}

exports.storeFcmToken = async (req, res) => {
  try {
    const { user_id, fcm_token } = req.body;

    if (!user_id || !fcm_token) {
      return res
        .status(400)
        .json({ error: "user_id and fcm_token are required" });
    }
    const phone = `91${extractPhone(user_id)}`;

    const userRef = db.collection(collectionName).doc(phone);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: "User not found" });
    }

    await userRef.update({ fcm_token });

    return res.status(200).json({ message: "FCM token stored successfully" });
  } catch (error) {
    console.error("Error storing FCM token:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// Update FCM token
exports.updateFcmToken = async (req, res) => {
  try {
    const { user_id, fcm_token } = req.body;

    if (!user_id || !fcm_token) {
      return res
        .status(400)
        .json({ error: "user_id and fcm_token are required" });
    }

    const phone = `91${extractPhone(user_id)}`;

    const userRef = db.collection(collectionName).doc(phone);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: "User not found" });
    }

    await userRef.update({ fcm_token });

    return res.status(200).json({ message: "FCM token updated successfully" });
  } catch (error) {
    console.error("Error updating FCM token:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
