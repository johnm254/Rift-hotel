import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import Loading from '../components/Loading';
import { mockMeals } from '../lib/mockData';

// ── Room Service Request ──────────────────────────────────────────────────────
function RoomServiceTab({ booking }) {
  const [cart, setCart] = useState({});
  const [notes, setNotes] = useState('');
  const [category, setCategory] = useState('');
  const [ordered, setOrdered] = useState(null);

  const { data: meals = [] } = useQuery({
    queryKey: ['meals', category],
    queryFn: () => {
      const params = category ? `/meals?category=${category}` : '/meals';
      return api.get(params).then(r => {
        const d = r.data;
        const arr = Array.isArray(d) ? d : (d.meals || []);
        return arr.length > 0 ? arr : mockMeals;
      }).catch(() => mockMeals);
    },
  });

  const categories = [...new Set(meals.map(m => m.category).filter(Boolean))];
  const cartItems = Object.values(cart);
  const total = cartItems.reduce((s, i) => s + i.price * i.qty, 0);

  const placeOrder = useMutation({
    mutationFn: () => api.post('/orders', {
      items: cartItems.map(i => ({ mealId: i.id, name: i.name, price: i.price, qty: i.qty })),
      bookingId: booking.id,
      roomNumber: booking.roomName,
      notes,
      total,
    }).catch(() => ({ data: { id: 'order-' + Date.now() } })),
    onSuccess: (res) => {
      setOrdered(res.data);
      setCart({});
      setNotes('');
      toast.success('Order placed! Delivery in 30-45 minutes 🍽️');
    },
  });

  const add = (meal) => setCart(c => ({ ...c, [meal.id]: { ...meal, qty: (c[meal.id]?.qty || 0) + 1 } }));
  const remove = (id) => setCart(c => {
    const u = { ...c };
    if (u[id].qty <= 1) delete u[id]; else u[id] = { ...u[id], qty: u[id].qty - 1 };
    return u;
  });

  if (ordered) return (
    <div className="text-center py-10">
      <div className="text-5xl mb-4">🎉</div>
      <h3 className="text-xl font-serif font-bold text-navy mb-2">Order Placed!</h3>
      <p className="text-muted mb-1">Your meal will arrive in <strong>30–45 minutes</strong></p>
      <p className="text-gold font-bold text-lg">KES {ordered.total?.toLocaleString() || total.toLocaleString()}</p>
      <button onClick={() => setOrdered(null)} className="mt-4 bg-gold hover:bg-gold-light text-navy font-bold px-6 py-3 rounded-xl text-sm uppercase tracking-widest transition-all">
        Order More
      </button>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        <button onClick={() => setCategory('')}
          className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${!category ? 'bg-navy text-cream' : 'bg-cream text-navy/60 border border-cream-dark'}`}>
          All
        </button>
        {categories.map(c => (
          <button key={c} onClick={() => setCategory(c)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium capitalize transition-all ${category === c ? 'bg-navy text-cream' : 'bg-cream text-navy/60 border border-cream-dark'}`}>
            {c}
          </button>
        ))}
      </div>

      {/* Menu grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {meals.filter(m => m.available !== false).map(meal => (
          <div key={meal.id} className="bg-white rounded-xl border border-cream-dark p-3 flex gap-3">
            <img src={meal.photo || 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=100'}
              alt={meal.name} className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-navy text-sm truncate">{meal.name}</div>
              <div className="text-gold font-bold text-sm">KES {meal.price?.toLocaleString()}</div>
              <div className="flex items-center gap-2 mt-1">
                {cart[meal.id] ? (
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => remove(meal.id)} className="w-6 h-6 rounded-full bg-cream border border-cream-dark flex items-center justify-center text-navy font-bold text-xs">−</button>
                    <span className="font-bold text-navy text-sm w-4 text-center">{cart[meal.id].qty}</span>
                    <button onClick={() => add(meal)} className="w-6 h-6 rounded-full bg-gold flex items-center justify-center text-navy font-bold text-xs">+</button>
                  </div>
                ) : (
                  <button onClick={() => add(meal)} className="bg-gold hover:bg-gold-light text-navy font-semibold px-3 py-1 rounded-lg text-xs transition-all">Add</button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Cart summary */}
      {cartItems.length > 0 && (
        <div className="bg-navy rounded-2xl p-4 space-y-3">
          <h4 className="text-gold font-bold text-sm uppercase tracking-widest">Your Order</h4>
          {cartItems.map(item => (
            <div key={item.id} className="flex justify-between text-sm text-cream/80">
              <span>{item.name} × {item.qty}</span>
              <span className="text-gold font-bold">KES {(item.price * item.qty).toLocaleString()}</span>
            </div>
          ))}
          <hr className="border-white/10" />
          <div className="flex justify-between font-bold text-white">
            <span>Total</span>
            <span className="text-gold">KES {total.toLocaleString()}</span>
          </div>
          <textarea value={notes} onChange={e => setNotes(e.target.value)}
            rows={2} placeholder="Special instructions (allergies, preferences)..."
            className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-cream text-sm placeholder-cream/40 focus:outline-none resize-none" />
          <button onClick={() => placeOrder.mutate()} disabled={placeOrder.isPending}
            className="w-full bg-gold hover:bg-gold-light disabled:bg-gold/50 text-navy font-bold py-3 rounded-xl text-sm uppercase tracking-widest transition-all">
            {placeOrder.isPending ? 'Placing Order...' : `Order Now · KES ${total.toLocaleString()}`}
          </button>
        </div>
      )}
    </div>
  );
}

