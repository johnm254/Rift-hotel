/**
 * WhatsApp messaging via Africa's Talking WhatsApp API
 * Falls back to SMS if WhatsApp is not configured
 */

const axios = require('axios');
const { sendSMS } = require('./sms');

const AT_BASE = 'https://content.africastalking.com/version1/messaging/whatsapp';

async function sendWhatsApp(to, message) {
  if (!process.env.AT_API_KEY || !process.env.AT_USERNAME) {
    console.warn('⚠️  WhatsApp not configured — falling back to SMS');
    return sendSMS(to, message);
  }

  // Normalize phone to international format
  let phone = to.replace(/\s/g, '');
  if (phone.startsWith('07') || phone.startsWith('01')) phone = '+254' + phone.slice(1);
  if (phone.startsWith('254') && !phone.startsWith('+')) phone = '+' + phone;

  try {
    const res = await axios.post(AT_BASE, {
      username: process.env.AT_USERNAME,
      to: phone,
      message,
      channel: 'whatsapp',
    }, {
      headers: {
        apiKey: process.env.AT_API_KEY,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });
    console.log('💬 WhatsApp sent:', res.data);
    return res.data;
  } catch (err) {
    console.warn('⚠️  WhatsApp failed, falling back to SMS:', err.message);
    return sendSMS(to, message);
  }
}

// ── Pre-built WhatsApp message templates ─────────────────────────────────────

async function sendBookingWhatsApp(phone, booking) {
  if (!phone) return;
  const msg = `🏨 *Azura Haven — Booking Confirmed!*\n\n` +
    `Room: *${booking.roomName}*\n` +
    `Check-in: *${booking.checkIn}*\n` +
    `Check-out: *${booking.checkOut}*\n` +
    `Guests: *${booking.guests}*\n` +
    `Total: *KES ${booking.totalPrice?.toLocaleString()}*\n\n` +
    `Ref: ${booking.id?.slice(0, 8).toUpperCase()}\n\n` +
    `Need help? Reply to this message or call +254 700 000 000`;
  return sendWhatsApp(phone, msg);
}

async function sendApprovalWhatsApp(phone, booking) {
  if (!phone) return;
  const msg = `✅ *Azura Haven — Booking Approved!*\n\n` +
    `Your booking for *${booking.roomName}* has been confirmed.\n\n` +
    `📅 Check-in: *${booking.checkIn}* from 2:00 PM\n` +
    `📅 Check-out: *${booking.checkOut}* by 11:00 AM\n\n` +
    `We look forward to welcoming you! 🌟`;
  return sendWhatsApp(phone, msg);
}

async function sendPaymentReceiptWhatsApp(phone, amount, method, bookingId) {
  if (!phone) return;
  const msg = `💰 *Azura Haven — Payment Received*\n\n` +
    `Amount: *KES ${amount?.toLocaleString()}*\n` +
    `Method: *${method}*\n` +
    `Ref: ${bookingId?.slice(0, 8).toUpperCase() || 'N/A'}\n\n` +
    `Thank you for your payment!`;
  return sendWhatsApp(phone, msg);
}

async function sendCheckInReminderWhatsApp(phone, booking) {
  if (!phone) return;
  const msg = `⏰ *Azura Haven — Check-in Tomorrow!*\n\n` +
    `Hi! Your check-in for *${booking.roomName}* is tomorrow *${booking.checkIn}*.\n\n` +
    `🕑 Check-in from 2:00 PM\n` +
    `📍 Westlands, Nairobi\n` +
    `📞 +254 700 000 000\n\n` +
    `Show your QR code at reception for express check-in. See you soon! 🏨`;
  return sendWhatsApp(phone, msg);
}

module.exports = {
  sendWhatsApp,
  sendBookingWhatsApp,
  sendApprovalWhatsApp,
  sendPaymentReceiptWhatsApp,
  sendCheckInReminderWhatsApp,
};
