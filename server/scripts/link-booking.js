
/**
 * Links the test active booking to your real Firebase Auth UID
 * so the Room Portal works when you sign in.
 *
 * Usage: node scripts/link-booking.js <your-firebase-uid>
 * Example: node scripts/link-booking.js abc123xyz
 *
 * To find your UID: sign in to the site, open browser console, run:
 *   firebase.auth().currentUser.uid
 * OR check Firebase Console → Authentication → Users
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const admin = require('firebase-admin');

admin.initializeApp({
  credential: admin.credential.cert({
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
  }),
});

const db = admin.firestore();

async function linkBooking() {
  const uid = process.argv[2];
  if (!uid) {
    console.error('❌ Usage: node scripts/link-booking.js <your-firebase-uid>');
    console.error('   Find your UID in Firebase Console → Authentication → Users');
    process.exit(1);
  }

  console.log(`🔗 Linking booking-active to UID: ${uid}`);

  // Update the active booking
  await db.collection('bookings').doc('booking-active').update({
    userId: uid,
    userEmail: process.env.SMTP_USER || 'johnmwangi1729@gmail.com',
    updatedAt: new Date().toISOString(),
  });

  // Also update the service order linked to this booking
  const ordersSnap = await db.collection('orders')
    .where('bookingId', '==', 'booking-active').get();

  for (const doc of ordersSnap.docs) {
    await doc.ref.update({ userId: uid });
  }

  console.log(`✅ Done! booking-active is now linked to ${uid}`);
  console.log('   Sign in to the site and go to /my-room to test the Room Portal.');
  process.exit(0);
}

linkBooking().catch(err => {
  console.error('❌ Failed:', err.message);
  process.exit(1);
});
