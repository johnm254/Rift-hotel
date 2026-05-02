const express = require('express');
const router = express.Router();
const axios = require('axios');
const { db } = require('../config/firebase');
const { authenticate } = require('../middleware/auth');
const { mpesaSchema, validate } = require('../validators/schemas');
const { sendPaymentReceiptWhatsApp } = require('../services/whatsapp');
const { sendBookingConfirmation } = require('../services/email');

// ── Stripe setup (lazy — only if key is configured) ──────────────────────────
function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) return null;
  return require('stripe')(process.env.STRIPE_SECRET_KEY);
}

// ── M-Pesa token cache ────────────────────────────────────────────────────────
let mpesaToken = null, tokenExpiry = 0;

async function getMpesaToken() {
  if (mpesaToken && Date.now() < tokenExpiry) return mpesaToken;
  const auth = Buffer.from(`${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`).toString('base64');
  const baseUrl = (process.env.MPESA_ENV || process.env.MPESA_ENVIRONMENT) === 'production'
    ? 'https://api.safaricom.co.ke'
    : 'https://sandbox.safaricom.co.ke';
  const { data } = await axios.get(`${baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: { Authorization: `Basic ${auth}` },
  });
  mpesaToken = data.access_token;
  tokenExpiry = Date.now() + (data.expires_in * 900);
  return mpesaToken;
}

// ── POST /api/payments/mpesa/stk-push ────────────────────────────────────────
router.post('/mpesa/stk-push', authenticate, validate(mpesaSchema), async (req, res) => {
  try {
    const { phone, amount, bookingId } = req.validated;
    let formattedPhone = phone.replace(/\s/g, '').replace(/^0+/, '');
    if (!formattedPhone.startsWith('254')) formattedPhone = '254' + formattedPhone;

    const token = await getMpesaToken();
    const baseUrl = (process.env.MPESA_ENV || process.env.MPESA_ENVIRONMENT) === 'production'
      ? 'https://api.safaricom.co.ke'
      : 'https://sandbox.safaricom.co.ke';
    const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);
    const password = Buffer.from(`${process.env.MPESA_SHORTCODE}${process.env.MPESA_PASSKEY}${timestamp}`).toString('base64');

    const { data } = await axios.post(`${baseUrl}/mpesa/stkpush/v1/processrequest`, {
      BusinessShortCode: process.env.MPESA_SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: Math.round(amount),
      PartyA: formattedPhone,
      PartyB: process.env.MPESA_SHORTCODE,
      PhoneNumber: formattedPhone,
      CallBackURL: `${process.env.API_BASE_URL || 'https://your-api.com'}/api/payments/mpesa/callback`,
      AccountReference: bookingId || `AZURA-${Date.now()}`,
      TransactionDesc: 'Azura Haven Hotel Booking',
    }, { headers: { Authorization: `Bearer ${token}` } });

    await db.collection('payments').add({
      type: 'mpesa',
      merchantRequestId: data.MerchantRequestID,
      checkoutRequestId: data.CheckoutRequestID,
      phone: formattedPhone,
      amount: Math.round(amount),
      bookingId: bookingId || null,
      userId: req.user.uid,
      status: 'pending',
      createdAt: new Date().toISOString(),
    });

    res.json({
      success: true,
      merchantRequestId: data.MerchantRequestID,
      checkoutRequestId: data.CheckoutRequestID,
      message: 'STK Push sent. Check your phone and enter your M-Pesa PIN.',
    });
  } catch (err) {
    console.error('M-Pesa STK error:', err.response?.data || err.message);
    res.status(500).json({ error: 'M-Pesa payment initiation failed. Please try again.' });
  }
});

// ── POST /api/payments/mpesa/callback ────────────────────────────────────────
router.post('/mpesa/callback', async (req, res) => {
  try {
    const callback = req.body.Body?.stkCallback;
    if (!callback) return res.status(400).json({ error: 'Invalid callback' });

    const { MerchantRequestID, CheckoutRequestID, ResultCode, ResultDesc } = callback;
    const snapshot = await db.collection('payments').where('checkoutRequestId', '==', CheckoutRequestID).get();

    if (!snapshot.empty) {
      const paymentDoc = snapshot.docs[0];
      const paymentData = paymentDoc.data();
      const success = ResultCode === 0;

      await paymentDoc.ref.update({
        status: success ? 'completed' : 'failed',
        resultCode: ResultCode,
        resultDesc: ResultDesc,
        mpesaReceiptNumber: callback.CallbackMetadata?.Item?.find(i => i.Name === 'MpesaReceiptNumber')?.Value || null,
        completedAt: new Date().toISOString(),
      });

      if (success && paymentData.bookingId) {
        await db.collection('bookings').doc(paymentData.bookingId).update({
          paymentStatus: 'paid',
          paymentMethod: 'mpesa',
          paidAt: new Date().toISOString(),
        });

        // Send WhatsApp receipt
        const userDoc = await db.collection('users').doc(paymentData.userId).get().catch(() => null);
        const phone = userDoc?.data()?.phone;
        if (phone) {
          sendPaymentReceiptWhatsApp(phone, paymentData.amount, 'M-Pesa', paymentData.bookingId).catch(() => {});
        }
      }
    }

    res.json({ ResultCode: 0, ResultDesc: 'Success' });
  } catch (err) {
    console.error('M-Pesa callback error:', err.message);
    res.status(500).json({ error: 'Callback processing error' });
  }
});

// ── POST /api/payments/mpesa/query — check STK push status ───────────────────
router.post('/mpesa/query', authenticate, async (req, res) => {
  try {
    const { checkoutRequestId } = req.body;
    const token = await getMpesaToken();
    const baseUrl = (process.env.MPESA_ENV || process.env.MPESA_ENVIRONMENT) === 'production'
      ? 'https://api.safaricom.co.ke'
      : 'https://sandbox.safaricom.co.ke';
    const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);
    const password = Buffer.from(`${process.env.MPESA_SHORTCODE}${process.env.MPESA_PASSKEY}${timestamp}`).toString('base64');

    const { data } = await axios.post(`${baseUrl}/mpesa/stkpushquery/v1/query`, {
      BusinessShortCode: process.env.MPESA_SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      CheckoutRequestID: checkoutRequestId,
    }, { headers: { Authorization: `Bearer ${token}` } });

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.response?.data?.errorMessage || err.message });
  }
});

// ── POST /api/payments/stripe/create-intent ───────────────────────────────────
router.post('/stripe/create-intent', authenticate, async (req, res) => {
  try {
    const stripe = getStripe();
    if (!stripe) {
      return res.status(503).json({ error: 'Stripe not configured. Add STRIPE_SECRET_KEY to .env' });
    }

    const { amount, currency = 'kes', bookingId, description } = req.body;
    if (!amount) return res.status(400).json({ error: 'Amount required' });

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Stripe uses smallest currency unit
      currency: currency.toLowerCase(),
      description: description || 'Azura Haven Hotel Booking',
      metadata: {
        bookingId: bookingId || '',
        userId: req.user.uid,
        hotel: 'Azura Haven',
      },
      automatic_payment_methods: { enabled: true },
    });

    // Save pending payment record
    await db.collection('payments').add({
      type: 'stripe',
      paymentIntentId: paymentIntent.id,
      amount,
      currency,
      bookingId: bookingId || null,
      userId: req.user.uid,
      status: 'pending',
      createdAt: new Date().toISOString(),
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (err) {
    console.error('Stripe error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/payments/stripe/confirm ────────────────────────────────────────
router.post('/stripe/confirm', authenticate, async (req, res) => {
  try {
    const stripe = getStripe();
    const { paymentIntentId, bookingId } = req.body;

    let status = 'completed';
    if (stripe) {
      const intent = await stripe.paymentIntents.retrieve(paymentIntentId);
      status = intent.status === 'succeeded' ? 'completed' : 'failed';
    }

    // Update payment record
    const snap = await db.collection('payments').where('paymentIntentId', '==', paymentIntentId).get();
    if (!snap.empty) {
      await snap.docs[0].ref.update({ status, completedAt: new Date().toISOString() });
    }

    if (status === 'completed' && bookingId) {
      await db.collection('bookings').doc(bookingId).update({
        paymentStatus: 'paid',
        paymentMethod: 'card',
        paidAt: new Date().toISOString(),
      });

      // Send WhatsApp receipt
      const userDoc = await db.collection('users').doc(req.user.uid).get().catch(() => null);
      const phone = userDoc?.data()?.phone;
      const amount = snap.docs[0]?.data()?.amount;
      if (phone) sendPaymentReceiptWhatsApp(phone, amount, 'Card', bookingId).catch(() => {});
    }

    res.json({ success: status === 'completed', status });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/payments/stripe/webhook ────────────────────────────────────────
router.post('/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const stripe = getStripe();
  if (!stripe) return res.json({ received: true });

  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).json({ error: `Webhook error: ${err.message}` });
  }

  if (event.type === 'payment_intent.succeeded') {
    const intent = event.data.object;
    const { bookingId, userId } = intent.metadata;
    if (bookingId) {
      await db.collection('bookings').doc(bookingId).update({
        paymentStatus: 'paid', paymentMethod: 'card', paidAt: new Date().toISOString(),
      }).catch(() => {});
    }
  }

  res.json({ received: true });
});

// ── POST /api/payments/pesapal/initiate — Pesapal bank gateway ───────────────
router.post('/pesapal/initiate', authenticate, async (req, res) => {
  try {
    if (!process.env.PESAPAL_CONSUMER_KEY || !process.env.PESAPAL_CONSUMER_SECRET) {
      return res.status(503).json({ error: 'Pesapal not configured. Add PESAPAL_CONSUMER_KEY and PESAPAL_CONSUMER_SECRET to .env' });
    }

    const { amount, currency = 'KES', bookingId, description, email, phone, firstName, lastName } = req.body;

    // Get Pesapal auth token
    const authRes = await axios.post('https://pay.pesapal.com/v3/api/Auth/RequestToken', {
      consumer_key: process.env.PESAPAL_CONSUMER_KEY,
      consumer_secret: process.env.PESAPAL_CONSUMER_SECRET,
    }, { headers: { Accept: 'application/json', 'Content-Type': 'application/json' } });

    const pesapalToken = authRes.data.token;

    // Register IPN (Instant Payment Notification)
    const ipnRes = await axios.post('https://pay.pesapal.com/v3/api/URLSetup/RegisterIPN', {
      url: `${process.env.API_BASE_URL || 'https://your-api.com'}/api/payments/pesapal/ipn`,
      ipn_notification_type: 'POST',
    }, { headers: { Authorization: `Bearer ${pesapalToken}`, Accept: 'application/json', 'Content-Type': 'application/json' } });

    const ipnId = ipnRes.data.ipn_id;

    // Submit order
    const orderRes = await axios.post('https://pay.pesapal.com/v3/api/Transactions/SubmitOrderRequest', {
      id: bookingId || `AZURA-${Date.now()}`,
      currency,
      amount,
      description: description || 'Azura Haven Hotel Booking',
      callback_url: `${process.env.CLIENT_URL || 'http://localhost:3000'}/booking/success`,
      notification_id: ipnId,
      billing_address: {
        email_address: email || req.user.email,
        phone_number: phone || '',
        first_name: firstName || req.user.name?.split(' ')[0] || 'Guest',
        last_name: lastName || req.user.name?.split(' ').slice(1).join(' ') || '',
      },
    }, { headers: { Authorization: `Bearer ${pesapalToken}`, Accept: 'application/json', 'Content-Type': 'application/json' } });

    // Save payment record
    await db.collection('payments').add({
      type: 'pesapal',
      orderTrackingId: orderRes.data.order_tracking_id,
      merchantReference: bookingId || `AZURA-${Date.now()}`,
      amount, currency,
      bookingId: bookingId || null,
      userId: req.user.uid,
      status: 'pending',
      createdAt: new Date().toISOString(),
    });

    res.json({
      redirectUrl: orderRes.data.redirect_url,
      orderTrackingId: orderRes.data.order_tracking_id,
    });
  } catch (err) {
    console.error('Pesapal error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Pesapal payment initiation failed.' });
  }
});

// ── POST /api/payments/pesapal/ipn — Pesapal callback ────────────────────────
router.post('/pesapal/ipn', async (req, res) => {
  try {
    const { orderTrackingId, orderMerchantReference, orderNotificationType } = req.body;

    if (orderNotificationType === 'PAYMENT') {
      const snap = await db.collection('payments').where('orderTrackingId', '==', orderTrackingId).get();
      if (!snap.empty) {
        const paymentDoc = snap.docs[0];
        await paymentDoc.ref.update({ status: 'completed', completedAt: new Date().toISOString() });

        const bookingId = paymentDoc.data().bookingId;
        if (bookingId) {
          await db.collection('bookings').doc(bookingId).update({
            paymentStatus: 'paid', paymentMethod: 'pesapal', paidAt: new Date().toISOString(),
          });
        }
      }
    }

    res.json({ orderNotificationType, orderTrackingId, orderMerchantReference });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/payments/history ─────────────────────────────────────────────────
router.get('/history', authenticate, async (req, res) => {
  try {
    const snapshot = await db.collection('payments')
      .where('userId', '==', req.user.uid)
      .orderBy('createdAt', 'desc')
      .limit(20)
      .get();
    res.json(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

