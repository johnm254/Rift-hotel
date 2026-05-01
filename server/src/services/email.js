const nodemailer = require('nodemailer');

// Lazy transporter — only creates if SMTP is configured
let _transporter = null;

function getTransporter() {
  if (_transporter) return _transporter;
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('⚠️  SMTP not configured — emails will be skipped. Set SMTP_USER and SMTP_PASS in .env');
    return null;
  }
  _transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  return _transporter;
}

const FROM = () => `"Azura Haven" <${process.env.SMTP_USER || 'reservations@azurahaven.com'}>`;

async function sendMail(options) {
  const transporter = getTransporter();
  if (!transporter) return { skipped: true };
  try {
    return await transporter.sendMail({ from: FROM(), ...options });
  } catch (err) {
    console.warn('⚠️  Email send failed:', err.message);
    return { error: err.message };
  }
}

async function sendBookingConfirmation(to, booking) {
  return sendMail({
    to,
    subject: `Booking Confirmed — ${booking.roomName}`,
    html: `
      <div style="font-family:'Georgia',serif;max-width:560px;margin:0 auto;background:#F5F1EB;border-radius:16px;overflow:hidden">
        <div style="background:#1B2A4A;padding:32px;text-align:center">
          <h1 style="color:#C9A96E;margin:0;font-size:24px">🏨 Azura Haven</h1>
        </div>
        <div style="padding:32px">
          <h2 style="color:#1B2A4A;margin:0 0 8px">Booking Confirmed! 🎉</h2>
          <p style="color:#6B7280;margin:0 0 24px">Your stay has been booked successfully.</p>
          <div style="background:white;border-radius:12px;padding:20px;margin-bottom:16px">
            <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #EBE3D6">
              <span style="color:#6B7280">Room</span>
              <span style="color:#1B2A4A;font-weight:600">${booking.roomName}</span>
            </div>
            <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #EBE3D6">
              <span style="color:#6B7280">Check-in</span>
              <span style="color:#1B2A4A;font-weight:600">${booking.checkIn}</span>
            </div>
            <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #EBE3D6">
              <span style="color:#6B7280">Check-out</span>
              <span style="color:#1B2A4A;font-weight:600">${booking.checkOut}</span>
            </div>
            <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #EBE3D6">
              <span style="color:#6B7280">Guests</span>
              <span style="color:#1B2A4A;font-weight:600">${booking.guests}</span>
            </div>
            <div style="display:flex;justify-content:space-between;padding:8px 0">
              <span style="color:#6B7280">Total</span>
              <span style="color:#C9A96E;font-weight:700;font-size:18px">KES ${booking.totalPrice?.toLocaleString()}</span>
            </div>
          </div>
          ${booking.specialRequests ? `<p style="color:#6B7280;font-style:italic;background:white;border-radius:12px;padding:16px;margin:0 0 16px">💬 ${booking.specialRequests}</p>` : ''}
          <p style="color:#6B7280;font-size:13px;margin:0">Need to modify your booking? Visit your account at Azura Haven.</p>
        </div>
        <div style="background:#1B2A4A;padding:16px;text-align:center">
          <p style="color:#C9A96E;margin:0;font-size:12px">Nairobi, Kenya · reservations@azurahaven.com</p>
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
          ${newStatus === 'approved' ? `<p style="color:#6B7280;margin:0">We look forward to hosting you! See you on ${booking.checkIn}.</p>` : `<p style="color:#6B7280;margin:0">Please browse other available rooms or contact us for assistance.</p>`}
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
          <a href="#" style="display:inline-block;background:#C9A96E;color:#1B2A4A;padding:12px 32px;border-radius:12px;text-decoration:none;font-weight:700;text-transform:uppercase;letter-spacing:2px;font-size:13px">Explore Rooms</a>
        </div>
        <div style="background:#1B2A4A;padding:16px;text-align:center">
          <p style="color:#C9A96E;margin:0;font-size:12px">Nairobi, Kenya · reservations@azurahaven.com</p>
        </div>
      </div>
    `,
  });
}

module.exports = { sendBookingConfirmation, sendStatusUpdate, sendWelcomeEmail };
