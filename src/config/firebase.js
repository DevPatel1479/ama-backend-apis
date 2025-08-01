const admin = require("firebase-admin");

// If you've downloaded your service account key JSON:
const serviceAccount = require("../../firebaseServiceAccount.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
});

const db = admin.firestore();
const bucket = admin.storage().bucket();
module.exports = {
  db,
  bucket,
  admin
}
