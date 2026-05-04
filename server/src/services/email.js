const nodemailer = require('nodemailer');
const dns = require('dns');
const net = require('net');

// Force IPv4 DNS resolution globally
dns.setDefaultResultOrder('ipv4first');

// Gmail's actual IPv4 addresses for SMTP (port 465)
// Using direct IP bypasses DNS resolution entirely — fixes ENETUNREACH on Render
const GMAIL_SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const GMAIL_SMTP_IP   = '74.125.133.108'; // smtp.gmail.com IPv4 — fallback if DNS fails

let _transporter = null;

function getTransporter() {
  if (_transporter) return _transporter;
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('⚠️  SMTP not configured — set SMTP_USER and SMTP_PASS');
    return null;
  }

  const port   = parseInt(process.env.SMTP_PORT) || 465;
  const secure = port === 465;

  _transporter = nodemailer.createTransport({
    host: GMAIL_SMTP_HOST,
    port,
    secure,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    // Force IPv4 at the socket level — critical for Render
    family: 4,
    tls: {
      rejectUnauthorized: false,
      // Explicitly set servername so TLS works with direct IP
      servername: GMAIL_SMTP_HOST,
    },
    connectionTimeout: 30000,
    greetingTimeout: 20000,
    socketTimeout: 30000,
  });

  console.log(`📧 SMTP: ${GMAIL_SMTP_HOST}:${port} (secure=${secure}) as ${process.env.SMTP_USER}`);
  return _transporter;
}

const FROM = () => `"Azura Haven" <${process.env.SMTP_USER || 'reservations@azurahaven.com'}>`;

async function sendMail(options) {
  const transporter = getTransporter();
  if (!transporter) return { skipped: true };
  try {
    const result = await transporter.sendMail({ from: FROM(), ...options });
    console.log('📧 Email sent to:', options.to, '| ID:', result.messageId);
    return result;
  } catch (err) {
    console.error('❌ Email failed (attempt 1):', err.message);
    _transporter = null;

    // Retry with direct IPv4 address to bypass DNS
    if (err.message.includes('ENETUNREACH') || err.message.includes('ECONNREFUSED') || err.message.includes('getaddrinfo')) {
      console.log('🔄 Retrying with direct IPv4...');
      try {
        const port   = parseInt(process.env.SMTP_PORT) || 465;
        const secure = port === 465;
        const retryTransport = require('nodemailer').createTransport({
          host: GMAIL_SMTP_IP,
          port,
          secure,
          auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
          family: 4,
          tls: { rejectUnauthorized: false, servername: 'smtp.gmail.com' },
          connectionTimeout: 30000,
          greetingTimeout: 20000,
          socketTimeout: 30000,
        });
        const result = await retryTransport.sendMail({ from: FROM(), ...options });
        console.log('📧 Email sent (retry) to:', options.to, '| ID:', result.messageId);
        return result;
      } catch (retryErr) {
        console.error('❌ Email retry also failed:', retryErr.message);
        return { error: retryErr.message };
      }
    }

    return { error: err.message };
  }
}

async function sendBookingConfirmation(to, booking) {
  const isOwner = booking._isOwnerCopy;
  return sendMail({
    to,
    subject: isOwner
      ? `🏨 New Booking — ${booking.roomName} (${booking.userName})`
      : `✅ Booking Confirmed — ${booking.roomName} | Azura Haven`,
    html: `
      <div style="font-family:'Georgia',serif;max-width:560px;margin:0 auto;background:#F5F1EB;border-radius:16px;overflow:hidden">
        <div style="background:#1B2A4A;padding:32px;text-align:center">
          <h1 style="color:#C9A96E;margin:0;font-size:24px">🏨 Azura Haven</h1>
          <p style="color:rgba(245,241,235,0.6);margin:8px 0 0;font-size:13px">Westlands, Nairobi · reservations@azurahaven.com</p>
        </div>
        <div style="padding:32px">
          <h2 style="color:#1B2A4A;margin:0 0 8px">${isOwner ? '📋 New Booking Received' : 'Booking Confirmed! 🎉'}</h2>
          <p style="color:#6B7280;margin:0 0 24px">
            ${isOwner
              ? `<strong>${booking.userName}</strong> (${booking.userEmail}) has made a booking.`
              : `Dear <strong>${booking.userName?.split(' ')[0] || 'Guest'}</strong>, your stay has been booked successfully.`
            }
          </p>
          <div style="background:white;border-radius:12px;padding:20px;margin-bottom:16px">
            ${[
              ['Room', booking.roomName],
              ['Check-in', booking.checkIn],
              ['Check-out', booking.checkOut],
              ['Guests', booking.guests],
              ['Payment Method', booking.paymentMethod || 'Pending'],
              ['Payment Status', booking.paymentStatus === 'paid' ? '✅ Paid' : '⏳ Pending'],
              ['Booking Ref', booking.id?.slice(0, 8).toUpperCase()],
            ].map(([label, val]) => `
              <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #EBE3D6">
                <span style="color:#6B7280">${label}</span>
                <span style="color:#1B2A4A;font-weight:600">${val || '—'}</span>
              </div>
            `).join('')}
            <div style="display:flex;justify-content:space-between;padding:12px 0 0">
              <span style="color:#6B7280;font-weight:600">Total</span>
              <span style="color:#C9A96E;font-weight:700;font-size:20px">KES ${booking.totalPrice?.toLocaleString()}</span>
            </div>
          </div>
          ${booking.specialRequests ? `<p style="color:#6B7280;font-style:italic;background:white;border-radius:12px;padding:16px;margin:0 0 16px">💬 Special request: ${booking.specialRequests}</p>` : ''}
          ${!isOwner ? `<p style="color:#6B7280;font-size:13px;margin:0">Check-in from 2:00 PM · Check-out by 11:00 AM<br>Questions? Call us: <strong>+254 769 113 931</strong></p>` : ''}
        </div>
        <div style="background:#1B2A4A;padding:16px;text-align:center">
          <p style="color:#C9A96E;margin:0;font-size:12px">Azura Haven · Nairobi, Kenya · reservations@azurahaven.com</p>
        </div>
      </div>
    `,
  });
}

