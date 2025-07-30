const admin = require("firebase-admin");

// If you've downloaded your service account key JSON:
const serviceAccount = require("../../firebaseServiceAccount.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
module.exports = db;
