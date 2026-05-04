/**
 * Twilio messaging service — SMS + WhatsApp
 * Handles all outbound notifications to clients and hotel owner
 *
 * Required env vars:
 *   TWILIO_ACCOUNT_SID   — ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
 *   TWILIO_AUTH_TOKEN    — xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
 *   TWILIO_PHONE_NUMBER  — +1415xxxxxxx  (your Twilio SMS number)
 *   TWILIO_WHATSAPP_FROM — whatsapp:+14155238886  (sandbox) or your approved WA sender
 */

let twilioClient = null;

function getClient() {
  if (twilioClient) return twilioClient;
  const sid   = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token) {
    console.warn('⚠️  Twilio not configured — set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN');
    return null;
  }
  twilioClient = require('twilio')(sid, token);
  console.log('📱 Twilio client initialised');
  return twilioClient;
}

// ── Normalise Kenyan phone to E.164 ──────────────────────────────────────────
function normalise(phone) {
  if (!phone) return null;
  let p = String(phone).replace(/[\s\-()]/g, '');
  if (p.startsWith('0'))   p = '+254' + p.slice(1);
  if (p.startsWith('254') && !p.startsWith('+')) p = '+' + p;
  return p;
}

// ── Send SMS ──────────────────────────────────────────────────────────────────
async function sendSMS(to, body) {
  const client = getClient();
  const from   = process.env.TWILIO_PHONE_NUMBER;
  if (!client || !from) return { skipped: true, reason: 'Twilio SMS not configured' };

  const toNorm = normalise(to);
  if (!toNorm) return { skipped: true, reason: 'Invalid phone number' };

  try {
    const msg = await client.messages.create({ from, to: toNorm, body });
    console.log(`📱 SMS sent to ${toNorm} | SID: ${msg.sid}`);
    return { sid: msg.sid };
  } catch (err) {
    console.error(`❌ SMS failed to ${toNorm}:`, err.message);
    return { error: err.message };
  }
}

// ── Send WhatsApp ─────────────────────────────────────────────────────────────
async function sendWhatsApp(to, body) {
  const client = getClient();
  const from   = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886';
  if (!client) return { skipped: true, reason: 'Twilio not configured' };

  const toNorm = normalise(to);
  if (!toNorm) return { skipped: true, reason: 'Invalid phone number' };

  try {
    const msg = await client.messages.create({
      from,
      to: `whatsapp:${toNorm}`,
      body,
    });
    console.log(`💬 WhatsApp sent to ${toNorm} | SID: ${msg.sid}`);
    return { sid: msg.sid };
  } catch (err) {
    console.error(`❌ WhatsApp failed to ${toNorm}:`, err.message);
    // Fall back to SMS if WhatsApp fails
    console.log('↩️  Falling back to SMS...');
    return sendSMS(to, body);
  }
}

// ── Send to owner (WhatsApp preferred, SMS fallback) ─────────────────────────
async function notifyOwner(body) {
  const phone = process.env.HOTEL_OWNER_PHONE || '0769113931';
  return sendWhatsApp(phone, body);
}

// ── Message templates ─────────────────────────────────────────────────────────

async function sendOrderReceiptToClient(phone, order) {
  if (!phone) return { skipped: true };
  const isService = order.type === 'service';
  const isWalkin  = order.type === 'walkin';
  const eta = isService ? '15-30 mins' : isWalkin ? '20-35 mins' : '30-45 mins';

  const itemsList = (order.items || [])
    .map(i => `  - ${i.name}${i.qty > 1 ? ` x${i.qty}` : ''}${i.price > 0 ? ` KES ${(i.price * i.qty).toLocaleString()}` : ''}`)
    .join('\n');

  const body = isService
    ? `Azura Haven - Request Received!\n\nYour *${order.items?.[0]?.name}* request is logged. Our team will attend to you shortly.\n\nRef: ${(order.id || '').slice(0,8).toUpperCase()}\nCall: +254 769 113 931`
    : `Azura Haven - Order Confirmed!\n\n${itemsList}\n\nTotal: KES ${order.total?.toLocaleString()}\nETA: ${eta}\n${order.roomNumber && order.roomNumber !== 'Walk-in' ? `Location: ${order.roomNumber}\n` : ''}Ref: ${(order.id || '').slice(0,8).toUpperCase()}\nCall: +254 769 113 931`;

  return sendWhatsApp(phone, body);
}

