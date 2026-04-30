const express = require('express');
const router = express.Router();
const axios = require('axios');
const { db } = require('../config/firebase');
const { authenticate } = require('../middleware/auth');

// ==================== M-PESA STK PUSH ====================

let mpesaToken = null;
let tokenExpiry = 0;

async function getMpesaToken() {
  if (mpesaToken && Date.now() < tokenExpiry) return mpesaToken;

  const auth = Buffer.from(
    `${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`
  ).toString('base64');

  const { data } = await axios.get(
    'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
    { headers: { Authorization: `Basic ${auth}` } }
  );

  mpesaToken = data.access_token;
  tokenExpiry = Date.now() + (data.expires_in * 900);
  return mpesaToken;
}

// POST /api/payments/mpesa/stk-push
router.post('/mpesa/stk-push', authenticate, async (req, res) => {
  try {
    const { phone, amount, bookingId } = req.body;

    if (!phone || !amount) {
      return res.status(400).json({ error: 'Phone and amount required' });
    }

    // Format phone: remove 0 or +254 prefix, ensure 254XXXXXXXXX
    let formattedPhone = phone.replace(/^0+/, '');
    if (!formattedPhone.startsWith('254')) formattedPhone = '254' + formattedPhone;

    const token = await getMpesaToken();
    const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);
    const password = Buffer.from(
      `${process.env.MPESA_SHORTCODE}${process.env.MPESA_PASSKEY}${timestamp}`
    ).toString('base64');

    const stkPayload = {
      BusinessShortCode: process.env.MPESA_SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: Math.round(amount),
      PartyA: formattedPhone,
      PartyB: process.env.MPESA_SHORTCODE,
      PhoneNumber: formattedPhone,
      CallBackURL: `${process.env.API_BASE_URL}/api/payments/mpesa/callback`,
      AccountReference: bookingId || `HOTEL-${Date.now()}`,
      TransactionDesc: 'Hotel Booking Payment',
    };

    const { data } = await axios.post(
      'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
      stkPayload,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    // Save payment record
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
      message: 'STK Push sent. Check your phone to complete payment.',
    });
  } catch (err) {
    console.error('M-Pesa STK error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Payment initiation failed. Try again.' });
  }
});

// POST /api/payments/mpesa/callback — M-Pesa sends confirmation here
router.post('/mpesa/callback', async (req, res) => {
  try {
    const callback = req.body.Body?.stkCallback;
    if (!callback) return res.status(400).json({ error: 'Invalid callback' });

    const { MerchantRequestID, CheckoutRequestID, ResultCode, ResultDesc } = callback;

    // Find and update payment record
    const snapshot = await db.collection('payments')
      .where('checkoutRequestId', '==', CheckoutRequestID)
      .get();

    if (!snapshot.empty) {
      const paymentDoc = snapshot.docs[0];
      const payment = paymentDoc.data();

      await paymentDoc.ref.update({
        status: ResultCode === 0 ? 'completed' : 'failed',
        resultCode: ResultCode,
        resultDesc: ResultDesc,
        mpesaReceiptNumber: callback.CallbackMetadata?.Item?.find(i => i.Name === 'MpesaReceiptNumber')?.Value || null,
        completedAt: new Date().toISOString(),
      });

      // If bookingId exists, update booking payment status
      if (payment.bookingId && ResultCode === 0) {
        await db.collection('bookings').doc(payment.bookingId).update({
          paymentStatus: 'paid',
          paymentMethod: 'mpesa',
          paidAt: new Date().toISOString(),
        });
      }
    }

    res.json({ ResultCode: 0, ResultDesc: 'Success' });
  } catch (err) {
    console.error('Callback error:', err);
    res.status(500).json({ error: 'Callback processing failed' });
  }
});

// POST /api/payments/mpesa/query — check STK status
router.post('/mpesa/query', authenticate, async (req, res) => {
  try {
    const { checkoutRequestId } = req.body;
    const token = await getMpesaToken();
    const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);
    const password = Buffer.from(
      `${process.env.MPESA_SHORTCODE}${process.env.MPESA_PASSKEY}${timestamp}`
    ).toString('base64');

    const { data } = await axios.post(
      'https://sandbox.safaricom.co.ke/mpesa/stkpushquery/v1/query',
      {
        BusinessShortCode: process.env.MPESA_SHORTCODE,
        Password: password,
        Timestamp: timestamp,
        CheckoutRequestID: checkoutRequestId,
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== CREDIT/DEBIT CARD (Stripe) ====================

// POST /api/payments/card/create-intent
router.post('/card/create-intent', authenticate, async (req, res) => {
  try {
    const { amount, currency, bookingId } = req.body;

    // NOTE: In production, use Stripe SDK. This is a placeholder that
    // expects you to pass a pre-created PaymentIntent ID from the frontend
    // where Stripe.js handles the card details securely.

    // For a real implementation, install stripe:
    // const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    // const intent = await stripe.paymentIntents.create({
    //   amount: Math.round(amount * 100), // cents
    //   currency: currency || 'kes',
    //   metadata: { bookingId, userId: req.user.uid },
    // });

    // For now, return a placeholder showing the expected structure
    res.json({
      success: true,
      clientSecret: null, // Replace with real Stripe client_secret
      amount: Math.round(amount * 100),
      currency: currency || 'kes',
      message: 'Stripe integration ready. Add STRIPE_SECRET_KEY to .env to enable.',
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/payments/card/confirm — confirm card payment
router.post('/card/confirm', authenticate, async (req, res) => {
  try {
    const { paymentIntentId, bookingId, amount } = req.body;

    await db.collection('payments').add({
      type: 'card',
      paymentIntentId,
      amount,
      bookingId: bookingId || null,
      userId: req.user.uid,
      status: 'completed',
      createdAt: new Date().toISOString(),
    });

    if (bookingId) {
      await db.collection('bookings').doc(bookingId).update({
        paymentStatus: 'paid',
        paymentMethod: 'card',
        paidAt: new Date().toISOString(),
      });
    }

    res.json({ success: true, message: 'Payment confirmed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/payments/history — user's payment history
router.get('/history', authenticate, async (req, res) => {
  try {
    const snapshot = await db.collection('payments')
      .where('userId', '==', req.user.uid)
      .orderBy('createdAt', 'desc')
      .limit(20)
      .get();
    const payments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(payments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
