import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';

const DIRECTION_OPTIONS = [
  { id: 'pickup', label: 'Airport → Hotel', icon: '✈️→🏨', desc: 'We pick you up from the airport' },
  { id: 'dropoff', label: 'Hotel → Airport', icon: '🏨→✈️', desc: 'We drop you off at the airport' },
  { id: 'both', label: 'Both Ways', icon: '✈️⇄🏨', desc: 'Round trip transfer' },
];

export default function AirportTransfer() {
  const { user } = useAuth();
  const [form, setForm] = useState({
    type: 'sedan', direction: 'pickup', flightNumber: '',
    date: '', time: '', passengers: 1, notes: '',
  });
  const [booked, setBooked] = useState(null);

  const { data: vehiclesData } = useQuery({
    queryKey: ['vehicles'],
    queryFn: () => api.get('/transfers/vehicles').then(r => r.data.vehicles || []).catch(() => [
      { id: 'sedan', name: 'Sedan', capacity: 3, price: 4500, description: 'Toyota Corolla or similar' },
      { id: 'suv', name: 'SUV', capacity: 5, price: 6500, description: 'Toyota Prado or similar' },
      { id: 'van', name: 'Minivan', capacity: 8, price: 8500, description: 'Toyota HiAce or similar' },
      { id: 'vip', name: 'VIP Luxury', capacity: 3, price: 12000, description: 'Mercedes E-Class or similar' },
    ]),
  });

  const vehicles = vehiclesData || [];
  const selectedVehicle = vehicles.find(v => v.id === form.type);
  const price = selectedVehicle ? (form.direction === 'both' ? selectedVehicle.price * 2 : selectedVehicle.price) : 0;

  const bookTransfer = useMutation({
    mutationFn: () => api.post('/transfers', { ...form, price }),
    onSuccess: (res) => {
      setBooked(res.data);
      toast.success('Transfer booked successfully!');
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Booking failed'),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.date || !form.time) return toast.error('Please select date and time');
    bookTransfer.mutate();
  };

  if (!user) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <div className="text-5xl mb-4">✈️</div>
        <h2 className="text-2xl font-serif font-bold text-navy mb-3">Sign in to Book Transfer</h2>
        <Link to="/login" className="bg-gold hover:bg-gold-light text-navy font-bold px-6 py-3 rounded-xl text-sm uppercase tracking-widest transition-all">Sign In</Link>
      </div>
    </div>
  );

  if (booked) return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">✅</div>
        <h2 className="text-2xl font-serif font-bold text-navy mb-3">Transfer Booked!</h2>
        <div className="bg-cream rounded-2xl p-5 text-left space-y-2 mb-6">
          {[
            ['Vehicle', booked.vehicle],
            ['Direction', booked.direction === 'both' ? 'Round Trip' : booked.direction === 'pickup' ? 'Airport → Hotel' : 'Hotel → Airport'],
            ['Date', booked.date],
            ['Time', booked.time],
            ['Passengers', booked.passengers],
            ['Flight', booked.flightNumber || 'Not provided'],
          ].map(([label, val]) => (
            <div key={label} className="flex justify-between text-sm">
              <span className="text-muted">{label}</span>
              <span className="font-medium text-navy">{val}</span>
            </div>
          ))}
          <hr className="border-cream-dark" />
          <div className="flex justify-between font-bold text-navy">
            <span>Total</span>
            <span className="text-gold">KES {booked.price?.toLocaleString()}</span>
          </div>
        </div>
        <div className="flex gap-3 justify-center">
          <button onClick={() => setBooked(null)} className="bg-gold hover:bg-gold-light text-navy font-bold px-6 py-3 rounded-xl text-sm uppercase tracking-widest transition-all">Book Another</button>
          <Link to="/profile" className="border-2 border-navy text-navy hover:bg-navy hover:text-cream font-semibold px-6 py-3 rounded-xl text-sm uppercase tracking-widest transition-all">My Account</Link>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <section className="hero-gradient py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="text-gold text-sm uppercase tracking-widest font-semibold">Transport</span>
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-white mt-2 mb-4">Airport Transfer</h1>
          <p className="text-cream/60 max-w-lg mx-auto">Professional, punctual transfers between JKIA / Wilson Airport and Azura Haven. Available 24/7.</p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">

            {/* Direction */}
            <div className="bg-white rounded-2xl border border-cream-dark p-6">
              <h3 className="font-serif font-bold text-navy mb-4">Transfer Direction</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {DIRECTION_OPTIONS.map(d => (
                  <button key={d.id} type="button" onClick={() => setForm(f => ({ ...f, direction: d.id }))}
                    className={`p-4 rounded-xl border-2 text-center transition-all ${form.direction === d.id ? 'border-gold bg-gold/5' : 'border-cream-dark hover:border-gold/40'}`}>
                    <div className="text-2xl mb-1">{d.icon}</div>
                    <div className="text-sm font-bold text-navy">{d.label}</div>
                    <div className="text-xs text-muted mt-0.5">{d.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Vehicle */}
            <div className="bg-white rounded-2xl border border-cream-dark p-6">
              <h3 className="font-serif font-bold text-navy mb-4">Select Vehicle</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {vehicles.map(v => (
                  <button key={v.id} type="button" onClick={() => setForm(f => ({ ...f, type: v.id }))}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${form.type === v.id ? 'border-gold bg-gold/5' : 'border-cream-dark hover:border-gold/40'}`}>
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-bold text-navy">{v.name}</span>
                      <span className="text-gold font-bold text-sm">KES {v.price?.toLocaleString()}</span>
                    </div>
                    <div className="text-xs text-muted">{v.description}</div>
                    <div className="text-xs text-muted mt-1">👥 Up to {v.capacity} passengers</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Details */}
            <div className="bg-white rounded-2xl border border-cream-dark p-6 space-y-4">
              <h3 className="font-serif font-bold text-navy mb-2">Trip Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-navy mb-1.5">Date *</label>
                  <input type="date" required value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 rounded-xl bg-cream border border-cream-dark focus:border-gold focus:outline-none text-navy transition-colors" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-navy mb-1.5">Time *</label>
                  <input type="time" required value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl bg-cream border border-cream-dark focus:border-gold focus:outline-none text-navy transition-colors" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-navy mb-1.5">Flight Number</label>
                  <input type="text" value={form.flightNumber} onChange={e => setForm(f => ({ ...f, flightNumber: e.target.value }))}
                    placeholder="e.g. KQ101"
                    className="w-full px-4 py-3 rounded-xl bg-cream border border-cream-dark focus:border-gold focus:outline-none text-navy transition-colors" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-navy mb-1.5">Passengers</label>
                  <select value={form.passengers} onChange={e => setForm(f => ({ ...f, passengers: Number(e.target.value) }))}
                    className="w-full px-4 py-3 rounded-xl bg-cream border border-cream-dark focus:border-gold focus:outline-none text-navy transition-colors">
                    {[1,2,3,4,5,6,7,8].map(n => <option key={n} value={n}>{n} passenger{n > 1 ? 's' : ''}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-navy mb-1.5">Special Instructions</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  rows={2} placeholder="Child seat needed, extra luggage, meet & greet..."
                  className="w-full px-4 py-3 rounded-xl bg-cream border border-cream-dark focus:border-gold focus:outline-none text-navy transition-colors resize-none" />
              </div>
            </div>
          </div>

          {/* Summary */}
          <div>
            <div className="sticky top-24 bg-white rounded-2xl border border-cream-dark shadow-lg p-6 space-y-4">
              <h3 className="font-serif font-bold text-navy">Booking Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-muted">
                  <span>Vehicle</span>
                  <span className="font-medium text-navy">{selectedVehicle?.name || '—'}</span>
                </div>
                <div className="flex justify-between text-muted">
                  <span>Direction</span>
                  <span className="font-medium text-navy capitalize">{form.direction === 'both' ? 'Round Trip' : form.direction}</span>
                </div>
                {form.date && <div className="flex justify-between text-muted"><span>Date</span><span className="font-medium text-navy">{form.date}</span></div>}
                {form.time && <div className="flex justify-between text-muted"><span>Time</span><span className="font-medium text-navy">{form.time}</span></div>}
              </div>
              <hr className="border-cream-dark" />
              <div className="flex justify-between font-bold text-navy text-lg">
                <span>Total</span>
                <span className="text-gold">KES {price.toLocaleString()}</span>
              </div>
              <button type="submit" disabled={bookTransfer.isPending}
                className="w-full bg-gold hover:bg-gold-light disabled:bg-gold/50 text-navy font-bold py-4 rounded-xl text-sm uppercase tracking-widest transition-all shadow-lg shadow-gold/20">
                {bookTransfer.isPending ? 'Booking...' : 'Book Transfer'}
              </button>
              <div className="text-xs text-muted text-center space-y-1">
                <p>✓ Free cancellation 24h before pickup</p>
                <p>✓ Professional licensed drivers</p>
                <p>✓ Flight tracking included</p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