async function sendStatusUpdate(to, booking, newStatus) {
  const statusColor = newStatus === 'approved' ? '#16a34a' : '#dc2626';
  const statusEmoji = newStatus === 'approved' ? '✅' : '❌';
  const statusText = newStatus === 'approved' ? 'Approved' : 'Declined';

  return sendMail({
    to,
    subject: `Booking ${statusText} — ${booking.roomName}`,
    html: `
      <div style="font-family:'Georgia',serif;max-width:560px;margin:0 auto;background:#F5F1EB;border-radius:16px;overflow:hidden">
        <div style="background:#1B2A4A;padding:32px;text-align:center">
          <h1 style="color:#C9A96E;margin:0;font-size:24px">🏨 Azura Haven</h1>
        </div>
        <div style="padding:32px;text-align:center">
          <div style="font-size:48px;margin-bottom:16px">${statusEmoji}</div>
          <h2 style="color:#1B2A4A;margin:0 0 8px">Booking ${statusText}</h2>
          <p style="color:#6B7280;margin:0 0 24px">Your booking for <strong style="color:#1B2A4A">${booking.roomName}</strong> (${booking.checkIn} → ${booking.checkOut}) has been <span style="color:${statusColor};font-weight:700">${statusText.toLowerCase()}</span>.</p>
          ${newStatus === 'approved'
            ? `<p style="color:#6B7280;margin:0">We look forward to hosting you! See you on ${booking.checkIn}.</p>`
            : `<p style="color:#6B7280;margin:0">Please browse other available rooms or contact us for assistance.</p>`
          }
        </div>
        <div style="background:#1B2A4A;padding:16px;text-align:center">
          <p style="color:#C9A96E;margin:0;font-size:12px">Nairobi, Kenya · reservations@azurahaven.com</p>
        </div>
      </div>
    `,
  });
}

async function sendWelcomeEmail(to, name) {
  return sendMail({
    to,
    subject: 'Welcome to Azura Haven 🌟',
    html: `
      <div style="font-family:'Georgia',serif;max-width:560px;margin:0 auto;background:#F5F1EB;border-radius:16px;overflow:hidden">
        <div style="background:#1B2A4A;padding:32px;text-align:center">
          <h1 style="color:#C9A96E;margin:0;font-size:24px">🏨 Azura Haven</h1>
        </div>
        <div style="padding:32px;text-align:center">
          <div style="font-size:48px;margin-bottom:16px">🌟</div>
          <h2 style="color:#1B2A4A;margin:0 0 8px">Welcome, ${name}!</h2>
          <p style="color:#6B7280;margin:0 0 24px">Thank you for joining Azura Haven. Browse our luxury rooms, explore our dining menu, and book your perfect stay.</p>
          <a href="${process.env.CLIENT_URL || 'https://rift-hotel.vercel.app'}/rooms" style="display:inline-block;background:#C9A96E;color:#1B2A4A;padding:12px 32px;border-radius:12px;text-decoration:none;font-weight:700;text-transform:uppercase;letter-spacing:2px;font-size:13px">Explore Rooms</a>
        </div>
        <div style="background:#1B2A4A;padding:16px;text-align:center">
          <p style="color:#C9A96E;margin:0;font-size:12px">Nairobi, Kenya · reservations@azurahaven.com</p>
        </div>
      </div>
    `,
  });
}

