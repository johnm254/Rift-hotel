
import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Link, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { SkeletonGrid } from '../components/SkeletonCard';
import { mockMeals } from '../lib/mockData';

// ── Category icons ────────────────────────────────────────────────────────────
const CAT_ICONS = {
  breakfast: '🍳', lunch: '🥗', dinner: '🍽️', dessert: '🍰',
  drinks: '🍹', appetizer: '🥟', snacks: '🥨', all: '🍴',
};

// ── Dietary badge colors ──────────────────────────────────────────────────────
const DIET_COLORS = {
  vegan: 'bg-green-100 text-green-700',
  vegetarian: 'bg-lime-100 text-lime-700',
  gf: 'bg-yellow-100 text-yellow-700',
  halal: 'bg-teal-100 text-teal-700',
  df: 'bg-blue-100 text-blue-700',
};

// ── Floating Cart Button ──────────────────────────────────────────────────────
function CartButton({ count, total, onClick }) {
  if (count === 0) return null;
  return (
    <button onClick={onClick}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 bg-navy text-cream px-5 py-3.5 rounded-2xl shadow-2xl shadow-navy/40 hover:bg-navy-light transition-all active:scale-95">
      <div className="relative">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        <span className="absolute -top-2 -right-2 w-4 h-4 bg-gold text-navy text-[9px] font-bold rounded-full flex items-center justify-center">{count}</span>
      </div>
      <span className="font-semibold text-sm">View Order</span>
      <span className="bg-gold text-navy font-bold text-sm px-2.5 py-0.5 rounded-xl">KES {total.toLocaleString()}</span>
    </button>
  );
}