async function sendOrderStatusToClient(phone, order, status) {
  if (!phone) return { skipped: true };
  const messages = {
    'preparing':  `Azura Haven - Your order is being prepared!\n\nWe're working on your order for ${order.roomNumber}. It'll be with you soon!`,
    'on-the-way': `Azura Haven - Your order is on the way!\n\nYour order is heading to ${order.roomNumber} right now. Please be ready!`,
    'delivered':  `Azura Haven - Order Delivered!\n\nYour order has been delivered to ${order.roomNumber}. Enjoy! 😊\n\nThank you for choosing Azura Haven.`,
    'completed':  `Azura Haven - All done!\n\nYour request has been completed. We hope everything was perfect!\n\nRate your stay: ${process.env.CLIENT_URL || 'https://rift-hotel.vercel.app'}/survey`,
    'cancelled':  `Azura Haven - Order Cancelled\n\nYour order has been cancelled. Contact us: +254 769 113 931`,
  };
  const body = messages[status];
  if (!body) return { skipped: true };
  return sendWhatsApp(phone, body);
}

async function sendNewOrderAlertToOwner(order) {
  const typeLabel = order.type === 'walkin' ? 'Walk-in Order' :
                    order.type === 'service' ? 'Service Request' : 'Room Service';

  const itemsList = (order.items || [])
    .map(i => `  - ${i.name}${i.qty > 1 ? ` x${i.qty}` : ''}${i.price > 0 ? ` KES ${(i.price * i.qty).toLocaleString()}` : ''}`)
    .join('\n');

  const body =
    `NEW ${typeLabel.toUpperCase()}\n` +
    `Location: ${order.roomNumber || 'Walk-in'}\n` +
    `Guest: ${order.userName || 'Guest'}\n` +
    `Time: ${new Date(order.createdAt).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })}\n\n` +
    `Items:\n${itemsList}\n\n` +
    (order.total > 0 ? `Total: KES ${order.total?.toLocaleString()}\n` : '') +
    (order.paymentMethod ? `Payment: ${order.paymentMethod.toUpperCase()}\n` : '') +
    (order.notes ? `\nNote: ${order.notes}\n` : '') +
    `\nRef: ${(order.id || '').slice(0,8).toUpperCase()}`;

  return notifyOwner(body);
}

async function sendNewBookingAlertToOwner(booking) {
  const body =
    `NEW BOOKING\n` +
    `Guest: ${booking.userName}\n` +
    `Email: ${booking.userEmail}\n` +
    `Room: ${booking.roomName}\n` +
    `Check-in: ${booking.checkIn}\n` +
    `Check-out: ${booking.checkOut}\n` +
    `Guests: ${booking.guests}\n` +
    `Total: KES ${booking.totalPrice?.toLocaleString()}\n` +
    `Payment: ${booking.paymentMethod || 'Pending'}\n` +
    (booking.specialRequests ? `Note: ${booking.specialRequests}\n` : '') +
    `\nRef: ${booking.id?.slice(0,8).toUpperCase()}`;

  return notifyOwner(body);
}

async function sendBookingConfirmationToClient(phone, booking) {
  if (!phone) return { skipped: true };
  const body =
    `Azura Haven - Booking Confirmed!\n\n` +
    `Room: ${booking.roomName}\n` +
    `Check-in: ${booking.checkIn}\n` +
    `Check-out: ${booking.checkOut}\n` +
    `Guests: ${booking.guests}\n` +
    `Total: KES ${booking.totalPrice?.toLocaleString()}\n\n` +
    `Ref: ${booking.id?.slice(0,8).toUpperCase()}\n` +
    `Questions? Call: +254 769 113 931`;
  return sendWhatsApp(phone, body);
}

module.exports = {
  sendSMS,
  sendWhatsApp,
  notifyOwner,
  sendOrderReceiptToClient,
  sendOrderStatusToClient,
  sendNewOrderAlertToOwner,
  sendNewBookingAlertToOwner,
  sendBookingConfirmationToClient,
};
