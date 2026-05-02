import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { QRCodeSVG } from 'qrcode.react';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import Loading from '../components/Loading';
import { mockRooms } from '../lib/mockData';

export default function Booking() {
  const { roomId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(1);
  const [specialRequests, setSpecialRequests] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [mpesaPhone, setMpesaPhone] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [step, setStep] = useState(1); // 1=details, 2=payment, 3=confirmed
  const [error, setError] = useState('');
  const [mpesaWaiting, setMpesaWaiting] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [promoDiscount, setPromoDiscount] = useState(null);
  const [promoLoading, setPromoLoading] = useState(false);

  const isMock = roomId?.startsWith('room-');

  const { data: room, isLoading } = useQuery({
    queryKey: ['room', roomId],
    queryFn: () => api.get(`/rooms/${roomId}`).then(r => r.data)
      .catch(() => mockRooms.find(r => r.id === roomId) || null),
  });

  const nights = checkIn && checkOut
    ? Math.max(0, Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24)))
    : 0;
  const basePrice = room ? nights * room.price : 0;

  // Dynamic pricing
  const [pricingData, setPricingData] = useState(null);
  useEffect(() => {
    if (!checkIn || !checkOut || !room || nights <= 0) { setPricingData(null); return; }
    api.post('/pricing/calculate', { roomId, checkIn, checkOut, basePrice: room.price })
      .then(r => setPricingData(r.data))
      .catch(() => setPricingData(null));
  }, [checkIn, checkOut, room, nights]);

  const adjustedTotal = pricingData ? pricingData.totalPrice : basePrice;
  const discountAmount = promoDiscount
    ? promoDiscount.type === 'percent'
      ? Math.round(adjustedTotal * promoDiscount.discount / 100)
      : promoDiscount.discount
    : 0;
  const totalPrice = Math.max(0, adjustedTotal - discountAmount);

  const applyPromo = async () => {
    if (!promoCode.trim()) return;
    setPromoLoading(true);
    try {
      const res = await api.post('/bookings/validate-promo', { code: promoCode });
      setPromoDiscount(res.data);
      setError('');
    } catch (e) {
      setPromoDiscount(null);
      setError(e.response?.data?.error || 'Invalid promo code');
    } finally {
      setPromoLoading(false);
    }
  };

  const createBooking = useMutation({
    mutationFn: (data) => {
      if (isMock) return Promise.resolve({ data: { id: 'mock-' + Date.now(), ...data } });
      return api.post('/bookings', data);
    },
    onSuccess: () => setStep(3),
    onError: (err) => setError(err.response?.data?.error || 'Booking failed. Please try again.'),
  });

  const handleStep1 = () => {
    if (!checkIn || !checkOut) return setError('Please select check-in and check-out dates.');
    if (nights <= 0) return setError('Check-out must be after check-in.');
    setError('');
    setStep(2);
  };

  const handlePayment = async () => {
    setError('');

    if (paymentMethod === 'mpesa') {
      if (!mpesaPhone.trim()) return setError('Please enter your M-Pesa phone number.');
      const phone = mpesaPhone.replace(/\s/g, '');
      if (!/^(07|01|\+2547|\+2541)\d{8}$/.test(phone)) return setError('Enter a valid Kenyan phone number (e.g. 0712 345 678).');

      setMpesaWaiting(true);
      try {
        // 1. Send STK push
        let checkoutRequestId = null;
        if (!isMock) {
          const stkRes = await api.post('/payments/mpesa/stk-push', { phone, amount: totalPrice });
          checkoutRequestId = stkRes.data.checkoutRequestId;
        }

        // 2. Poll for payment status (max 60 seconds, every 5 seconds)
        let paid = isMock; // mock rooms skip polling
        if (!isMock && checkoutRequestId) {
          for (let i = 0; i < 12; i++) {
            await new Promise(res => setTimeout(res, 5000));
            try {
              const queryRes = await api.post('/payments/mpesa/query', { checkoutRequestId });
              const resultCode = queryRes.data?.ResultCode;
              if (resultCode === 0 || resultCode === '0') { paid = true; break; }
              if (resultCode !== undefined && resultCode !== null && resultCode !== '1032') {
                // 1032 = request cancelled by user, other codes = definitive failure
                setError('M-Pesa payment was not completed. Please try again.');
                setMpesaWaiting(false);
                return;
              }
            } catch {
              // Query failed — continue polling
            }
          }
        }

        if (!paid) {
          setError('Payment timed out. Please try again or choose another payment method.');
          setMpesaWaiting(false);
          return;
        }

        // 3. Create booking after confirmed payment
        const bookingData = { roomId, roomName: room.name, checkIn, checkOut, guests, totalPrice, specialRequests, paymentMethod: 'mpesa', paymentStatus: 'paid', mpesaPhone: phone };
        await createBooking.mutateAsync(bookingData);
      } catch (e) {
        setError(e.response?.data?.error || 'M-Pesa payment failed. Please try again.');
      } finally {
        setMpesaWaiting(false);
      }

    } else if (paymentMethod === 'card') {
      if (!cardName.trim()) return setError('Please enter the cardholder name.');
      if (cardNumber.replace(/\s/g, '').length < 16) return setError('Please enter a valid 16-digit card number.');
      if (!cardExpiry.match(/^\d{2}\/\d{2}$/)) return setError('Enter expiry as MM/YY.');
      if (cardCvv.length < 3) return setError('Enter a valid CVV.');

      try {
        // Try Stripe if configured, otherwise create booking directly
        let paymentConfirmed = false;
        if (!isMock) {
          try {
            const intentRes = await api.post('/payments/stripe/create-intent', {
              amount: totalPrice, currency: 'kes',
              description: `${room.name} — ${checkIn} to ${checkOut}`,
            });
            await api.post('/payments/stripe/confirm', { paymentIntentId: intentRes.data.paymentIntentId });
            paymentConfirmed = true;
          } catch (stripeErr) {
            // Stripe not configured — fall through to direct booking
            if (stripeErr.response?.status !== 503) throw stripeErr;
          }
        }
        const bookingData = {
          roomId, roomName: room.name, checkIn, checkOut, guests, totalPrice, specialRequests,
          paymentMethod: 'card',
          paymentStatus: paymentConfirmed ? 'paid' : 'pending',
        };
        createBooking.mutate(bookingData);
      } catch (e) {
        setError(e.response?.data?.error || 'Card payment failed. Please try again.');
      }

    } else if (paymentMethod === 'pesapal') {
      // Redirect to Pesapal hosted payment page
      try {
        const res = await api.post('/payments/pesapal/initiate', {
          amount: totalPrice, currency: 'KES',
          bookingId: `booking-${Date.now()}`,
          description: `${room.name} — ${checkIn} to ${checkOut}`,
        });
        if (res.data.redirectUrl) {
          window.location.href = res.data.redirectUrl;
        } else {
          setError('Pesapal redirect failed. Please try another payment method.');
        }
      } catch (e) {
        setError(e.response?.data?.error || 'Bank payment failed. Please try again.');
      }

    } else if (paymentMethod === 'pay-on-arrival') {
      const bookingData = { roomId, roomName: room.name, checkIn, checkOut, guests, totalPrice, specialRequests, paymentMethod: 'pay-on-arrival' };
      createBooking.mutate(bookingData);

    } else {
      setError('Please select a payment method.');
    }
  };

  const formatCard = (val) => val.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
  const formatExpiry = (val) => {
    const v = val.replace(/\D/g, '').slice(0, 4);
    return v.length >= 3 ? v.slice(0, 2) + '/' + v.slice(2) : v;
  };

  if (isLoading) return <Loading />;
  if (!room) return <div className="text-center py-20 text-muted">Room not found.</div>;

  const photo = room.photos?.[0]
    ? (typeof room.photos[0] === 'string' ? room.photos[0] : room.photos[0].thumb)
    : 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=600';

  return (
    <div className="min-h-[80vh] bg-cream py-6 sm:py-12">
      <div className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8">

        {/* Progress */}
        <div className="flex items-center justify-center mb-8">
          {[['Details', 1], ['Payment', 2], ['Confirmed', 3]].map(([label, s]) => (
            <div key={s} className="flex items-center">
              <div className="flex flex-col items-center">
                <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${step >= s ? 'bg-gold text-navy' : 'bg-white text-muted border-2 border-cream-dark'}`}>
                  {step > s ? '✓' : s}
                </div>
                <span className={`text-xs mt-1 font-medium ${step >= s ? 'text-navy' : 'text-muted'}`}>{label}</span>
              </div>
              {s < 3 && <div className={`w-8 sm:w-16 h-1 mx-1 sm:mx-2 mb-4 rounded transition-all ${step > s ? 'bg-gold' : 'bg-cream-dark'}`} />}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-8">
          {/* Room summary — horizontal strip on mobile, sidebar on desktop */}
          <div className="lg:col-span-1 lg:order-last">
            <div className="lg:sticky lg:top-24 bg-white rounded-2xl shadow-lg border border-cream-dark overflow-hidden flex lg:flex-col">
              <div className="w-28 sm:w-36 lg:w-full h-24 sm:h-28 lg:h-40 overflow-hidden flex-shrink-0">
                <img src={photo} alt={room.name} className="w-full h-full object-cover" />
              </div>
              <div className="p-3 sm:p-5 flex-1">
                <h3 className="font-serif font-bold text-navy text-sm sm:text-base leading-tight">{room.name}</h3>
                <div className="text-gold font-bold text-sm sm:text-base mt-0.5">KES {room.price?.toLocaleString()} <span className="text-muted text-xs font-normal">/ night</span></div>
                <div className="text-xs text-muted mt-1 hidden sm:block space-y-0.5">
                  <div>🛏 Up to {room.capacity} guests</div>
                  {room.amenities?.slice(0, 2).map(a => <div key={a}>✓ {a}</div>)}
                </div>
                {nights > 0 && (
                  <div className="bg-cream rounded-lg p-2 mt-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted">{nights} night{nights > 1 ? 's' : ''}</span>
                      <span className="font-bold text-navy">KES {totalPrice.toLocaleString()}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Main form */}
          <div className="lg:col-span-2">
            <div className="text-center mb-5">
              <h1 className="text-2xl sm:text-3xl font-serif font-bold text-navy">
                {step === 1 ? 'Book Your Stay' : step === 2 ? 'Payment' : 'Booking Confirmed!'}
              </h1>
              <p className="text-muted mt-1 text-sm">{room.name}</p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-5">
                {error}
              </div>
            )}

            {/* ── STEP 1 ── */}
            {step === 1 && (
              <div className="bg-white rounded-2xl shadow-xl border border-cream-dark p-4 sm:p-8 space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-navy mb-1.5">Check-in Date</label>
                    <input type="date" value={checkIn}
                      onChange={e => setCheckIn(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-3 rounded-xl bg-cream border border-cream-dark focus:border-gold focus:outline-none text-navy transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-navy mb-1.5">Check-out Date</label>
                    <input type="date" value={checkOut}
                      onChange={e => setCheckOut(e.target.value)}
                      min={checkIn || new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-3 rounded-xl bg-cream border border-cream-dark focus:border-gold focus:outline-none text-navy transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-navy mb-1.5">Guests</label>
                  <select value={guests} onChange={e => setGuests(Number(e.target.value))}
                    className="w-full px-4 py-3 rounded-xl bg-cream border border-cream-dark focus:border-gold focus:outline-none text-navy transition-colors">
                    {[...Array(room.capacity || 4)].map((_, i) => (
                      <option key={i + 1} value={i + 1}>{i + 1} guest{i > 0 ? 's' : ''}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-navy mb-1.5">Special Requests <span className="text-muted font-normal">(optional)</span></label>
                  <textarea value={specialRequests} onChange={e => setSpecialRequests(e.target.value)}
                    rows={3} placeholder="Early check-in, dietary requirements, room preferences..."
                    className="w-full px-4 py-3 rounded-xl bg-cream border border-cream-dark focus:border-gold focus:outline-none text-navy transition-colors resize-none"
                  />
                </div>

                {nights > 0 && (
                  <div className="bg-cream rounded-xl p-4 sm:p-5 space-y-2">
                    <div className="flex justify-between text-sm text-muted">
                      <span>KES {room.price?.toLocaleString()} × {nights} night{nights > 1 ? 's' : ''}</span>
                      <span>KES {basePrice.toLocaleString()}</span>
                    </div>
                    {pricingData?.appliedRules?.map(r => (
                      <div key={r.name} className="flex justify-between text-sm text-orange-600">
                        <span>📊 {r.name}</span><span>{r.effect}</span>
                      </div>
                    ))}
                    {promoDiscount && (
                      <div className="flex justify-between text-sm text-green-600">
                        <span className="truncate mr-2">🎁 {promoCode.toUpperCase()}</span>
                        <span>− KES {discountAmount.toLocaleString()}</span>
                      </div>
                    )}
                    <hr className="border-cream-dark" />
                    <div className="flex justify-between font-bold text-navy text-lg">
                      <span>Total</span>
                      <span className="text-gold">KES {totalPrice.toLocaleString()}</span>
                    </div>
                    {/* Promo code input */}
                    <div className="flex gap-2 pt-1">
                      <input type="text" value={promoCode} onChange={e => setPromoCode(e.target.value.toUpperCase())}
                        placeholder="Promo code"
                        className="flex-1 min-w-0 px-3 py-2 rounded-xl bg-white border border-cream-dark focus:border-gold focus:outline-none text-navy text-sm transition-colors" />
                      <button onClick={applyPromo} disabled={promoLoading || !promoCode.trim()}
                        className="bg-navy hover:bg-navy-light disabled:bg-navy/40 text-cream font-semibold px-4 py-2 rounded-xl text-sm transition-all whitespace-nowrap">
                        {promoLoading ? '...' : 'Apply'}
                      </button>
                    </div>
                  </div>
                )}

                <button onClick={handleStep1} disabled={!checkIn || !checkOut || nights <= 0}
                  className="w-full bg-navy hover:bg-navy-light disabled:bg-navy/30 text-white font-bold py-4 rounded-xl text-sm uppercase tracking-widest transition-all">
                  Continue to Payment →
                </button>
              </div>
            )}

            {/* ── STEP 2 ── */}
            {step === 2 && (
              <div className="bg-white rounded-2xl shadow-xl border border-cream-dark p-4 sm:p-8 space-y-5">
                {/* Amount */}
                <div className="bg-cream rounded-xl p-4 flex justify-between items-center">
                  <div>
                    <div className="text-xs text-muted uppercase tracking-widest">Total Due</div>
                    <div className="text-xl sm:text-2xl font-bold text-gold">KES {totalPrice.toLocaleString()}</div>
                  </div>
                  <div className="text-right text-xs sm:text-sm text-muted">
                    <div>{nights} night{nights > 1 ? 's' : ''}</div>
                    <div className="hidden sm:block">{checkIn} → {checkOut}</div>
                  </div>
                </div>

                {/* Payment method selector */}
                <div>
                  <label className="block text-sm font-medium text-navy mb-3">Select Payment Method</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { id: 'mpesa', icon: '📱', label: 'M-Pesa', sub: 'STK Push' },
                      { id: 'card', icon: '💳', label: 'Card', sub: 'Visa / Mastercard' },
                      { id: 'pesapal', icon: '🏦', label: 'Bank / Pesapal', sub: 'All cards & banks' },
                      { id: 'pay-on-arrival', icon: '🏨', label: 'Pay on Arrival', sub: 'At check-in' },
                    ].map(m => (
                      <button key={m.id} onClick={() => { setPaymentMethod(m.id); setError(''); }}
                        className={`p-3 sm:p-4 rounded-xl border-2 flex items-center gap-3 transition-all ${paymentMethod === m.id ? 'border-gold bg-gold/5 shadow-sm' : 'border-cream-dark hover:border-gold/40'}`}>
                        <div className="text-2xl flex-shrink-0">{m.icon}</div>
                        <div className="text-left">
                          <div className="text-sm font-bold text-navy">{m.label}</div>
                          <div className="text-xs text-muted">{m.sub}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* M-Pesa form */}
                {paymentMethod === 'mpesa' && (
                  <div className="space-y-3">
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-800">
                      <strong>How it works:</strong> Enter your Safaricom number below. You'll receive an STK push prompt on your phone — enter your M-Pesa PIN to complete payment.
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-navy mb-1.5">Safaricom Phone Number</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted text-sm">🇰🇪</span>
                        <input type="tel" value={mpesaPhone} onChange={e => setMpesaPhone(e.target.value)}
                          placeholder="0712 345 678"
                          className="w-full pl-10 pr-4 py-3 rounded-xl bg-cream border border-cream-dark focus:border-gold focus:outline-none text-navy transition-colors"
                        />
                      </div>
                      <p className="text-xs text-muted mt-1">Accepts 07XX, 01XX, or +254 format</p>
                    </div>
                    {mpesaWaiting && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                        <div className="flex items-center justify-center gap-2 mb-2">
                          <div className="w-4 h-4 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
                          <span className="text-yellow-800 font-semibold text-sm">STK Push Sent!</span>
                        </div>
                        <p className="text-yellow-700 text-xs text-center mb-2">Check your phone and enter your M-Pesa PIN.</p>
                        <div className="bg-yellow-100 rounded-lg p-2 text-center">
                          <p className="text-yellow-800 text-xs font-medium">⏳ Waiting for payment confirmation...</p>
                          <p className="text-yellow-600 text-xs mt-0.5">This may take up to 60 seconds</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Card form */}
                {paymentMethod === 'card' && (
                  <div className="space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
                      Your card details are encrypted and processed securely. We accept Visa and Mastercard.
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-navy mb-1.5">Cardholder Name</label>
                      <input type="text" value={cardName} onChange={e => setCardName(e.target.value)}
                        placeholder="John Doe"
                        className="w-full px-4 py-3 rounded-xl bg-cream border border-cream-dark focus:border-gold focus:outline-none text-navy transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-navy mb-1.5">Card Number</label>
                      <input type="text" value={cardNumber}
                        onChange={e => setCardNumber(formatCard(e.target.value))}
                        placeholder="1234 5678 9012 3456" maxLength={19}
                        className="w-full px-4 py-3 rounded-xl bg-cream border border-cream-dark focus:border-gold focus:outline-none text-navy transition-colors font-mono tracking-widest"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-navy mb-1.5">Expiry Date</label>
                        <input type="text" value={cardExpiry}
                          onChange={e => setCardExpiry(formatExpiry(e.target.value))}
                          placeholder="MM/YY" maxLength={5}
                          className="w-full px-4 py-3 rounded-xl bg-cream border border-cream-dark focus:border-gold focus:outline-none text-navy transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-navy mb-1.5">CVV</label>
                        <input type="password" value={cardCvv}
                          onChange={e => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                          placeholder="•••"
                          className="w-full px-4 py-3 rounded-xl bg-cream border border-cream-dark focus:border-gold focus:outline-none text-navy transition-colors"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Pesapal — bank/card gateway */}
                {paymentMethod === 'pesapal' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-2">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl flex-shrink-0">🏦</span>
                      <div>
                        <p className="font-semibold text-navy mb-1">Secure Bank Payment via Pesapal</p>
                        <p className="text-sm text-muted">Accepts Visa, Mastercard, M-Pesa, and bank transfers. You'll be redirected to Pesapal's secure payment page.</p>
                        <div className="flex gap-2 mt-2 flex-wrap">
                          {['Visa', 'Mastercard', 'M-Pesa', 'Bank Transfer'].map(p => (
                            <span key={p} className="text-xs bg-white border border-blue-200 text-blue-700 px-2 py-0.5 rounded-full font-medium">{p}</span>
                          ))}
                        </div>
                        <p className="text-xs text-muted mt-2">🔒 256-bit SSL encrypted · PCI DSS compliant</p>
                      </div>
                    </div>
                  </div>
                )}
                {paymentMethod === 'pay-on-arrival' && (
                  <div className="bg-cream rounded-xl p-5 space-y-2 text-sm text-muted">
                    <div className="flex items-start gap-3">
                      <span className="text-xl">ℹ️</span>
                      <div>
                        <p className="font-semibold text-navy mb-1">Reserve now, pay at check-in</p>
                        <p>Your room will be held for you. Full payment is due upon arrival. Accepted: Cash, M-Pesa, or Card.</p>
                        <p className="mt-2 text-xs text-red-500">Note: Cancellations must be made 24 hours before check-in to avoid a fee.</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button onClick={() => { setStep(1); setError(''); }}
                    className="flex-1 border-2 border-navy text-navy hover:bg-navy hover:text-cream font-semibold py-4 rounded-xl text-sm uppercase tracking-widest transition-all">
                    ← Back
                  </button>
                  <button onClick={handlePayment}
                    disabled={!paymentMethod || createBooking.isPending || mpesaWaiting}
                    className="flex-1 bg-gold hover:bg-gold-light disabled:bg-gold/50 text-navy font-bold py-4 rounded-xl text-sm uppercase tracking-widest transition-all shadow-lg shadow-gold/20">
                    {mpesaWaiting ? 'Waiting for M-Pesa...' : createBooking.isPending ? 'Processing...' : 'Confirm Booking'}
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP 3 ── */}
            {step === 3 && (
              <div className="bg-white rounded-2xl shadow-xl border border-cream-dark p-5 sm:p-8 text-center space-y-5">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto text-3xl sm:text-4xl">🎉</div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-serif font-bold text-navy">Booking Confirmed!</h2>
                  <p className="text-muted mt-2 text-sm">Confirmation sent to <strong>{user?.email}</strong></p>
                </div>
                <div className="bg-cream rounded-xl p-4 text-left space-y-3">
                  {[
                    ['Room', room.name],
                    ['Check-in', checkIn],
                    ['Check-out', checkOut],
                    ['Guests', `${guests} guest${guests > 1 ? 's' : ''}`],
                    ['Payment', paymentMethod === 'pay-on-arrival' ? 'Pay on Arrival' : paymentMethod === 'mpesa' ? 'M-Pesa' : 'Card'],
                  ].map(([label, val]) => (
                    <div key={label} className="flex justify-between text-sm">
                      <span className="text-muted">{label}</span>
                      <span className="font-medium text-navy text-right ml-4">{val}</span>
                    </div>
                  ))}
                  <hr className="border-cream-dark" />
                  <div className="flex justify-between font-bold text-navy">
                    <span>Total</span>
                    <span className="text-gold">KES {totalPrice.toLocaleString()}</span>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button onClick={() => navigate('/profile')}
                    className="bg-navy hover:bg-navy-light text-white font-semibold px-6 py-3 rounded-xl text-sm uppercase tracking-widest transition-all">
                    My Bookings
                  </button>
                  <button onClick={() => navigate('/rooms')}
                    className="border-2 border-navy text-navy hover:bg-navy hover:text-cream font-semibold px-6 py-3 rounded-xl text-sm uppercase tracking-widest transition-all">
                    Browse More
                  </button>
                </div>

                {/* QR Code — M-Pesa PayBill or Booking Reference */}
                <div className="border-t border-cream-dark pt-5">
                  <p className="text-xs text-muted uppercase tracking-widest mb-3 text-center">
                    {paymentMethod === 'pay-on-arrival' ? 'Pay with M-Pesa QR at Check-in' : 'Your Booking QR Code'}
                  </p>
                  <div className="flex justify-center">
                    <div className="bg-white p-3 rounded-2xl border-2 border-gold/20 shadow-sm inline-block">
                      <QRCodeSVG
                        value={
                          paymentMethod === 'pay-on-arrival'
                            // M-Pesa PayBill QR — scan to pay at front desk
                            ? `mpesa://pay?businessNumber=${174379}&accountNumber=AZURA-${checkIn?.replace(/-/g,'')}&amount=${totalPrice}`
                            // Booking reference QR for confirmed bookings
                            : JSON.stringify({
                                hotel: 'Azura Haven',
                                room: room.name,
                                checkIn,
                                checkOut,
                                guests,
                                total: `KES ${totalPrice.toLocaleString()}`,
                                guest: user?.name,
                                email: user?.email,
                                ref: `AH-${Date.now().toString(36).toUpperCase()}`,
                              })
                        }
                        size={150}
                        bgColor="#FFFFFF"
                        fgColor="#1B2A4A"
                        level="M"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-muted text-center mt-2">
                    {paymentMethod === 'pay-on-arrival'
                      ? 'Scan at front desk to pay via M-Pesa · Shortcode: 174379'
                      : 'Show at reception for express check-in'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
