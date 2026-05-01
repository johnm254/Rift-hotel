import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import Loading from '../components/Loading';
import { mockMeals } from '../lib/mockData';
import { Link } from 'react-router-dom';

export default function MealOrder() {
  const { user } = useAuth();
  const [cart, setCart] = useState({});
  const [category, setCategory] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [ordered, setOrdered] = useState(false);

  const { data: bookingsData } = useQuery({
    queryKey: ['myBookings'],
    queryFn: () => api.get('/bookings/mine').then(r => {
      const d = r.data;
      const arr = Array.isArray(d) ? d : (d.bookings || []);
      return arr.filter(b => b.status === 'approved');
    }).catch(() => []),
    enabled: !!user,
  });

  const activeBooking = bookingsData?.[0];

  const { data: meals, isLoading } = useQuery({
    queryKey: ['meals', category],
    queryFn: () => {
      const params = category ? `/meals?category=${category}` : '/meals';
      return api.get(params).then(r => {
        const d = r.data;
        const arr = Array.isArray(d) ? d : (d.meals || d.data || []);
        return arr.length > 0 ? arr : mockMeals;
      }).catch(() => mockMeals);
    },
  });

  const categories = [...new Set((meals || []).map(m => m.category).filter(Boolean))];

  const addToCart = (meal) => {
    setCart(prev => ({ ...prev, [meal.id]: { ...meal, qty: (prev[meal.id]?.qty || 0) + 1 } }));
    toast.success(`${meal.name} added to order`);
  };

  const removeFromCart = (id) => {
    setCart(prev => {
      const updated = { ...prev };
      if (updated[id].qty <= 1) delete updated[id];
      else updated[id] = { ...updated[id], qty: updated[id].qty - 1 };
      return updated;
    });
  };

  const cartItems = Object.values(cart);
  const total = cartItems.reduce((s, i) => s + i.price * i.qty, 0);

  const placeOrder = useMutation({
    mutationFn: () => api.post('/orders', {
      items: cartItems.map(i => ({ mealId: i.id, name: i.name, price: i.price, qty: i.qty })),
      bookingId: activeBooking?.id,
      roomNumber: roomNumber || activeBooking?.roomName,
      notes,
      total,
    }).catch(() => ({ data: { id: 'mock-order-' + Date.now() } })),
    onSuccess: () => {
      setOrdered(true);
      setCart({});
    },
    onError: () => toast.error('Order failed. Please try again.'),
  });

  if (!user) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <div className="text-5xl mb-4">🍽️</div>
        <h2 className="text-2xl font-serif font-bold text-navy mb-3">Sign in to Order</h2>
        <p className="text-muted mb-6">Room service is available for signed-in guests.</p>
        <Link to="/login" className="bg-gold hover:bg-gold-light text-navy font-bold px-6 py-3 rounded-xl text-sm uppercase tracking-widest transition-all">Sign In</Link>
      </div>
    </div>
  );

  if (ordered) return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">🎉</div>
        <h2 className="text-2xl font-serif font-bold text-navy mb-3">Order Placed!</h2>
        <p className="text-muted mb-2">Your meal will be delivered to your room within <strong>30–45 minutes</strong>.</p>
        <p className="text-muted text-sm mb-6">Total: <span className="text-gold font-bold">KES {total.toLocaleString()}</span></p>
        <div className="flex gap-3 justify-center">
          <button onClick={() => setOrdered(false)} className="bg-gold hover:bg-gold-light text-navy font-bold px-6 py-3 rounded-xl text-sm uppercase tracking-widest transition-all">Order More</button>
          <Link to="/profile" className="border-2 border-navy text-navy hover:bg-navy hover:text-cream font-semibold px-6 py-3 rounded-xl text-sm uppercase tracking-widest transition-all">My Account</Link>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <section className="hero-gradient py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="text-gold text-sm uppercase tracking-widest font-semibold">Room Service</span>
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-white mt-2 mb-4">Order to Your Room</h1>
          <p className="text-cream/60 max-w-lg mx-auto">Fresh from our kitchen, delivered to your door. Available 6 AM – 11 PM.</p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {activeBooking && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-6 flex items-center gap-3">
            <span className="text-2xl">🏨</span>
            <div>
              <div className="font-semibold text-green-800 text-sm">Active Stay: {activeBooking.roomName}</div>
              <div className="text-green-700 text-xs">{activeBooking.checkIn} → {activeBooking.checkOut}</div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-8">
          {/* Menu */}
          <div className="lg:col-span-2">
            {/* Category filter */}
            <div className="flex flex-wrap gap-2 mb-6">
              <button onClick={() => setCategory('')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${!category ? 'bg-navy text-cream' : 'bg-white text-navy/60 hover:bg-cream border border-cream-dark'}`}>
                All
              </button>
              {categories.map(c => (
                <button key={c} onClick={() => setCategory(c)}
                  className={`px-4 py-2 rounded-full text-sm font-medium capitalize transition-all ${category === c ? 'bg-navy text-cream' : 'bg-white text-navy/60 hover:bg-cream border border-cream-dark'}`}>
                  {c}
                </button>
              ))}
            </div>

            {isLoading ? <Loading /> : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {(meals || []).filter(m => m.available !== false).map(meal => (
                  <div key={meal.id} className="bg-white rounded-2xl border border-cream-dark overflow-hidden shadow-sm hover:shadow-md transition-all group">
                    <div className="h-40 overflow-hidden relative">
                      <img src={meal.photo || 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400'}
                        alt={meal.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      <div className="absolute top-3 left-3">
                        <span className="bg-navy/80 backdrop-blur text-cream text-xs px-2.5 py-1 rounded-full capitalize">{meal.category}</span>
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="font-serif font-bold text-navy text-sm">{meal.name}</h3>
                        <span className="text-gold font-bold text-sm">KES {meal.price?.toLocaleString()}</span>
                      </div>
                      <p className="text-muted text-xs line-clamp-2 mb-3">{meal.description}</p>
                      <div className="flex items-center justify-between">
                        {cart[meal.id] ? (
                          <div className="flex items-center gap-2">
                            <button onClick={() => removeFromCart(meal.id)}
                              className="w-7 h-7 rounded-full bg-cream hover:bg-cream-dark border border-cream-dark flex items-center justify-center text-navy font-bold transition-colors">−</button>
                            <span className="font-bold text-navy w-5 text-center">{cart[meal.id].qty}</span>
                            <button onClick={() => addToCart(meal)}
                              className="w-7 h-7 rounded-full bg-gold hover:bg-gold-light flex items-center justify-center text-navy font-bold transition-colors">+</button>
                          </div>
                        ) : (
                          <button onClick={() => addToCart(meal)}
                            className="bg-gold hover:bg-gold-light text-navy font-semibold px-4 py-1.5 rounded-xl text-xs uppercase tracking-widest transition-all">
                            Add to Order
                          </button>
                        )}
                        {meal.dietary?.length > 0 && (
                          <div className="flex gap-1">
                            {meal.dietary.slice(0, 2).map(d => (
                              <span key={d} className="bg-cream text-navy/50 text-xs px-2 py-0.5 rounded-full capitalize">{d}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Order summary */}
          <div>
            <div className="sticky top-24 bg-white rounded-2xl border border-cream-dark shadow-lg p-6">
              <h3 className="font-serif font-bold text-navy text-lg mb-4">Your Order</h3>

              {cartItems.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-3xl mb-2">🛒</div>
                  <p className="text-muted text-sm">Your order is empty. Add items from the menu.</p>
                </div>
              ) : (
                <>
                  <div className="space-y-3 mb-4">
                    {cartItems.map(item => (
                      <div key={item.id} className="flex justify-between items-center">
                        <div>
                          <div className="text-sm font-medium text-navy">{item.name}</div>
                          <div className="text-xs text-muted">× {item.qty}</div>
                        </div>
                        <span className="text-sm font-bold text-gold">KES {(item.price * item.qty).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                  <hr className="border-cream-dark mb-4" />
                  <div className="flex justify-between font-bold text-navy mb-5">
                    <span>Total</span>
                    <span className="text-gold text-lg">KES {total.toLocaleString()}</span>
                  </div>

                  <div className="space-y-3 mb-5">
                    <div>
                      <label className="block text-xs font-medium text-muted uppercase tracking-widest mb-1">Room / Location</label>
                      <input type="text" value={roomNumber} onChange={e => setRoomNumber(e.target.value)}
                        placeholder={activeBooking?.roomName || 'Room number or name'}
                        className="w-full px-3 py-2.5 rounded-xl bg-cream border border-cream-dark focus:border-gold focus:outline-none text-navy text-sm transition-colors" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-muted uppercase tracking-widest mb-1">Special Instructions</label>
                      <textarea value={notes} onChange={e => setNotes(e.target.value)}
                        rows={2} placeholder="Allergies, preferences..."
                        className="w-full px-3 py-2.5 rounded-xl bg-cream border border-cream-dark focus:border-gold focus:outline-none text-navy text-sm transition-colors resize-none" />
                    </div>
                  </div>

                  <button onClick={() => placeOrder.mutate()} disabled={placeOrder.isPending}
                    className="w-full bg-gold hover:bg-gold-light disabled:bg-gold/50 text-navy font-bold py-3.5 rounded-xl text-sm uppercase tracking-widest transition-all shadow-lg shadow-gold/20">
                    {placeOrder.isPending ? 'Placing Order...' : `Place Order · KES ${total.toLocaleString()}`}
                  </button>
                  <p className="text-center text-xs text-muted mt-2">Delivery in 30–45 minutes</p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