async function sendOrderNotification(to, order) {
  const typeLabel = order.type === 'walkin' ? '🍴 Walk-in Order' :
                    order.type === 'service' ? '🛎️ Service Request' : '🍽️ Room Service';
  const isService = order.type === 'service';

  return sendMail({
    to,
    subject: `${typeLabel} — ${order.roomNumber} | Azura Haven`,
    html: `
      <div style="font-family:'Georgia',serif;max-width:560px;margin:0 auto;background:#F5F1EB;border-radius:16px;overflow:hidden">
        <div style="background:#1B2A4A;padding:24px;text-align:center">
          <h1 style="color:#C9A96E;margin:0;font-size:22px">🏨 Azura Haven</h1>
          <p style="color:rgba(245,241,235,0.5);margin:6px 0 0;font-size:12px">Admin Notification</p>
        </div>
        <div style="padding:28px">
          <h2 style="color:#1B2A4A;margin:0 0 4px">${typeLabel}</h2>
          <p style="color:#6B7280;margin:0 0 20px">
            📍 <strong>${order.roomNumber}</strong> &nbsp;·&nbsp; 👤 ${order.userName}
            ${order.paymentMethod ? ` &nbsp;·&nbsp; 💳 ${order.paymentMethod.toUpperCase()}` : ''}
          </p>
          <div style="background:white;border-radius:12px;padding:16px;margin-bottom:16px">
            ${(order.items || []).map(item => `
              <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #EBE3D6">
                <span style="color:#1B2A4A">${item.name}${item.qty > 1 ? ` × ${item.qty}` : ''}</span>
                ${item.price > 0 ? `<span style="color:#C9A96E;font-weight:600">KES ${(item.price * item.qty).toLocaleString()}</span>` : '<span style="color:#6B7280">—</span>'}
              </div>
            `).join('')}
            ${order.total > 0 ? `
              <div style="display:flex;justify-content:space-between;padding:10px 0 0">
                <span style="font-weight:600;color:#6B7280">Total</span>
                <span style="color:#C9A96E;font-weight:700;font-size:18px">KES ${order.total?.toLocaleString()}</span>
              </div>
            ` : ''}
          </div>
          ${order.notes ? `<p style="color:#6B7280;font-style:italic;background:white;border-radius:12px;padding:14px;margin:0 0 12px">💬 ${order.notes}</p>` : ''}
          <p style="color:#6B7280;font-size:12px;margin:0">Order ID: ${order.id || 'N/A'} &nbsp;·&nbsp; ${new Date(order.createdAt).toLocaleString('en-KE')}</p>
        </div>
        <div style="background:#1B2A4A;padding:14px;text-align:center">
          <p style="color:#C9A96E;margin:0;font-size:12px">Azura Haven · Nairobi, Kenya</p>
        </div>
      </div>
    `,
  });
}

