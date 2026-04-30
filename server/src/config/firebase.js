const admin = require('firebase-admin');

let db, auth, storage;
let initialized = false;

function initFirebase() {
  if (initialized) return;
  
  try {
    const serviceAccount = {
      type: 'service_account',
      project_id: process.env.FIREBASE_PROJECT_ID,
      private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
      private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      client_id: process.env.FIREBASE_CLIENT_ID,
      auth_uri: process.env.FIREBASE_AUTH_URI,
      token_uri: process.env.FIREBASE_TOKEN_URI,
      auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_CERT_URL,
      client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL,
    };

    if (!serviceAccount.project_id) {
      console.warn('⚠️  Firebase not configured — set env vars to enable database features');
      return;
    }

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    });

    db = admin.firestore();
    auth = admin.auth();
    storage = admin.storage().bucket();
    initialized = true;
    console.log('✅ Firebase connected');
  } catch (err) {
    console.warn('⚠️  Firebase init failed:', err.message);
  }
}

// Lazy init on first access
module.exports = {
  get db() {
    initFirebase();
    return db;
  },
  get auth() {
    initFirebase();
    return auth;
  },
  get storage() {
    initFirebase();
    return storage;
  },
  get initialized() {
    return initialized;
  }
};
