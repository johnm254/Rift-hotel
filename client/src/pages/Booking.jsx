import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import Loading from '../components/Loading';

export default function Booking() {
  const { roomId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(2);
  const [specialRequests, setSpecialRequests] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [mpesaPhone, setMpesaPhone] = useState('');
  const [step, setStep] = useState(1); // 1=details, 2=payment, 3=confirmation
  const [error, setError] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');

  const { data: room, isLoading } = useQuery({
    queryKey: ['room', roomId],
    queryFn: () => api.get(`/rooms/${roomId}`).then(r => r.data),
  });

  // Calculate nights and total
  const nights = checkIn && checkOut
    ? Math.max(1, Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24)))
    : 0;
  const totalPrice = room ? nights * room.price : 0;

  const createBooking = useMutation({
    mutationFn: (data) => api.post('/bookings', data),
    onSuccess: (res) => {
      setStep(3);
    },
    onError: (err) => {
      setError(err.response?.data?.error || 'Booking failed');
    },
  });

  const mpesaPayment = useMutation({
    mutationFn: (data) => api.post('/payments/mpesa/stk-push', data),
    onSuccess: (data) => {
      setPaymentStatus('pending');
      // Start polling for payment status
      pollPaymentStatus(data.data.checkoutRequestId);
    },
    onError: (err) => {
      setError(err.response?.data?.error || 'M-Pesa payment failed');
    },
  });

  const pollPaymentStatus = async (checkoutRequestId) => {
    // In production, use a proper polling mechanism or listen for the callback
    // For now, simulate success after 10 seconds
    setTimeout(async () => {
      try {
        const bookingData = {
          roomId,
          roomName: room.name,
          checkIn,
          checkOut,
          guests,
          totalPrice,
          specialRequests,
        };
        await createBooking.mutateAsync(bookingData);
        setPaymentStatus('completed');
      } catch (e) {
        setError('Payment verification failed. Please try again.');
        setPaymentStatus('failed');
      }
    }, 15000);
  };

  const handleConfirmBooking = () => {
    setStep(2);
  };

  const handlePayment = async () => {
    setError('');
    if (paymentMethod === 'mpesa') {
      if (!mpesaPhone) {
        setError('Please enter your M-Pesa phone number');
        return;
      }
      mpesaPayment.mutate({
        phone: mpesaPhone,
        amount: totalPrice,
      });
    } else {
      // For card, just create booking directly
      const bookingData = {
        roomId,
        roomName: room.name,
        checkIn,
        checkOut,
        guests,
        totalPrice,
        specialRequests,
      };
      createBooking.mutate(bookingData);
    }
  };

  if (isLoading) return <Loading />;
  if (!room) return <div className="text-center py-20 text-muted">Room not found.</div>;

  return (
    <div className="min-h-[80vh] bg-cream py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-10">
          {[1, 2, 3].map(s => (
            <div key={s} className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                step >= s ? 'bg-gold text-navy' : 'bg-white text-muted border-2 border-cream-dark'
              }`}>
                {step > s ? '✓' : s}
              </div>
              {s < 3 && (
                <div className={`w-12 h-1 mx-2 rounded transition-all ${step > s ? 'bg-gold' : 'bg-cream-dark'}`}></div>
              )}
            </div>
          ))}
        </div>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-serif font-bold text-navy">
            {step === 1 ? 'Book Your Stay' : step === 2 ? 'Payment' : 'Confirmed!'}
          </h1>
          <p className="text-muted mt-2">{room.name}</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-6">
            {error}
          </div>
        )}

        {/* STEP 1: Booking Details */}
        {step === 1 && (
          <div className="bg-white rounded-2xl shadow-xl border border-cream-dark p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-navy mb-1.5">Check-in</label>
                <input
                  type="date"
                  required
                  value={checkIn}
                  onChange={e => setCheckIn(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 rounded-xl bg-cream border border-cream-dark focus:border-gold focus:outline-none text-navy transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-navy mb-1.5">Check-out</label>
                <input
                  type="date"
                  required
                  value={checkOut}
                  onChange={e => setCheckOut(e.target.value)}
                  min={checkIn || new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 rounded-xl bg-cream border border-cream-dark focus:border-gold focus:outline-none text-navy transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-navy mb-1.5">Number of Guests</label>
              <select
                value={guests}
                onChange={e => setGuests(Number(e.target.value))}
                className="w-full px-4 py-3 rounded-xl bg-cream border border-cream-dark focus:border-gold focus:outline-none text-navy transition-colors"
              >
                {[...Array(room.capacity || 4)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>{i + 1} guest{i > 0 ? 's' : ''}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-navy mb-1.5">Special Requests (optional)</label>
              <textarea
                value={specialRequests}
                onChange={e => setSpecialRequests(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 rounded-xl bg-cream border border-cream-dark focus:border-gold focus:outline-none text-navy transition-colors resize-none"
                placeholder="Any special requirements..."
              />
            </div>

            {/* Price Summary */}
            {nights > 0 && (
              <div className="bg-cream rounded-xl p-5 space-y-3">
                <div className="flex justify-between text-sm text-muted">
                  <span>KES {room.price?.toLocaleString()} × {nights} night{nights > 1 ? 's' : ''}</span>
                  <span>KES {(nights * room.price)?.toLocaleString()}</span>
                </div>
                <hr className="border-cream-dark" />
                <div className="flex justify-between font-bold text-navy text-lg">
                  <span>Total</span>
                  <span className="text-gold">KES {totalPrice?.toLocaleString()}</span>
                </div>
              </div>
            )}

            <button
              onClick={handleConfirmBooking}
              disabled={!checkIn || !checkOut || nights <= 0}
              className="w-full bg-navy hover:bg-navy-light disabled:bg-navy/30 text-white font-bold py-4 rounded-xl text-sm uppercase tracking-widest transition-all"
            >
              Continue to Payment
            </button>
          </div>
        )}

        {/* STEP 2: Payment */}
        {step === 2 && (
          <div className="bg-white rounded-2xl shadow-xl border border-cream-dark p-8 space-y-6">
            <div className="bg-cream rounded-xl p-5">
              <div className="flex justify-between font-semibold text-navy">
                <span>Total Amount</span>
                <span className="text-gold text-xl">KES {totalPrice?.toLocaleString()}</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-navy mb-3">Payment Method</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setPaymentMethod('mpesa')}
                  className={`p-4 rounded-xl border-2 text-center transition-all ${
                    paymentMethod === 'mpesa'
                      ? 'border-gold bg-gold/5'
                      : 'border-cream-dark hover:border-gold/30'
                  }`}
                >
                  <div className="text-2xl mb-1">📱</div>
                  <div className="text-sm font-semibold text-navy">M-Pesa</div>
                  <div className="text-xs text-muted">STK Push</div>
                </button>
                <button
                  onClick={() => setPaymentMethod('card')}
                  className={`p-4 rounded-xl border-2 text-center transition-all ${
                    paymentMethod === 'card'
                      ? 'border-gold bg-gold/5'
                      : 'border-cream-dark hover:border-gold/30'
                  }`}
                >
                  <div className="text-2xl mb-1">💳</div>
                  <div className="text-sm font-semibold text-navy">Card</div>
                  <div className="text-xs text-muted">Visa / MC</div>
                </button>
              </div>
            </div>

            {paymentMethod === 'mpesa' && (
              <div>
                <label className="block text-sm font-medium text-navy mb-1.5">M-Pesa Phone Number</label>
                <input
                  type="tel"
                  value={mpesaPhone}
                  onChange={e => setMpesaPhone(e.target.value)}
                  placeholder="07XX XXX XXX"
                  className="w-full px-4 py-3 rounded-xl bg-cream border border-cream-dark focus:border-gold focus:outline-none text-navy transition-colors"
                />
                <p className="text-xs text-muted mt-1">You'll receive an STK push on this number</p>
              </div>
            )}

            {paymentMethod === 'card' && (
              <div className="bg-cream rounded-xl p-4">
                <p className="text-sm text-muted text-center">
                  Card payment will be available at check-in. Your booking will be reserved now.
                </p>
              </div>
            )}

            {mpesaPayment.isPending && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-center">
                <div className="spinner mx-auto mb-3"></div>
                <p className="text-navy font-medium text-sm">M-Pesa STK push sent!</p>
                <p className="text-muted text-xs mt-1">Check your phone and enter your PIN to complete payment.</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 border-2 border-navy text-navy hover:bg-navy hover:text-cream font-semibold py-4 rounded-xl text-sm uppercase tracking-widest transition-all"
              >
                Back
              </button>
              <button
                onClick={handlePayment}
                disabled={!paymentMethod || createBooking.isPending || mpesaPayment.isPending}
                className="flex-1 bg-gold hover:bg-gold-light disabled:bg-gold/50 text-navy font-bold py-4 rounded-xl text-sm uppercase tracking-widest transition-all shadow-lg shadow-gold/20"
              >
                {mpesaPayment.isPending ? 'Waiting for M-Pesa...' : createBooking.isPending ? 'Booking...' : 'Confirm & Pay'}
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Confirmation */}
        {step === 3 && (
          <div className="bg-white rounded-2xl shadow-xl border border-cream-dark p-8 text-center space-y-6">
            <div className="text-6xl">🎉</div>
            <h2 className="text-2xl font-serif font-bold text-navy">Booking Confirmed!</h2>
            <p className="text-muted">
              Your stay at <strong className="text-navy">{room.name}</strong> has been booked successfully.
            </p>
            <div className="bg-cream rounded-xl p-5 inline-block text-left space-y-2 min-w-[280px]">
              <div className="flex justify-between text-sm text-muted">
                <span>Check-in</span>
                <span className="text-navy font-medium">{checkIn}</span>
              </div>
              <div className="flex justify-between text-sm text-muted">
                <span>Check-out</span>
                <span className="text-navy font-medium">{checkOut}</span>
              </div>
              <div className="flex justify-between text-sm text-muted">
                <span>Guests</span>
                <span className="text-navy font-medium">{guests}</span>
              </div>
              <hr className="border-cream-dark my-2" />
              <div className="flex justify-between font-bold text-navy">
                <span>Total</span>
                <span className="text-gold">KES {totalPrice?.toLocaleString()}</span>
              </div>
            </div>
            <div className="flex gap-3 justify-center pt-4">
              <button
                onClick={() => navigate('/profile')}
                className="bg-navy hover:bg-navy-light text-white font-semibold px-6 py-3 rounded-xl text-sm uppercase tracking-widest transition-all"
              >
                My Bookings
              </button>
              <button
                onClick={() => navigate('/rooms')}
                className="border-2 border-navy text-navy hover:bg-navy hover:text-cream font-semibold px-6 py-3 rounded-xl text-sm uppercase tracking-widest transition-all"
              >
                Browse More
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
