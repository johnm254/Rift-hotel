/**
 * One-time script to grant admin role to a user by email.
 * Run: node scripts/make-admin.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const admin = require('firebase-admin');

const TARGET_EMAIL = 'johnmwangi1729@gmail.com';

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

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const auth = admin.auth();

async function makeAdmin() {
  try {
    // Get user by email
    const userRecord = await auth.getUserByEmail(TARGET_EMAIL);
    console.log(`✅ Found user: ${userRecord.displayName} (${userRecord.uid})`);

    // Set custom claim
    await auth.setCustomUserClaims(userRecord.uid, { admin: true });
    console.log('✅ Custom claim set: admin = true');

    // Update Firestore
    await db.collection('users').doc(userRecord.uid).set({
      email: userRecord.email,
      name: userRecord.displayName || 'Admin',
      role: 'admin',
      updatedAt: new Date().toISOString(),
    }, { merge: true });
    console.log('✅ Firestore role updated to admin');

    console.log('\n🎉 Done! Sign out and sign back in to activate admin access.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

makeAdmin();
