
/**
 * Email service — SendGrid (primary) + Gmail SMTP (fallback)
 *
 * SendGrid uses HTTPS port 443 — never blocked on Render or any cloud host.
 * Gmail SMTP is kept as fallback for local dev.
 *
 * To activate SendGrid:
 *   1. Sign up free at sendgrid.com (100 emails/day free)
 *   2. Create an API key (Settings → API Keys → Create)
 *   3. Add to Render env: SENDGRID_API_KEY=SG.xxxxx
 *   4. Add: SENDGRID_FROM=johnmwangi1729@gmail.com
 */

const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

// ── SendGrid (primary — HTTPS, never blocked) ─────────────────────────────────
async function sendViaSendGrid(options) {
  if (!process.env.SENDGRID_API_KEY) return null;

  const sgMail = require('@sendgrid/mail');
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);

  const from = process.env.SENDGRID_FROM || process.env.SMTP_USER || 'reservations@azurahaven.com';

  try {
    await sgMail.send({
      from: { email: from, name: 'Azura Haven' },
      to: options.to,
      subject: options.subject,
      html: options.html || '<p>' + options.subject + '</p>',
      text: options.text || options.subject,
    });
    console.log('📧 SendGrid: sent to', options.to);
    return { sent: true, provider: 'sendgrid' };
  } catch (err) {
    const msg = err.response?.body?.errors?.[0]?.message || err.message;
    console.error('❌ SendGrid failed:', msg);
    return null;
  }
}

// ── Gmail SMTP (fallback — may be blocked on Render free tier) ────────────────
const nodemailer = require('nodemailer');
let _transporter = null;

function getTransporter() {
  if (_transporter) return _transporter;
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) return null;

  const port   = parseInt(process.env.SMTP_PORT) || 465;
  const secure = port === 465;

  _transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port,
    secure,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    family: 4,
    tls: { rejectUnauthorized: false },
    connectionTimeout: 30000,
    greetingTimeout: 20000,
    socketTimeout: 30000,
  });
  return _transporter;
}

async function sendViaSmtp(options) {
  const transporter = getTransporter();
  if (!transporter) return null;
  try {
    const result = await transporter.sendMail({
      from: `"Azura Haven" <${process.env.SMTP_USER}>`,
      ...options,
    });
    console.log('📧 SMTP: sent to', options.to, '| ID:', result.messageId);
    return { sent: true, provider: 'smtp', messageId: result.messageId };
  } catch (err) {
    console.error('❌ SMTP failed:', err.message);
    _transporter = null;
    return null;
  }
}

// ── Main sendMail — SendGrid first, SMTP fallback ─────────────────────────────
async function sendMail(options) {
  if (!options.to) return { skipped: true, reason: 'No recipient' };

  const sg = await sendViaSendGrid(options);
  if (sg) return sg;

  const smtp = await sendViaSmtp(options);
  if (smtp) return smtp;

  return { error: 'All email providers failed or not configured' };
}

const FROM_NAME = 'Azura Haven';

// ── Templates ─────────────────────────────────────────────────────────────────

async function sendBookingConfirmation(to, booking) {
  const isOwner = booking._isOwnerCopy;
  return sendMail({
    to,
    subject: isOwner
      ? `New Booking — ${booking.roomName} (${booking.userName})`
      : `Booking Confirmed — ${booking.roomName} | Azura Haven`,
    html: `
      <div style="font-family:'Georgia',serif;max-width:560px;margin:0 auto;background:#F5F1EB;border-radius:16px;overflow:hidden">
        <div style="background:#1B2A4A;padding:32px;text-align:center">
          <h1 style="color:#C9A96E;margin:0;font-size:24px">Azura Haven</h1>
          <p style="color:rgba(245,241,235,0.6);margin:8px 0 0;font-size:13px">Westlands, Nairobi</p>
        </div>
        <div style="padding:32px">
          <h2 style="color:#1B2A4A;margin:0 0 8px">${isOwner ? 'New Booking Received' : 'Booking Confirmed!'}</h2>
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
              ['Payment', booking.paymentMethod || 'Pending'],
              ['Status', booking.paymentStatus === 'paid' ? 'Paid' : 'Pending'],
              ['Ref', booking.id?.slice(0, 8).toUpperCase()],
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
          ${booking.specialRequests ? `<p style="color:#6B7280;font-style:italic;background:white;border-radius:12px;padding:16px;margin:0 0 16px">Note: ${booking.specialRequests}</p>` : ''}
          ${!isOwner ? `<p style="color:#6B7280;font-size:13px;margin:0">Check-in from 2:00 PM · Check-out by 11:00 AM<br>Questions? Call: <strong>+254 769 113 931</strong></p>` : ''}
        </div>
        <div style="background:#1B2A4A;padding:16px;text-align:center">
          <p style="color:#C9A96E;margin:0;font-size:12px">Azura Haven · Nairobi, Kenya · reservations@azurahaven.com</p>
        </div>
      </div>
    `,
  });
}

