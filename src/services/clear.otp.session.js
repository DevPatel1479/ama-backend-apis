// const { getFirestore } = require("firebase-admin/firestore");
const { db } = require("../config/firebase");

// const db = getFirestore();

async function clearOtpSession(phone, role) {
  const docId = `91${phone}`;
  const userRef = db.collection("login_users").doc(docId);
  const userSnap = await userRef.get();
  if (!userSnap.exists) {
    throw new Error("User not found");
  }

  const otp = "";
  await userRef.update({ otp });

  return true;
}

module.exports = {
  clearOtpSession,
};