// ── M-Pesa STK Waiting UI ─────────────────────────────────────────────────────
function MpesaWaiting({ phone, total, status, onCancel }) {
  const steps = [
    { key: 'sending',   label: 'Sending STK Push...',       done: ['waiting','verifying','confirmed'].includes(status) },
    { key: 'waiting',   label: `Check your phone: ${phone}`, done: ['verifying','confirmed'].includes(status) },
    { key: 'verifying', label: 'Verifying payment...',       done: status === 'confirmed' },
    { key: 'confirmed', label: 'Payment confirmed!',         done: status === 'confirmed' },
  ];
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 space-y-6">
      <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center text-3xl">📱</div>
      <div className="text-center">
        <h3 className="font-bold text-navy text-lg mb-1">M-Pesa Payment</h3>
        <p className="text-gold font-bold text-xl">KES {total.toLocaleString()}</p>
      </div>

      {/* Step indicators */}
      <div className="w-full space-y-3">
        {steps.map((s, i) => (
          <div key={s.key} className="flex items-center gap-3">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all ${
              s.done ? 'bg-green-500 text-white' :
              status === s.key ? 'bg-yellow-400 text-navy animate-pulse' :
              'bg-cream-dark text-muted'
            }`}>
              {s.done ? '✓' : i + 1}
            </div>
            <span className={`text-sm ${s.done ? 'text-green-600 font-medium' : status === s.key ? 'text-navy font-semibold' : 'text-muted'}`}>
              {s.label}
            </span>
            {status === s.key && !s.done && (
              <div className="w-4 h-4 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin ml-auto flex-shrink-0" />
            )}
          </div>
        ))}
      </div>

      {status === 'waiting' && (
        <div className="w-full bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-800 text-center">
          <p className="font-semibold mb-1">📲 Enter your M-Pesa PIN</p>
          <p className="text-xs">A prompt has been sent to <strong>{phone}</strong>. Enter your PIN to pay <strong>KES {total.toLocaleString()}</strong>.</p>
          <p className="text-xs mt-1 text-yellow-600">⚠️ Do NOT close this page</p>
        </div>
      )}

      {/* Progress bar */}
      {['waiting','verifying'].includes(status) && (
        <div className="w-full flex gap-1">
          {Array.from({length: 12}).map((_, i) => (
            <div key={i} className="flex-1 h-1 rounded-full bg-yellow-200 overflow-hidden">
              <div className="h-full bg-yellow-400 animate-pulse" style={{ animationDelay: `${i * 0.1}s` }} />
            </div>
          ))}
        </div>
      )}

      <button onClick={onCancel} className="text-muted hover:text-red-500 text-sm transition-colors">
        Cancel Payment
      </button>
    </div>
  );
}

// ── Cart / Checkout Drawer ────────────────────────────────────────────────────
function CartDrawer({ cart, onAdd, onRemove, onClose, onCheckout, isCheckingOut, user }) {
  const [tableNo, setTableNo] = useState('');
  const [notes, setNotes] = useState('');
  const [payMethod, setPayMethod] = useState('mpesa');
  const [mpesaPhone, setMpesaPhone] = useState('');
  const [step, setStep] = useState('cart'); // 'cart' | 'checkout' | 'mpesa-waiting'
  const [mpesaStatus, setMpesaStatus] = useState(''); // 'sending'|'waiting'|'verifying'|'confirmed'
  const [error, setError] = useState('');

  const cartItems = Object.values(cart);
  const total = cartItems.reduce((s, i) => s + i.price * i.qty, 0);

  const handleConfirmOrder = async () => {
    setError('');

    if (payMethod === 'mpesa') {
      const phone = mpesaPhone.trim();
      if (!phone) return setError('Please enter your M-Pesa phone number.');
      if (!/^(\+?254|0)\d{9}$/.test(phone.replace(/\s/g, ''))) {
        return setError('Enter a valid Kenyan number e.g. 0712 345 678');
      }

      setStep('mpesa-waiting');
      setMpesaStatus('sending');

      try {
        // 1. Send STK push (public endpoint — no auth needed)
        let checkoutRequestId = null;
        try {
          const stkRes = await api.post('/payments/mpesa/stk-push-public', {
            phone: phone.replace(/\s/g, ''),
            amount: total,
          });
          checkoutRequestId = stkRes.data.checkoutRequestId;
          setMpesaStatus('waiting');
        } catch (stkErr) {
          const msg = stkErr.response?.data?.error || 'STK push failed. Check your number and try again.';
          setError(msg);
          setStep('checkout');
          setMpesaStatus('');
          return;
        }

        // 2. Poll for payment confirmation (max 60s, every 5s)
        let paid = false;
        for (let i = 0; i < 12; i++) {
          await new Promise(r => setTimeout(r, 5000));
          if (i >= 5) setMpesaStatus('verifying');
          try {
            const queryRes = await api.post('/payments/mpesa/query-public', { checkoutRequestId });
            const rc = queryRes.data?.ResultCode;
            if (rc === 0 || rc === '0') {
              paid = true;
              setMpesaStatus('confirmed');
              break;
            }
            if (rc === 1032 || rc === '1032') {
              setError('Payment cancelled. Please try again.');
              setStep('checkout');
              setMpesaStatus('');
              return;
            }
            if (rc === 1037 || rc === '1037') {
              setError('Payment timed out on your phone. Please try again.');
              setStep('checkout');
              setMpesaStatus('');
              return;
            }
          } catch { /* keep polling */ }
        }

        if (!paid) {
          setError('Payment not confirmed after 60s. Please try again or use Cash.');
          setStep('checkout');
          setMpesaStatus('');
          return;
        }

        // 3. Only place order after payment confirmed
        await new Promise(r => setTimeout(r, 800)); // brief pause to show confirmed state
        onCheckout({ tableNo, notes, payMethod: 'mpesa', mpesaPhone: phone, total, cartItems });

      } catch (e) {
        setError(e.response?.data?.error || 'Payment failed. Please try again.');
        setStep('checkout');
        setMpesaStatus('');
      }

    } else {
      // Cash or Card — place order immediately
      onCheckout({ tableNo, notes, payMethod, mpesaPhone: '', total, cartItems });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={step === 'mpesa-waiting' ? undefined : onClose}>
      <div className="absolute inset-0 bg-navy/50 backdrop-blur-sm" />
      <div className="relative w-full max-w-md bg-white h-full flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-cream-dark">
          <div>
            <h2 className="font-serif font-bold text-navy text-lg">
              {step === 'cart' ? 'Your Order' : step === 'mpesa-waiting' ? 'M-Pesa Payment' : 'Checkout'}
            </h2>
            <p className="text-xs text-muted">{cartItems.length} item{cartItems.length !== 1 ? 's' : ''} · KES {total.toLocaleString()}</p>
          </div>
          {step !== 'mpesa-waiting' && (
            <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-cream flex items-center justify-center text-muted transition-colors">✕</button>
          )}
        </div>

        {/* M-Pesa waiting screen */}
        {step === 'mpesa-waiting' && (
          <MpesaWaiting
            phone={mpesaPhone}
            total={total}
            status={mpesaStatus}
            onCancel={() => { setStep('checkout'); setMpesaStatus(''); setError(''); }}
          />
        )}

        {/* Cart view */}
        {step === 'cart' && (
          <>
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
              {cartItems.length === 0 ? (
                <div className="text-center py-16">
                  <div className="text-5xl mb-3">🛒</div>
                  <p className="text-muted">Your order is empty</p>
                  <button onClick={onClose} className="mt-4 text-gold text-sm font-medium hover:underline">Browse Menu</button>
                </div>
              ) : cartItems.map(item => (
                <div key={item.id} className="flex items-center gap-3 bg-cream rounded-xl p-3">
                  <img src={item.photo || 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=100'}
                    alt={item.name} className="w-14 h-14 rounded-lg object-cover flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-navy text-sm truncate">{item.name}</div>
                    <div className="text-gold font-bold text-sm">KES {(item.price * item.qty).toLocaleString()}</div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => onRemove(item.id)} className="w-7 h-7 rounded-full bg-white border border-cream-dark flex items-center justify-center text-navy font-bold text-sm hover:bg-cream-dark transition-colors">−</button>
                    <span className="font-bold text-navy w-5 text-center text-sm">{item.qty}</span>
                    <button onClick={() => onAdd(item)} className="w-7 h-7 rounded-full bg-gold flex items-center justify-center text-navy font-bold text-sm hover:bg-gold-light transition-colors">+</button>
                  </div>
                </div>
              ))}
            </div>
            {cartItems.length > 0 && (
              <div className="px-5 py-4 border-t border-cream-dark space-y-3">
                <div className="flex justify-between font-bold text-navy text-lg">
                  <span>Total</span>
                  <span className="text-gold">KES {total.toLocaleString()}</span>
                </div>
                <button onClick={() => setStep('checkout')}
                  className="w-full bg-navy hover:bg-navy-light text-cream font-bold py-4 rounded-xl text-sm uppercase tracking-widest transition-all">
                  Proceed to Checkout →
                </button>
                <p className="text-center text-xs text-muted">Dine-in · Takeaway · Delivery available</p>
              </div>
            )}
          </>
        )}

        {/* Checkout form */}
        {step === 'checkout' && (
          <>
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {/* Order summary */}
              <div className="bg-cream rounded-xl p-4 space-y-2">
                {cartItems.map(item => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-navy">{item.name} × {item.qty}</span>
                    <span className="text-gold font-bold">KES {(item.price * item.qty).toLocaleString()}</span>
                  </div>
                ))}
                <hr className="border-cream-dark" />
                <div className="flex justify-between font-bold text-navy">
                  <span>Total</span>
                  <span className="text-gold text-lg">KES {total.toLocaleString()}</span>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-navy mb-1.5">Table / Location</label>
                <input value={tableNo} onChange={e => setTableNo(e.target.value)}
                  placeholder="e.g. Table 5, Poolside, Room 204..."
                  className="w-full px-4 py-3 rounded-xl bg-cream border border-cream-dark focus:border-gold focus:outline-none text-navy transition-colors" />
              </div>

              <div>
                <label className="block text-sm font-medium text-navy mb-1.5">Special Instructions</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)}
                  rows={2} placeholder="Allergies, preferences, spice level..."
                  className="w-full px-4 py-3 rounded-xl bg-cream border border-cream-dark focus:border-gold focus:outline-none text-navy transition-colors resize-none" />
              </div>

              <div>
                <label className="block text-sm font-medium text-navy mb-2">Payment Method</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'mpesa', icon: '📱', label: 'M-Pesa' },
                    { id: 'cash', icon: '💵', label: 'Cash' },
                    { id: 'card', icon: '💳', label: 'Card' },
                  ].map(m => (
                    <button key={m.id} onClick={() => { setPayMethod(m.id); setError(''); }}
                      className={`py-3 rounded-xl border-2 text-sm font-semibold transition-all flex flex-col items-center gap-1 ${payMethod === m.id ? 'border-gold bg-gold/10 text-navy' : 'border-cream-dark text-muted hover:border-gold/40'}`}>
                      <span className="text-xl">{m.icon}</span>
                      <span>{m.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {payMethod === 'mpesa' && (
                <div>
                  <label className="block text-sm font-medium text-navy mb-1.5">Safaricom Number</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted text-sm">🇰🇪</span>
                    <input type="tel" value={mpesaPhone} onChange={e => setMpesaPhone(e.target.value)}
                      placeholder="0712 345 678"
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-cream border border-cream-dark focus:border-gold focus:outline-none text-navy transition-colors" />
                  </div>
                  <p className="text-xs text-muted mt-1">You'll receive an STK push — enter your PIN to pay</p>
                </div>
              )}

              {payMethod === 'cash' && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-sm text-yellow-800">
                  💵 Pay at the counter or to your waiter. Show this order to staff.
                </div>
              )}

              {payMethod === 'card' && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-800">
                  💳 Pay by card at the counter. Our staff will bring the card machine to your table.
                </div>
              )}
            </div>

            <div className="px-5 py-4 border-t border-cream-dark space-y-2">
              <button onClick={handleConfirmOrder} disabled={isCheckingOut}
                className="w-full bg-gold hover:bg-gold-light disabled:bg-gold/50 text-navy font-bold py-4 rounded-xl text-sm uppercase tracking-widest transition-all shadow-lg shadow-gold/20">
                {isCheckingOut ? 'Placing Order...' :
                  payMethod === 'mpesa' ? `Pay KES ${total.toLocaleString()} via M-Pesa` :
                  payMethod === 'cash' ? `Place Order · Pay Cash` :
                  `Place Order · Pay by Card`}
              </button>
              <button onClick={() => { setStep('cart'); setError(''); }} className="w-full text-muted hover:text-navy text-sm py-2 transition-colors">
                ← Back to Order
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Order Confirmed Screen ────────────────────────────────────────────────────
function OrderConfirmed({ order, onReset }) {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="text-center max-w-sm w-full">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5 text-4xl">🎉</div>
        <h2 className="text-2xl font-serif font-bold text-navy mb-2">Order Placed!</h2>
        <p className="text-muted mb-1">
          {order.tableNo ? `Your order for <strong>${order.tableNo}</strong> is being prepared.` : 'Your order is being prepared.'}
        </p>
        <p className="text-muted text-sm mb-1">Estimated time: <strong>20–35 minutes</strong></p>
        <p className="text-gold font-bold text-xl mb-6">KES {order.total?.toLocaleString()}</p>

        {/* Receipt-style summary */}
        <div className="bg-cream rounded-2xl p-5 text-left mb-6 space-y-2">
          <div className="text-xs font-semibold text-muted uppercase tracking-widest mb-3">Order Summary</div>
          {order.cartItems?.map((item, i) => (
            <div key={i} className="flex justify-between text-sm">
              <span className="text-navy">{item.name} × {item.qty}</span>
              <span className="text-gold font-bold">KES {(item.price * item.qty).toLocaleString()}</span>
            </div>
          ))}
          <hr className="border-cream-dark" />
          <div className="flex justify-between font-bold text-navy">
            <span>Total</span>
            <span className="text-gold">KES {order.total?.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-xs text-muted pt-1">
            <span>Payment</span>
            <span className="capitalize">{order.payMethod === 'mpesa' ? '📱 M-Pesa' : order.payMethod === 'cash' ? '💵 Cash' : '💳 Card'}</span>
          </div>
        </div>

        <div className="flex gap-3 justify-center">
          <button onClick={onReset}
            className="bg-gold hover:bg-gold-light text-navy font-bold px-6 py-3 rounded-xl text-sm uppercase tracking-widest transition-all">
            Order More
          </button>
          <Link to="/"
            className="border-2 border-navy text-navy hover:bg-navy hover:text-cream font-semibold px-6 py-3 rounded-xl text-sm uppercase tracking-widest transition-all">
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}

// ── Main Meals / Restaurant Page ──────────────────────────────────────────────
export default function Meals() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState({});
  const [showCart, setShowCart] = useState(false);
  const [confirmed, setConfirmed] = useState(null);
  const menuRef = useRef(null);

  const { data: meals, isLoading } = useQuery({
    queryKey: ['meals', category],
    queryFn: () => {
      const params = category ? `/meals?category=${category}` : '/meals';
      return api.get(params).then(r => {
        const d = r.data;
        const arr = Array.isArray(d) ? d : (d.meals || d.data || []);
        const result = arr.length > 0 ? arr : mockMeals;
        return category ? result.filter(m => m.category === category) : result;
      }).catch(() => category ? mockMeals.filter(m => m.category === category) : mockMeals);
    },
  });

  const categories = [...new Set((meals || []).map(m => m.category).filter(Boolean))];
  const cartItems = Object.values(cart);
  const cartCount = cartItems.reduce((s, i) => s + i.qty, 0);
  const cartTotal = cartItems.reduce((s, i) => s + i.price * i.qty, 0);

  let filtered = meals || [];
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(m =>
      m.name?.toLowerCase().includes(q) ||
      m.description?.toLowerCase().includes(q) ||
      m.category?.toLowerCase().includes(q)
    );
  }

  const addToCart = (meal) => {
    setCart(prev => ({ ...prev, [meal.id]: { ...meal, qty: (prev[meal.id]?.qty || 0) + 1 } }));
    toast.success(`${meal.name} added`, { duration: 1500 });
  };

  const removeFromCart = (id) => {
    setCart(prev => {
      const u = { ...prev };
      if (u[id].qty <= 1) delete u[id]; else u[id] = { ...u[id], qty: u[id].qty - 1 };
      return u;
    });
  };

  const placeOrder = useMutation({
    mutationFn: ({ tableNo, notes, payMethod, mpesaPhone, total, cartItems }) =>
      api.post('/orders/walkin', {
        items: cartItems.map(i => ({ mealId: i.id, name: i.name, price: i.price, qty: i.qty })),
        tableNo: tableNo || 'Walk-in',
        roomNumber: tableNo || 'Walk-in',
        notes: `${notes}${mpesaPhone ? ` [M-Pesa: ${mpesaPhone}]` : ''}`.trim(),
        total,
        paymentMethod: payMethod,
      }).catch(() => ({ data: { id: 'order-' + Date.now() } })),
    onSuccess: (_, vars) => {
      setConfirmed(vars);
      setCart({});
      setShowCart(false);
    },
    onError: () => toast.error('Order failed. Please try again.'),
  });

  if (confirmed) return <OrderConfirmed order={confirmed} onReset={() => setConfirmed(null)} />;

  return (
    <div className="min-h-screen bg-cream">
      {/* ── Hero ── */}
      <section className="hero-gradient py-14 sm:py-20 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <img src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1400" alt="" className="w-full h-full object-cover" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="text-center lg:text-left">
              <span className="text-gold text-xs sm:text-sm uppercase tracking-widest font-semibold">The Azura Restaurant</span>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-white mt-2 mb-3">
                Dine With Us
              </h1>
              <p className="text-cream/70 max-w-lg text-sm sm:text-base mb-5">
                Whether you're a hotel guest or visiting for the day — our restaurant is open to everyone.
                Order at your table, poolside, or take away.
              </p>
              <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
                <button onClick={() => menuRef.current?.scrollIntoView({ behavior: 'smooth' })}
                  className="bg-gold hover:bg-gold-light text-navy font-bold px-6 py-3 rounded-xl text-sm uppercase tracking-widest transition-all shadow-lg shadow-gold/20">
                  View Menu
                </button>
                {user ? (
                  <Link to="/my-room"
                    className="border border-cream/30 text-cream hover:bg-white/10 font-semibold px-6 py-3 rounded-xl text-sm uppercase tracking-widest transition-all">
                    Room Service →
                  </Link>
                ) : (
                  <Link to="/login"
                    className="border border-cream/30 text-cream hover:bg-white/10 font-semibold px-6 py-3 rounded-xl text-sm uppercase tracking-widest transition-all">
                    Sign In for Room Service
                  </Link>
                )}
              </div>
            </div>

            {/* Info cards */}
            <div className="grid grid-cols-2 gap-3 w-full max-w-xs flex-shrink-0">
              {[
                { icon: '🕐', title: 'Opening Hours', detail: '6:30 AM – 11:00 PM' },
                { icon: '🪑', title: 'Seating', detail: 'Indoor & Poolside' },
                { icon: '🚗', title: 'Takeaway', detail: 'Available daily' },
                { icon: '🛎️', title: 'Room Service', detail: 'Hotel guests only' },
              ].map(info => (
                <div key={info.title} className="bg-white/10 backdrop-blur border border-white/20 rounded-xl p-3 text-center">
                  <div className="text-2xl mb-1">{info.icon}</div>
                  <div className="text-cream text-xs font-semibold">{info.title}</div>
                  <div className="text-cream/60 text-xs mt-0.5">{info.detail}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Two paths banner ── */}
      <section className="bg-white border-b border-cream-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 text-sm">
            <div className="flex items-center gap-2 text-navy">
              <span className="text-xl">🍽️</span>
              <span><strong>Walk-in guests:</strong> Order below, pay at checkout</span>
            </div>
            <span className="hidden sm:block text-cream-dark">|</span>
            <div className="flex items-center gap-2 text-navy">
              <span className="text-xl">🏨</span>
              <span><strong>Hotel guests:</strong> Order via{' '}
                <Link to="/my-room" className="text-gold font-semibold hover:underline">Room Portal</Link>
                {' '}— added to your room tab
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Menu section ── */}
      <section ref={menuRef} className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Filters row */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between mb-6 sm:mb-8">
          {/* Category pills */}
          <div className="flex gap-2 overflow-x-auto pb-1 w-full sm:w-auto scrollbar-hide">
            <button onClick={() => setCategory('')}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-full text-sm font-medium transition-all ${!category ? 'bg-navy text-cream' : 'bg-white text-navy/60 hover:bg-cream border border-cream-dark'}`}>
              {CAT_ICONS.all} All
            </button>
            {categories.map(c => (
              <button key={c} onClick={() => setCategory(c)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-full text-sm font-medium capitalize transition-all ${category === c ? 'bg-navy text-cream' : 'bg-white text-navy/60 hover:bg-cream border border-cream-dark'}`}>
                {CAT_ICONS[c] || '🍴'} {c}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-64 flex-shrink-0">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input type="text" placeholder="Search dishes..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white border border-cream-dark focus:border-gold focus:outline-none text-navy text-sm transition-colors" />
          </div>
        </div>

        {/* Meal grid */}
        {isLoading ? <SkeletonGrid count={6} type="meal" /> : filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">🍽️</div>
            <p className="text-muted">No dishes found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {filtered.map(meal => {
              const inCart = cart[meal.id];
              const unavailable = meal.available === false;
              return (
                <div key={meal.id}
                  className={`group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-cream-dark ${unavailable ? 'opacity-60' : 'hover:-translate-y-1'}`}>
                  {/* Image */}
                  <div className="relative h-44 sm:h-48 overflow-hidden">
                    <img src={meal.photo || 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400'}
                      alt={meal.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-navy/30 to-transparent" />
                    {/* Category badge */}
                    <div className="absolute top-3 left-3">
                      <span className="bg-navy/80 backdrop-blur text-cream text-xs px-2.5 py-1 rounded-full capitalize font-medium">
                        {CAT_ICONS[meal.category] || '🍴'} {meal.category}
                      </span>
                    </div>
                    {unavailable && (
                      <div className="absolute inset-0 bg-navy/40 flex items-center justify-center">
                        <span className="bg-white text-navy text-xs font-bold px-3 py-1.5 rounded-full">Unavailable</span>
                      </div>
                    )}
                    {/* Quick add on hover */}
                    {!unavailable && !inCart && (
                      <button onClick={() => addToCart(meal)}
                        className="absolute bottom-3 right-3 w-9 h-9 bg-gold hover:bg-gold-light text-navy rounded-full flex items-center justify-center font-bold text-lg shadow-lg opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                        +
                      </button>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-1.5">
                      <h3 className="font-serif font-bold text-navy text-sm sm:text-base leading-tight flex-1 mr-2">{meal.name}</h3>
                      <span className="text-gold font-bold text-sm flex-shrink-0">KES {meal.price?.toLocaleString()}</span>
                    </div>
                    <p className="text-muted text-xs leading-relaxed line-clamp-2 mb-3">{meal.description}</p>

                    {/* Dietary tags */}
                    {meal.dietary?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {meal.dietary.map(d => (
                          <span key={d} className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${DIET_COLORS[d] || 'bg-cream text-navy/60'}`}>{d}</span>
                        ))}
                      </div>
                    )}

                    {/* Add / qty controls */}
                    {!unavailable && (
                      inCart ? (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <button onClick={() => removeFromCart(meal.id)}
                              className="w-8 h-8 rounded-full bg-cream border border-cream-dark flex items-center justify-center text-navy font-bold hover:bg-cream-dark transition-colors">−</button>
                            <span className="font-bold text-navy w-5 text-center">{inCart.qty}</span>
                            <button onClick={() => addToCart(meal)}
                              className="w-8 h-8 rounded-full bg-gold hover:bg-gold-light flex items-center justify-center text-navy font-bold transition-colors">+</button>
                          </div>
                          <span className="text-gold font-bold text-sm">KES {(meal.price * inCart.qty).toLocaleString()}</span>
                        </div>
                      ) : (
                        <button onClick={() => addToCart(meal)}
                          className="w-full bg-cream hover:bg-gold hover:text-navy text-navy font-semibold py-2.5 rounded-xl text-xs uppercase tracking-widest transition-all border border-cream-dark hover:border-gold">
                          Add to Order
                        </button>
                      )
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Floating cart ── */}
      <CartButton count={cartCount} total={cartTotal} onClick={() => setShowCart(true)} />

      {/* ── Cart drawer ── */}
      {showCart && (
        <CartDrawer
          cart={cart}
          onAdd={addToCart}
          onRemove={removeFromCart}
          onClose={() => setShowCart(false)}
          onCheckout={(vars) => placeOrder.mutate(vars)}
          isCheckingOut={placeOrder.isPending}
          user={user}
        />
      )}

      {/* Bottom padding for floating cart button */}
      <div className="h-24" />
    </div>
  );
}
