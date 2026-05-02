const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Debug: log which critical env vars are present on startup
console.log('🔍 Env check:', {
  firebase: !!process.env.FIREBASE_PROJECT_ID,
  mpesa: !!process.env.MPESA_CONSUMER_KEY,
  port: process.env.PORT || 5000,
  node_env: process.env.NODE_ENV || 'development',
});

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting — more generous for payment testing
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 50, message: { error: 'Too many requests, try again later.' } });
const paymentLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 50, message: { error: 'Too many payment attempts. Please wait 15 minutes.' } });
const generalLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200 });

app.use('/api/auth', authLimiter);
app.use('/api/payments/mpesa', paymentLimiter);
app.use('/api', generalLimiter);

// Routes
app.use('/api/rooms', require('./routes/rooms'));
app.use('/api/meals', require('./routes/meals'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/invoices', require('./routes/invoices'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/housekeeping', require('./routes/housekeeping'));
app.use('/api/transfers', require('./routes/transfers'));
app.use('/api/packages', require('./routes/packages'));
app.use('/api/surveys', require('./routes/surveys'));
app.use('/api/pricing', require('./routes/pricing'));
app.use('/api/properties', require('./routes/properties'));

// Health check
app.get('/api/health', (req, res) => {
  const checks = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    firebase: !!process.env.FIREBASE_PROJECT_ID,
    smtp: !!process.env.SMTP_USER,
    mpesa: !!process.env.MPESA_CONSUMER_KEY,
    sms: !!process.env.AT_API_KEY,
  };
  res.json(checks);
});

app.listen(PORT, () => {
  console.log(`🏨 Azura Haven API running on port ${PORT}`);
});
