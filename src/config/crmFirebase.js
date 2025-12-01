const crmAdmin = require("firebase-admin");

const crmServiceAccount = {
  type: process.env.CRM_FIREBASE_TYPE,
  project_id: process.env.CRM_FIREBASE_PROJECT_ID,
  private_key_id: process.env.CRM_FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.CRM_FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  client_email: process.env.CRM_FIREBASE_CLIENT_EMAIL,
  client_id: process.env.CRM_FIREBASE_CLIENT_ID,
  auth_uri: process.env.CRM_FIREBASE_AUTH_URI,
  token_uri: process.env.CRM_FIREBASE_TOKEN_URI,
  auth_provider_x509_cert_url: process.env.CRM_FIREBASE_AUTH_PROVIDER_CERT_URL,
  client_x509_cert_url: process.env.CRM_FIREBASE_CLIENT_CERT_URL,
};

let crmApp;
try {
  crmApp = crmAdmin.app("crmApp"); // try to get existing named app
} catch (e) {
  crmApp = crmAdmin.initializeApp(
    {
      credential: crmAdmin.credential.cert(crmServiceAccount),
      storageBucket: process.env.CRM_FIREBASE_STORAGE_BUCKET,
    },
    "crmApp"
  );
}

const crmDb = crmApp.firestore();
const crmBucket = crmApp.storage().bucket();

module.exports = { crmDb, crmBucket, crmAdmin: crmApp };
