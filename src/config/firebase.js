const admin = require("firebase-admin");

const mainServiceAccount = {
  type: process.env.FIREBASE_TYPE,
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: process.env.FIREBASE_AUTH_URI,
  token_uri: process.env.FIREBASE_TOKEN_URI,
  auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_CERT_URL,
  client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL,
};

// ⭐ initialize Main Firebase with another unique name
const mainApp =
  admin.apps.length === 0
    ? admin.initializeApp(
        {
          credential: admin.credential.cert(mainServiceAccount),
          storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
        },
        "mainApp" // <-- custom name
      )
    : admin.app("mainApp");

const db = mainApp.firestore();
const bucket = mainApp.storage().bucket();

module.exports = { db, bucket, admin: mainApp };
