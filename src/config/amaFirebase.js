// amaFirebase.js
const admin = require("firebase-admin");

const amaServiceAccount = {
  type: process.env.AMA_FIREBASE_TYPE,
  project_id: process.env.AMA_FIREBASE_PROJECT_ID,
  private_key_id: process.env.AMA_FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.AMA_FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  client_email: process.env.AMA_FIREBASE_CLIENT_EMAIL,
  client_id: process.env.AMA_FIREBASE_CLIENT_ID,
  auth_uri: process.env.AMA_FIREBASE_AUTH_URI,
  token_uri: process.env.AMA_FIREBASE_TOKEN_URI,
  auth_provider_x509_cert_url: process.env.AMA_FIREBASE_AUTH_PROVIDER_CERT_URL,
  client_x509_cert_url: process.env.AMA_FIREBASE_CLIENT_CERT_URL,
};

let amaApp;

try {
  // if already initialized
  amaApp = admin.app("amaApp");
} catch (e) {
  // initialize new firebase app
  amaApp = admin.initializeApp(
    {
      credential: admin.credential.cert(amaServiceAccount),
      storageBucket: process.env.AMA_FIREBASE_STORAGE_BUCKET,
    },
    "amaApp" // unique name
  );
}

const amaDb = amaApp.firestore();
const amaBucket = amaApp.storage().bucket();

module.exports = { amaDb, amaBucket, amaAdmin: amaApp };