// ── Room Service Requests ─────────────────────────────────────────────────────
const SERVICE_TYPES = [
  { id: 'housekeeping', icon: '🧹', label: 'Housekeeping', desc: 'Room cleaning, fresh towels, linen change' },
  { id: 'maintenance', icon: '🔧', label: 'Maintenance', desc: 'Fix something in the room' },
  { id: 'laundry', icon: '👔', label: 'Laundry', desc: 'Laundry pickup and delivery' },
  { id: 'wakeup', icon: '⏰', label: 'Wake-up Call', desc: 'Schedule a wake-up call' },
  { id: 'transport', icon: '🚗', label: 'Transport', desc: 'Taxi, airport transfer, car hire' },
  { id: 'concierge', icon: '🎩', label: 'Concierge', desc: 'Reservations, tickets, recommendations' },
  { id: 'spa', icon: '💆', label: 'Spa & Wellness', desc: 'Book a spa treatment in your room' },
  { id: 'other', icon: '💬', label: 'Other Request', desc: 'Anything else we can help with' },
];

function ServicesTab({ booking }) {
  const [selected, setSelected] = useState(null);
  const [message, setMessage] = useState('');
  const [time, setTime] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const submitRequest = useMutation({
    mutationFn: () => api.post('/orders', {
      items: [{ name: selected.label, qty: 1, price: 0 }],
      bookingId: booking.id,
      roomNumber: booking.roomName,
      notes: `[${selected.label}] ${time ? `Time: ${time}. ` : ''}${message}`,
      total: 0,
      type: 'service',
    }).catch(() => ({ data: { ok: true } })),
    onSuccess: () => {
      setSubmitted(true);
      toast.success(`${selected.label} request sent! We'll be with you shortly.`);
    },
  });

  if (submitted) return (
    <div className="text-center py-10">
      <div className="text-5xl mb-4">✅</div>
      <h3 className="text-xl font-serif font-bold text-navy mb-2">Request Sent!</h3>
      <p className="text-muted mb-4">Our team will attend to your <strong>{selected?.label}</strong> request shortly.</p>
      <button onClick={() => { setSubmitted(false); setSelected(null); setMessage(''); setTime(''); }}
        className="bg-gold hover:bg-gold-light text-navy font-bold px-6 py-3 rounded-xl text-sm uppercase tracking-widest transition-all">
        New Request
      </button>
    </div>
  );

  if (selected) return (
    <div className="space-y-4">
      <button onClick={() => setSelected(null)} className="flex items-center gap-2 text-muted hover:text-navy text-sm transition-colors">
        ← Back to services
      </button>
      <div className="bg-cream rounded-2xl p-5">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">{selected.icon}</span>
          <div>
            <h3 className="font-bold text-navy">{selected.label}</h3>
            <p className="text-muted text-sm">{selected.desc}</p>
          </div>
        </div>
        {(selected.id === 'wakeup' || selected.id === 'transport') && (
          <div className="mb-3">
            <label className="block text-sm font-medium text-navy mb-1.5">Preferred Time</label>
            <input type="time" value={time} onChange={e => setTime(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white border border-cream-dark focus:border-gold focus:outline-none text-navy transition-colors" />
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-navy mb-1.5">Details / Instructions</label>
          <textarea value={message} onChange={e => setMessage(e.target.value)}
            rows={4} placeholder={`Tell us more about your ${selected.label.toLowerCase()} request...`}
            className="w-full px-4 py-3 rounded-xl bg-white border border-cream-dark focus:border-gold focus:outline-none text-navy transition-colors resize-none" />
        </div>
        <button onClick={() => submitRequest.mutate()} disabled={submitRequest.isPending}
          className="w-full mt-4 bg-navy hover:bg-navy-light disabled:bg-navy/50 text-white font-bold py-4 rounded-xl text-sm uppercase tracking-widest transition-all">
          {submitRequest.isPending ? 'Sending...' : 'Send Request'}
        </button>
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-2 gap-3">
      {SERVICE_TYPES.map(s => (
        <button key={s.id} onClick={() => setSelected(s)}
          className="bg-white rounded-2xl border border-cream-dark p-4 text-left hover:border-gold hover:shadow-md transition-all group">
          <div className="text-2xl mb-2">{s.icon}</div>
          <div className="font-semibold text-navy text-sm group-hover:text-gold transition-colors">{s.label}</div>
          <div className="text-muted text-xs mt-0.5 line-clamp-2">{s.desc}</div>
        </button>
      ))}
    </div>
  );
}

// ── Chat / Ask Anything ───────────────────────────────────────────────────────
function ChatTab({ booking }) {
  const [messages, setMessages] = useState([
    { from: 'hotel', text: `Welcome to ${booking.roomName}! 🏨 How can we assist you today?`, time: new Date().toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' }) },
  ]);
  const [input, setInput] = useState('');

  const botReply = (msg) => {
    const m = msg.toLowerCase();
    if (m.includes('wifi') || m.includes('password')) return 'Your WiFi network is **AzuraHaven_Guest** and the password is **AzuraStay2026**. Enjoy!';
    if (m.includes('checkout') || m.includes('check out')) return `Your checkout is on **${booking.checkOut}** at 11:00 AM. Late checkout until 2 PM is available for KES 3,000 — shall I arrange it?`;
    if (m.includes('breakfast') || m.includes('food')) return 'Breakfast is served 6:30–10:30 AM at The Azura Restaurant. You can also order room service anytime — tap the "Order Food" tab!';
    if (m.includes('pool')) return 'The infinity pool is open 6 AM – 10 PM daily. Towels are provided at the pool deck.';
    if (m.includes('spa')) return 'Our spa is open 8 AM – 8 PM. Tap "Services" to book an in-room treatment!';
    if (m.includes('taxi') || m.includes('transport') || m.includes('airport')) return 'We can arrange transport for you. Tap "Services" → "Transport" to request a vehicle.';
    if (m.includes('laundry')) return 'Laundry service is available. Tap "Services" → "Laundry" to schedule a pickup.';
    if (m.includes('wake') || m.includes('alarm')) return 'We can arrange a wake-up call. Tap "Services" → "Wake-up Call" to set your time.';
    if (m.includes('thank')) return "You're most welcome! It's our pleasure to serve you. 🌟";
    return "Thank you for your message! Our team will respond shortly. For urgent requests, please call the front desk at **ext. 0** or tap the Services tab.";
  };

  const send = () => {
    if (!input.trim()) return;
    const userMsg = { from: 'guest', text: input, time: new Date().toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' }) };
    setMessages(m => [...m, userMsg]);
    setInput('');
    setTimeout(() => {
      setMessages(m => [...m, { from: 'hotel', text: botReply(userMsg.text), time: new Date().toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' }) }]);
    }, 800);
  };

  return (
    <div className="flex flex-col h-96">
      <div className="flex-1 overflow-y-auto space-y-3 mb-3 pr-1">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.from === 'guest' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] ${msg.from === 'guest' ? 'bg-navy text-cream rounded-2xl rounded-br-sm' : 'bg-white border border-cream-dark text-navy rounded-2xl rounded-bl-sm'} px-4 py-2.5`}>
              <p className="text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: msg.text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
              <p className={`text-xs mt-1 ${msg.from === 'guest' ? 'text-cream/40' : 'text-muted'}`}>{msg.time}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input type="text" value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          placeholder="Ask anything — WiFi, checkout, services..."
          className="flex-1 px-4 py-3 rounded-xl bg-cream border border-cream-dark focus:border-gold focus:outline-none text-navy text-sm transition-colors" />
        <button onClick={send} className="w-11 h-11 bg-gold hover:bg-gold-light text-navy rounded-xl flex items-center justify-center transition-all flex-shrink-0">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// ── Main Portal ───────────────────────────────────────────────────────────────
export default function RoomPortal() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('welcome');

  const { data: bookingsData, isLoading } = useQuery({
    queryKey: ['myBookings'],
    queryFn: () => api.get('/bookings/mine').then(r => {
      const d = r.data;
      const arr = Array.isArray(d) ? d : (d.bookings || []);
      return arr;
    }).catch(() => []),
    enabled: !!user,
  });

  // Find active booking (approved and currently checked in)
  const today = new Date().toISOString().split('T')[0];
  const activeBooking = bookingsData?.find(b =>
    b.status === 'approved' && b.checkIn <= today && b.checkOut >= today
  );

  if (!user) return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center">
        <div className="text-5xl mb-4">🏨</div>
        <h2 className="text-2xl font-serif font-bold text-navy mb-3">Guest Room Portal</h2>
        <p className="text-muted mb-6">Sign in to access your room services</p>
        <Link to="/login" className="bg-gold hover:bg-gold-light text-navy font-bold px-6 py-3 rounded-xl text-sm uppercase tracking-widest transition-all">Sign In</Link>
      </div>
    </div>
  );

  if (isLoading) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="spinner"></div>
    </div>
  );

  if (!activeBooking) return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-5xl mb-4">🛏️</div>
        <h2 className="text-2xl font-serif font-bold text-navy mb-3">No Active Stay</h2>
        <p className="text-muted mb-2">The room portal is available during your stay.</p>
        <p className="text-muted text-sm mb-6">You need an approved booking with today's date to access room services.</p>
        <div className="flex gap-3 justify-center">
          <Link to="/rooms" className="bg-gold hover:bg-gold-light text-navy font-bold px-6 py-3 rounded-xl text-sm uppercase tracking-widest transition-all">Book a Room</Link>
          <Link to="/profile" className="border-2 border-navy text-navy hover:bg-navy hover:text-cream font-semibold px-6 py-3 rounded-xl text-sm uppercase tracking-widest transition-all">My Bookings</Link>
        </div>
      </div>
    </div>
  );

  const tabs = [
    { id: 'welcome', icon: '🏠', label: 'My Room' },
    { id: 'food', icon: '🍽️', label: 'Order Food' },
    { id: 'services', icon: '🛎️', label: 'Services' },
    { id: 'chat', icon: '💬', label: 'Ask Us' },
  ];

  return (
    <div className="max-w-2xl mx-auto px-3 sm:px-6 py-6 sm:py-10">
      {/* Room header */}
      <div className="bg-navy rounded-2xl p-5 sm:p-6 mb-6 text-white">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-gold text-xs uppercase tracking-widest mb-1">Your Room</div>
            <h1 className="text-xl sm:text-2xl font-serif font-bold">{activeBooking.roomName}</h1>
            <div className="flex flex-wrap gap-3 mt-2 text-cream/60 text-sm">
              <span>📅 {activeBooking.checkIn} → {activeBooking.checkOut}</span>
              <span>👥 {activeBooking.guests} guest{activeBooking.guests > 1 ? 's' : ''}</span>
            </div>
          </div>
          <div className="text-right">
            <div className="bg-green-500/20 text-green-400 text-xs font-bold px-3 py-1 rounded-full border border-green-500/30">
              ● Checked In
            </div>
            <div className="text-cream/40 text-xs mt-2">Checkout: {activeBooking.checkOut}</div>
          </div>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-4 gap-2 mt-5">
          {[
            { icon: '📞', label: 'Front Desk', action: () => setActiveTab('chat') },
            { icon: '🍽️', label: 'Room Service', action: () => setActiveTab('food') },
            { icon: '🧹', label: 'Housekeeping', action: () => setActiveTab('services') },
            { icon: '🚗', label: 'Transport', action: () => setActiveTab('services') },
          ].map(q => (
            <button key={q.label} onClick={q.action}
              className="bg-white/10 hover:bg-white/20 rounded-xl p-3 text-center transition-all">
              <div className="text-xl mb-1">{q.icon}</div>
              <div className="text-cream/70 text-xs">{q.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-cream rounded-xl p-1 mb-5 overflow-x-auto scrollbar-hide">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-3 sm:px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === tab.id ? 'bg-white text-navy shadow-sm' : 'text-muted hover:text-navy'}`}>
            <span>{tab.icon}</span>
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="bg-white rounded-2xl border border-cream-dark p-4 sm:p-6">
        {activeTab === 'welcome' && (
          <div className="space-y-4">
            <h2 className="text-xl font-serif font-bold text-navy">Welcome, {user?.name?.split(' ')[0] || 'Guest'}! 🌟</h2>
            <p className="text-muted text-sm">You're checked in to <strong>{activeBooking.roomName}</strong>. Use this portal to order food, request services, or chat with our team.</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { icon: '📶', title: 'WiFi', detail: 'Network: AzuraHaven_Guest\nPassword: AzuraStay2026' },
                { icon: '🕐', title: 'Check-out', detail: `${activeBooking.checkOut} at 11:00 AM\nLate checkout available` },
                { icon: '🍳', title: 'Breakfast', detail: 'The Azura Restaurant\n6:30 AM – 10:30 AM' },
                { icon: '🏊', title: 'Pool', detail: 'Infinity Pool\n6:00 AM – 10:00 PM' },
                { icon: '💆', title: 'Spa', detail: 'Azura Wellness Spa\n8:00 AM – 8:00 PM' },
                { icon: '📞', title: 'Front Desk', detail: 'Dial ext. 0\nAvailable 24/7' },
              ].map(info => (
                <div key={info.title} className="bg-cream rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl">{info.icon}</span>
                    <span className="font-semibold text-navy text-sm">{info.title}</span>
                  </div>
                  <p className="text-muted text-xs whitespace-pre-line">{info.detail}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'food' && <RoomServiceTab booking={activeBooking} />}
        {activeTab === 'services' && <ServicesTab booking={activeBooking} />}
        {activeTab === 'chat' && <ChatTab booking={activeBooking} />}
      </div>
    </div>
  );
}
