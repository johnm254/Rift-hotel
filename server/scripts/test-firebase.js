/**
 * Run this locally to verify Firebase credentials work:
 * node scripts/test-firebase.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

console.log('FIREBASE_PROJECT_ID:', process.env.FIREBASE_PROJECT_ID || 'NOT SET');
console.log('FIREBASE_CLIENT_EMAIL:', process.env.FIREBASE_CLIENT_EMAIL || 'NOT SET');
console.log('FIREBASE_PRIVATE_KEY starts with:', process.env.FIREBASE_PRIVATE_KEY?.slice(0, 30) || 'NOT SET');

const admin = require('firebase-admin');

try {
  admin.initializeApp({
    credential: admin.credential.cert({
      type: 'service_account',
      project_id: process.env.FIREBASE_PROJECT_ID,
      private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
      private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      client_id: process.env.FIREBASE_CLIENT_ID,
    }),
  });
  console.log('✅ Firebase initialized successfully');
  process.exit(0);
} catch (err) {
  console.error('❌ Firebase failed:', err.message);
  process.exit(1);
}
