/**
 * Africa's Talking SMS Service
 * Sends SMS notifications for bookings, payments, and reminders
 */

let AT;
try {
  AT = require('africastalking');
} catch {
  AT = null;
}

let smsClient = null;

function getSmsClient() {
  if (smsClient) return smsClient;
  if (!AT) return null;
  if (!process.env.AT_API_KEY || !process.env.AT_USERNAME) {
    console.warn('⚠️  Africa\'s Talking not configured — set AT_API_KEY and AT_USERNAME');
    return null;
  }
  const client = AT({ apiKey: process.env.AT_API_KEY, username: process.env.AT_USERNAME });
  smsClient = client.SMS;
  return smsClient;
}

/**
 * Send an SMS message
 * @param {string|string[]} to - Phone number(s) in international format e.g. +254712345678
 * @param {string} message - SMS body (max 160 chars for single SMS)
 */
async function sendSMS(to, message) {
  const client = getSmsClient();
  if (!client) return { skipped: true, reason: 'SMS not configured' };

  const recipients = Array.isArray(to) ? to : [to];
  // Normalize Kenyan numbers to +254 format
  const normalized = recipients.map(n => {
    n = n.replace(/\s/g, '');
    if (n.startsWith('07') || n.startsWith('01')) return '+254' + n.slice(1);
    if (n.startsWith('254')) return '+' + n;
    return n;
  });

  try {
    const result = await client.send({
      to: normalized,
      message,
      from: process.env.AT_SENDER_ID || 'AzuraHaven',
    });
    console.log('📱 SMS sent:', result.SMSMessageData?.Message);
    return result;
  } catch (err) {
    console.warn('⚠️  SMS send failed:', err.message);
    return { error: err.message };
  }
}

// ── Pre-built message templates ──────────────────────────────────────────────

async function sendBookingSMS(phone, booking) {
  if (!phone) return;
  const msg = `Azura Haven: Booking confirmed! Room: ${booking.roomName}. Check-in: ${booking.checkIn}. Ref: ${booking.id?.slice(0, 8).toUpperCase()}. Call +254700000000 for help.`;
  return sendSMS(phone, msg);
}

async function sendBookingApprovedSMS(phone, booking) {
  if (!phone) return;
  const msg = `Azura Haven: Your booking for ${booking.roomName} on ${booking.checkIn} has been APPROVED. We look forward to welcoming you! 🏨`;
  return sendSMS(phone, msg);
}

async function sendCheckInReminderSMS(phone, booking) {
  if (!phone) return;
  const msg = `Azura Haven: Reminder! Your check-in for ${booking.roomName} is TOMORROW (${booking.checkIn}). Check-in from 2PM. See you soon! 🌟`;
  return sendSMS(phone, msg);
}

async function sendPaymentReceiptSMS(phone, amount, method) {
  if (!phone) return;
  const msg = `Azura Haven: Payment of KES ${amount?.toLocaleString()} received via ${method}. Thank you! Your booking is confirmed.`;
  return sendSMS(phone, msg);
}

async function sendCheckoutSMS(phone, booking) {
  if (!phone) return;
  const msg = `Azura Haven: Thank you for staying with us, ${booking.userName?.split(' ')[0] || 'Guest'}! We hope to see you again. Rate your stay at azurahaven.com 🌟`;
  return sendSMS(phone, msg);
}

module.exports = {
  sendSMS,
  sendBookingSMS,
  sendBookingApprovedSMS,
  sendCheckInReminderSMS,
  sendPaymentReceiptSMS,
  sendCheckoutSMS,
};
