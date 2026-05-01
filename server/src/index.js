const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, message: { error: 'Too many requests, try again later.' } });
const paymentLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, message: { error: 'Too many payment attempts.' } });
const generalLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });

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

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🏨 Azura Haven API running on port ${PORT}`);
});