async function sendStatusUpdate(to, booking, newStatus) {
  const approved = newStatus === 'approved';
  return sendMail({
    to,
    subject: `Booking ${approved ? 'Approved' : 'Declined'} — ${booking.roomName}`,
    html: `
      <div style="font-family:'Georgia',serif;max-width:560px;margin:0 auto;background:#F5F1EB;border-radius:16px;overflow:hidden">
        <div style="background:#1B2A4A;padding:32px;text-align:center">
          <h1 style="color:#C9A96E;margin:0;font-size:24px">Azura Haven</h1>
        </div>
        <div style="padding:32px;text-align:center">
          <div style="font-size:48px;margin-bottom:16px">${approved ? '✅' : '❌'}</div>
          <h2 style="color:#1B2A4A;margin:0 0 8px">Booking ${approved ? 'Approved' : 'Declined'}</h2>
          <p style="color:#6B7280;margin:0 0 24px">
            Your booking for <strong>${booking.roomName}</strong> (${booking.checkIn} to ${booking.checkOut})
            has been <strong style="color:${approved ? '#16a34a' : '#dc2626'}">${approved ? 'approved' : 'declined'}</strong>.
          </p>
          ${approved
            ? `<p style="color:#6B7280">We look forward to hosting you on ${booking.checkIn}!</p>`
            : `<p style="color:#6B7280">Please browse other rooms or contact us for help.</p>`
          }
        </div>
        <div style="background:#1B2A4A;padding:16px;text-align:center">
          <p style="color:#C9A96E;margin:0;font-size:12px">Azura Haven · +254 769 113 931</p>
        </div>
      </div>
    `,
  });
}

async function sendWelcomeEmail(to, name) {
  return sendMail({
    to,
    subject: 'Welcome to Azura Haven',
    html: `
      <div style="font-family:'Georgia',serif;max-width:560px;margin:0 auto;background:#F5F1EB;border-radius:16px;overflow:hidden">
        <div style="background:#1B2A4A;padding:32px;text-align:center">
          <h1 style="color:#C9A96E;margin:0;font-size:24px">Azura Haven</h1>
        </div>
        <div style="padding:32px;text-align:center">
          <div style="font-size:48px;margin-bottom:16px">🌟</div>
          <h2 style="color:#1B2A4A;margin:0 0 8px">Welcome, ${name}!</h2>
          <p style="color:#6B7280;margin:0 0 24px">Thank you for joining Azura Haven. Browse our luxury rooms and book your perfect stay.</p>
          <a href="${process.env.CLIENT_URL || 'https://rift-hotel.vercel.app'}/rooms"
            style="display:inline-block;background:#C9A96E;color:#1B2A4A;padding:12px 32px;border-radius:12px;text-decoration:none;font-weight:700;font-size:13px">
            Explore Rooms
          </a>
        </div>
        <div style="background:#1B2A4A;padding:16px;text-align:center">
          <p style="color:#C9A96E;margin:0;font-size:12px">Azura Haven · Nairobi, Kenya</p>
        </div>
      </div>
    `,
  });
}

