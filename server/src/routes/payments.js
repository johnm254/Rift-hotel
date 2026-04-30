const express = require('express');
const router = express.Router();
const axios = require('axios');
const { db } = require('../config/firebase');
const { authenticate } = require('../middleware/auth');
const { mpesaSchema, validate } = require('../validators/schemas');

let mpesaToken = null, tokenExpiry = 0;

async function getMpesaToken() {
  if (mpesaToken && Date.now() < tokenExpiry) return mpesaToken;
  const auth = Buffer.from(`${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`).toString('base64');
  const { data } = await axios.get('https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials', { headers: { Authorization: `Basic ${auth}` } });
  mpesaToken = data.access_token; tokenExpiry = Date.now() + (data.expires_in * 900);
  return mpesaToken;
}

// POST /api/payments/mpesa/stk-push
router.post('/mpesa/stk-push', authenticate, validate(mpesaSchema), async (req, res) => {
  try {
    const { phone, amount, bookingId } = req.validated;
    let formattedPhone = phone.replace(/^0+/, '');
    if (!formattedPhone.startsWith('254')) formattedPhone = '254' + formattedPhone;

    const token = await getMpesaToken();
    const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);
    const password = Buffer.from(`${process.env.MPESA_SHORTCODE}${process.env.MPESA_PASSKEY}${timestamp}`).toString('base64');

    const { data } = await axios.post('https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest', {
      BusinessShortCode: process.env.MPESA_SHORTCODE, Password: password, Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline', Amount: Math.round(amount),
      PartyA: formattedPhone, PartyB: process.env.MPESA_SHORTCODE, PhoneNumber: formattedPhone,
      CallBackURL: `${process.env.API_BASE_URL}/api/payments/mpesa/callback`,
      AccountReference: bookingId || `HOTEL-${Date.now()}`, TransactionDesc: 'Hotel Booking Payment',
    }, { headers: { Authorization: `Bearer ${token}` } });

    await db.collection('payments').add({
      type: 'mpesa', merchantRequestId: data.MerchantRequestID, checkoutRequestId: data.CheckoutRequestID,
      phone: formattedPhone, amount: Math.round(amount), bookingId: bookingId || null,
      userId: req.user.uid, status: 'pending', createdAt: new Date().toISOString(),
    });

    res.json({ success: true, merchantRequestId: data.MerchantRequestID, checkoutRequestId: data.CheckoutRequestID, message: 'STK Push sent. Check your phone.' });
  } catch (err) {
    console.error('M-Pesa error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Payment initiation failed.' });
  }
});

// POST /api/payments/mpesa/callback
router.post('/mpesa/callback', async (req, res) => {
  try {
    const callback = req.body.Body?.stkCallback;
    if (!callback) return res.status(400).json({ error: 'Invalid callback' });
    const { MerchantRequestID, CheckoutRequestID, ResultCode, ResultDesc } = callback;
    const snapshot = await db.collection('payments').where('checkoutRequestId', '==', CheckoutRequestID).get();
    if (!snapshot.empty) {
      const paymentDoc = snapshot.docs[0];
      await paymentDoc.ref.update({
        status: ResultCode === 0 ? 'completed' : 'failed', resultCode: ResultCode, resultDesc: ResultDesc,
        mpesaReceiptNumber: callback.CallbackMetadata?.Item?.find(i => i.Name === 'MpesaReceiptNumber')?.Value || null,
        completedAt: new Date().toISOString(),
      });
      if (paymentDoc.data().bookingId && ResultCode === 0) {
        await db.collection('bookings').doc(paymentDoc.data().bookingId).update({ paymentStatus: 'paid', paymentMethod: 'mpesa', paidAt: new Date().toISOString() });
      }
    }
    res.json({ ResultCode: 0, ResultDesc: 'Success' });
  } catch (err) {
    res.status(500).json({ error: 'Callback error' });
  }
});

// POST /api/payments/card/create-intent
router.post('/card/create-intent', authenticate, async (req, res) => {
  try { res.json({ success: true, amount: Math.round(req.body.amount * 100), currency: req.body.currency || 'kes', message: 'Stripe: add STRIPE_SECRET_KEY to enable.' }); } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/payments/card/confirm
router.post('/card/confirm', authenticate, async (req, res) => {
  try {
    const { paymentIntentId, bookingId, amount } = req.body;
    await db.collection('payments').add({ type: 'card', paymentIntentId, amount, bookingId: bookingId || null, userId: req.user.uid, status: 'completed', createdAt: new Date().toISOString() });
    if (bookingId) await db.collection('bookings').doc(bookingId).update({ paymentStatus: 'paid', paymentMethod: 'card', paidAt: new Date().toISOString() });
    res.json({ success: true, message: 'Payment confirmed' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/payments/history
router.get('/history', authenticate, async (req, res) => {
  try {
    const snapshot = await db.collection('payments').where('userId', '==', req.user.uid).orderBy('createdAt', 'desc').limit(20).get();
    res.json(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
