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
  const msg = `✅ *Azura Haven — Payment Confirmed!*\n\n` +
    `💰 Amount: *KES ${amount?.toLocaleString()}*\n` +
    `💳 Method: *${method}*\n` +
    `📋 Ref: *${bookingId?.slice(0, 8).toUpperCase() || 'N/A'}*\n\n` +
    `Your booking is confirmed. We look forward to welcoming you! 🏨\n\n` +
    `Questions? Call us: +254 700 000 000`;
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

async function sendOrderWhatsApp(phone, order) {
  if (!phone) return;

  const typeLabel = order.type === 'walkin' ? '🍴 Walk-in Order' :
                    order.type === 'service' ? '🛎️ Service Request' : '🍽️ Room Service';

  const itemsList = (order.items || [])
    .map(i => `  • ${i.name}${i.qty > 1 ? ` × ${i.qty}` : ''}${i.price > 0 ? ` — KES ${(i.price * i.qty).toLocaleString()}` : ''}`)
    .join('\n');

  const msg =
    `${typeLabel}\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `📍 *${order.roomNumber || 'Walk-in'}*\n` +
    `👤 ${order.userName || 'Guest'}\n` +
    `🕐 ${new Date(order.createdAt).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })}\n\n` +
    `*Items:*\n${itemsList}\n\n` +
    (order.total > 0 ? `💰 *Total: KES ${order.total?.toLocaleString()}*\n` : '') +
    (order.paymentMethod ? `💳 Payment: ${order.paymentMethod.toUpperCase()}\n` : '') +
    (order.notes ? `\n💬 _${order.notes}_\n` : '') +
    `\n_Ref: ${(order.id || '').slice(0, 8).toUpperCase() || 'NEW'}_`;

  return sendWhatsApp(phone, msg);
}

// Client-facing order receipt — friendly confirmation sent to the customer
async function sendOrderReceiptWhatsApp(phone, order) {
  if (!phone) return;

  const isService = order.type === 'service';
  const isWalkin  = order.type === 'walkin';

  const itemsList = (order.items || [])
    .map(i => `  ✓ ${i.name}${i.qty > 1 ? ` × ${i.qty}` : ''}${i.price > 0 ? ` — KES ${(i.price * i.qty).toLocaleString()}` : ''}`)
    .join('\n');

  const eta = isService ? '15–30 minutes' : isWalkin ? '20–35 minutes' : '30–45 minutes';

  const msg =
    `🏨 *Azura Haven*\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    (isService
      ? `✅ *Service Request Received!*\n\nYour *${order.items?.[0]?.name}* request has been logged. Our team will attend to you shortly.\n`
      : `✅ *Order Confirmed!*\n\n${itemsList}\n\n` +
        (order.total > 0 ? `💰 *Total: KES ${order.total?.toLocaleString()}*\n` : '') +
        (order.paymentMethod ? `💳 Paid via: ${order.paymentMethod.toUpperCase()}\n` : '')
    ) +
    `\n⏱️ Estimated time: *${eta}*\n` +
    (order.roomNumber && order.roomNumber !== 'Walk-in'
      ? `📍 Delivering to: *${order.roomNumber}*\n`
      : '') +
    `\n_Ref: ${(order.id || '').slice(0, 8).toUpperCase() || 'NEW'}_\n` +
    `\nQuestions? Call us: *+254 769 113 931*`;

  return sendWhatsApp(phone, msg);
}

// Client status update — sent when order moves to on-the-way or delivered
async function sendOrderStatusWhatsApp(phone, order, newStatus) {
  if (!phone) return;

  const msgs = {
    'preparing':    `👨‍🍳 *Your order is being prepared!*\n\nWe're working on your order at *${order.roomNumber}*. It'll be with you soon! 🍽️`,
    'on-the-way':   `🚶 *Your order is on the way!*\n\nYour order from Azura Haven is heading to *${order.roomNumber}* right now. Please be ready to receive it! 🏃`,
    'delivered':    `✅ *Order Delivered!*\n\nYour order has been delivered to *${order.roomNumber}*. Enjoy your meal! 😊\n\nThank you for choosing Azura Haven. 🏨`,
    'completed':    `🎉 *All done!*\n\nYour request at Azura Haven has been completed. We hope everything was perfect!\n\nRate your experience: ${process.env.CLIENT_URL || 'https://rift-hotel.vercel.app'}/survey`,
    'cancelled':    `❌ *Order Cancelled*\n\nYour order at Azura Haven has been cancelled. If this was a mistake, please contact us at *+254 769 113 931*.`,
  };

  const msg = msgs[newStatus];
  if (!msg) return;
  return sendWhatsApp(phone, msg);
}

module.exports = {
  sendWhatsApp,
  sendBookingWhatsApp,
  sendApprovalWhatsApp,
  sendPaymentReceiptWhatsApp,
  sendCheckInReminderWhatsApp,
  sendOrderWhatsApp,
  sendOrderReceiptWhatsApp,
  sendOrderStatusWhatsApp,
};