async function sendOrderNotification(to, order) {
  const typeLabel = order.type === 'walkin' ? 'Walk-in Order' :
                    order.type === 'service' ? 'Service Request' : 'Room Service';
  return sendMail({
    to,
    subject: `New ${typeLabel} — ${order.roomNumber} | Azura Haven`,
    html: `
      <div style="font-family:'Georgia',serif;max-width:560px;margin:0 auto;background:#F5F1EB;border-radius:16px;overflow:hidden">
        <div style="background:#1B2A4A;padding:24px;text-align:center">
          <h1 style="color:#C9A96E;margin:0;font-size:22px">Azura Haven — ${typeLabel}</h1>
        </div>
        <div style="padding:28px">
          <p style="color:#6B7280;margin:0 0 16px">
            Location: <strong>${order.roomNumber}</strong> &nbsp;·&nbsp;
            Guest: <strong>${order.userName}</strong>
            ${order.paymentMethod ? ` &nbsp;·&nbsp; Payment: <strong>${order.paymentMethod.toUpperCase()}</strong>` : ''}
          </p>
          <div style="background:white;border-radius:12px;padding:16px;margin-bottom:16px">
            ${(order.items || []).map(item => `
              <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #EBE3D6">
                <span style="color:#1B2A4A">${item.name}${item.qty > 1 ? ' x' + item.qty : ''}</span>
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
          ${order.notes ? `<p style="color:#6B7280;font-style:italic;background:white;border-radius:12px;padding:14px;margin:0 0 12px">${order.notes}</p>` : ''}
          <p style="color:#6B7280;font-size:12px;margin:0">Ref: ${order.id || 'N/A'} · ${new Date(order.createdAt).toLocaleString('en-KE')}</p>
        </div>
        <div style="background:#1B2A4A;padding:14px;text-align:center">
          <p style="color:#C9A96E;margin:0;font-size:12px">Azura Haven · Nairobi, Kenya</p>
        </div>
      </div>
    `,
  });
}

async function sendOrderReceiptEmail(to, order) {
  if (!to || to === 'walkin@azurahaven.com') return { skipped: true };
  const isService = order.type === 'service';
  const eta = isService ? '15-30 minutes' : order.type === 'walkin' ? '20-35 minutes' : '30-45 minutes';

  return sendMail({
    to,
    subject: isService ? 'Service Request Received — Azura Haven' : 'Order Confirmed — Azura Haven',
    html: `
      <div style="font-family:'Georgia',serif;max-width:560px;margin:0 auto;background:#F5F1EB;border-radius:16px;overflow:hidden">
        <div style="background:#1B2A4A;padding:32px;text-align:center">
          <h1 style="color:#C9A96E;margin:0;font-size:24px">Azura Haven</h1>
        </div>
        <div style="padding:32px">
          <div style="text-align:center;margin-bottom:24px">
            <div style="font-size:48px;margin-bottom:12px">${isService ? '🛎️' : '🍽️'}</div>
            <h2 style="color:#1B2A4A;margin:0 0 8px">${isService ? 'Request Received!' : 'Order Confirmed!'}</h2>
            <p style="color:#6B7280;margin:0">
              ${isService
                ? `Your <strong>${order.items?.[0]?.name}</strong> request is logged. Our team will attend to you shortly.`
                : `Your order is being prepared. Estimated time: <strong>${eta}</strong>.`
              }
            </p>
          </div>
          ${!isService ? `
          <div style="background:white;border-radius:12px;padding:20px;margin-bottom:16px">
            ${(order.items || []).map(item => `
              <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #EBE3D6">
                <span style="color:#1B2A4A">${item.name}${item.qty > 1 ? ' x' + item.qty : ''}</span>
                ${item.price > 0 ? `<span style="color:#C9A96E;font-weight:600">KES ${(item.price * item.qty).toLocaleString()}</span>` : ''}
              </div>
            `).join('')}
            ${order.total > 0 ? `
              <div style="display:flex;justify-content:space-between;padding:12px 0 0">
                <span style="color:#6B7280;font-weight:600">Total</span>
                <span style="color:#C9A96E;font-weight:700;font-size:20px">KES ${order.total?.toLocaleString()}</span>
              </div>
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
              <span style="color:#1B2A4A;font-weight:600">${(order.id || '').slice(0, 8).toUpperCase()}</span>
            </div>
          </div>
          <p style="color:#6B7280;font-size:13px;margin:0;text-align:center">Questions? Call: <strong>+254 769 113 931</strong></p>
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
  const map = {
    'preparing':  { emoji: '👨‍🍳', text: 'Your order is being prepared', detail: `We are working on your order for <strong>${order.roomNumber}</strong>. It will be with you soon!` },
    'on-the-way': { emoji: '🚶', text: 'Your order is on the way!', detail: `Your order is heading to <strong>${order.roomNumber}</strong> right now. Please be ready!` },
    'delivered':  { emoji: '✅', text: 'Order Delivered!', detail: `Your order has been delivered to <strong>${order.roomNumber}</strong>. Enjoy! 😊` },
    'completed':  { emoji: '🎉', text: 'All Done!', detail: 'Your request has been completed. We hope everything was perfect!' },
    'cancelled':  { emoji: '❌', text: 'Order Cancelled', detail: 'Your order has been cancelled. Contact us at <strong>+254 769 113 931</strong> if this was a mistake.' },
  };
  const sm = map[status];
  if (!sm) return { skipped: true };

  return sendMail({
    to,
    subject: `${sm.emoji} ${sm.text} — Azura Haven`,
    html: `
      <div style="font-family:'Georgia',serif;max-width:560px;margin:0 auto;background:#F5F1EB;border-radius:16px;overflow:hidden">
        <div style="background:#1B2A4A;padding:24px;text-align:center">
          <h1 style="color:#C9A96E;margin:0;font-size:22px">Azura Haven</h1>
        </div>
        <div style="padding:32px;text-align:center">
          <div style="font-size:48px;margin-bottom:16px">${sm.emoji}</div>
          <h2 style="color:#1B2A4A;margin:0 0 12px">${sm.text}</h2>
          <p style="color:#6B7280;margin:0 0 16px">${sm.detail}</p>
          <p style="color:#6B7280;font-size:13px">Ref: <strong>${(order.id || '').slice(0,8).toUpperCase()}</strong></p>
        </div>
        <div style="background:#1B2A4A;padding:14px;text-align:center">
          <p style="color:#C9A96E;margin:0;font-size:12px">Azura Haven · +254 769 113 931 · reservations@azurahaven.com</p>
        </div>
      </div>
    `,
  });
}

module.exports = {
  sendBookingConfirmation,
  sendStatusUpdate,
  sendWelcomeEmail,
  sendOrderNotification,
  sendOrderReceiptEmail,
  sendOrderStatusEmail,
};