// Client-facing order receipt email
async function sendOrderReceiptEmail(to, order) {
  if (!to || to === 'walkin@azurahaven.com') return { skipped: true };
  const isService = order.type === 'service';
  const isWalkin  = order.type === 'walkin';
  const eta = isService ? '15–30 minutes' : isWalkin ? '20–35 minutes' : '30–45 minutes';

  return sendMail({
    to,
    subject: isService
      ? `✅ Service Request Received — Azura Haven`
      : `✅ Order Confirmed — Azura Haven`,
    html: `
      <div style="font-family:'Georgia',serif;max-width:560px;margin:0 auto;background:#F5F1EB;border-radius:16px;overflow:hidden">
        <div style="background:#1B2A4A;padding:32px;text-align:center">
          <h1 style="color:#C9A96E;margin:0;font-size:24px">🏨 Azura Haven</h1>
          <p style="color:rgba(245,241,235,0.6);margin:8px 0 0;font-size:13px">Westlands, Nairobi</p>
        </div>
        <div style="padding:32px">
          <div style="text-align:center;margin-bottom:24px">
            <div style="font-size:48px;margin-bottom:12px">${isService ? '🛎️' : '🍽️'}</div>
            <h2 style="color:#1B2A4A;margin:0 0 8px">${isService ? 'Request Received!' : 'Order Confirmed!'}</h2>
            <p style="color:#6B7280;margin:0">
              ${isService
                ? `Your <strong>${order.items?.[0]?.name}</strong> request has been logged. Our team will attend to you shortly.`
                : `Your order is being prepared and will be ready in <strong>${eta}</strong>.`
              }
            </p>
          </div>

          ${!isService ? `
          <div style="background:white;border-radius:12px;padding:20px;margin-bottom:16px">
            <p style="color:#6B7280;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:1px;margin:0 0 12px">Order Summary</p>
            ${(order.items || []).map(item => `
              <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #EBE3D6">
                <span style="color:#1B2A4A">${item.name}${item.qty > 1 ? ` × ${item.qty}` : ''}</span>
                ${item.price > 0 ? `<span style="color:#C9A96E;font-weight:600">KES ${(item.price * item.qty).toLocaleString()}</span>` : ''}
              </div>
            `).join('')}
            ${order.total > 0 ? `
              <div style="display:flex;justify-content:space-between;padding:12px 0 0">
                <span style="color:#6B7280;font-weight:600">Total</span>
                <span style="color:#C9A96E;font-weight:700;font-size:20px">KES ${order.total?.toLocaleString()}</span>
              </div>
              ${order.paymentMethod ? `<p style="color:#6B7280;font-size:12px;margin:8px 0 0">Paid via: ${order.paymentMethod.toUpperCase()}</p>` : ''}
            ` : ''}
          </div>
          ` : ''}

          <div style="background:white;border-radius:12px;padding:16px;margin-bottom:16px">
            ${order.roomNumber && order.roomNumber !== 'Walk-in' ? `
              <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #EBE3D6">
                <span style="color:#6B7280">Location</span>
                <span style="color:#1B2A4A;font-weight:600">${order.roomNumber}</span>
              </div>
            ` : ''}
            <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #EBE3D6">
              <span style="color:#6B7280">Estimated Time</span>
              <span style="color:#1B2A4A;font-weight:600">${eta}</span>
            </div>
            <div style="display:flex;justify-content:space-between;padding:6px 0">
              <span style="color:#6B7280">Order Ref</span>
              <span style="color:#1B2A4A;font-weight:600">${(order.id || '').slice(0, 8).toUpperCase() || 'N/A'}</span>
            </div>
          </div>

          ${order.notes ? `<p style="color:#6B7280;font-style:italic;background:white;border-radius:12px;padding:14px;margin:0 0 16px">💬 ${order.notes}</p>` : ''}

          <p style="color:#6B7280;font-size:13px;margin:0;text-align:center">
            Questions? Call us: <strong>+254 769 113 931</strong>
          </p>
        </div>
        <div style="background:#1B2A4A;padding:16px;text-align:center">
          <p style="color:#C9A96E;margin:0;font-size:12px">Azura Haven · Nairobi, Kenya · reservations@azurahaven.com</p>
        </div>
      </div>
    `,
  });
}

async function sendOrderStatusEmail(to, order, status) {
  if (!to || to === 'walkin@azurahaven.com') return { skipped: true };
  const statusMessages = {
    'preparing':  { emoji: '👨‍🍳', text: 'Your order is being prepared', detail: `We're working on your order at <strong>${order.roomNumber}</strong>. It'll be with you soon!` },
    'on-the-way': { emoji: '🚶', text: 'Your order is on the way!', detail: `Your order is heading to <strong>${order.roomNumber}</strong> right now. Please be ready to receive it!` },
    'delivered':  { emoji: '✅', text: 'Order Delivered!', detail: `Your order has been delivered to <strong>${order.roomNumber}</strong>. Enjoy your meal! 😊` },
    'completed':  { emoji: '🎉', text: 'All Done!', detail: `Your request has been completed. We hope everything was perfect!` },
    'cancelled':  { emoji: '❌', text: 'Order Cancelled', detail: `Your order has been cancelled. Contact us at <strong>+254 769 113 931</strong> if this was a mistake.` },
  };
  const sm = statusMessages[status];
  if (!sm) return { skipped: true };

  return sendMail({
    to,
    subject: `${sm.emoji} ${sm.text} — Azura Haven`,
    html: `
      <div style="font-family:'Georgia',serif;max-width:560px;margin:0 auto;background:#F5F1EB;border-radius:16px;overflow:hidden">
        <div style="background:#1B2A4A;padding:24px;text-align:center">
          <h1 style="color:#C9A96E;margin:0;font-size:22px">🏨 Azura Haven</h1>
        </div>
        <div style="padding:32px;text-align:center">
          <div style="font-size:48px;margin-bottom:16px">${sm.emoji}</div>
          <h2 style="color:#1B2A4A;margin:0 0 12px">${sm.text}</h2>
          <p style="color:#6B7280;margin:0 0 20px">${sm.detail}</p>
          <p style="color:#6B7280;font-size:13px;margin:0">Order Ref: <strong>${(order.id || '').slice(0,8).toUpperCase()}</strong></p>
        </div>
        <div style="background:#1B2A4A;padding:14px;text-align:center">
          <p style="color:#C9A96E;margin:0;font-size:12px">Azura Haven · +254 769 113 931 · reservations@azurahaven.com</p>
        </div>
      </div>
    `,
  });
}

module.exports = { sendBookingConfirmation, sendStatusUpdate, sendWelcomeEmail, sendOrderNotification, sendOrderReceiptEmail, sendOrderStatusEmail };
