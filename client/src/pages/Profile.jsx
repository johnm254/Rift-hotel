import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import Loading from '../components/Loading';

const mockBookings = [
  { id: 'b-1', roomName: 'Presidential Ocean Suite', checkIn: '2026-05-10', checkOut: '2026-05-13', guests: 2, totalPrice: 135000, status: 'approved', paymentStatus: 'paid' },
  { id: 'b-2', roomName: 'Deluxe Garden View', checkIn: '2026-06-01', checkOut: '2026-06-03', guests: 2, totalPrice: 50000, status: 'pending', paymentStatus: 'pending' },
];

function generateInvoiceHTML(booking, user) {
  return `
    <!DOCTYPE html><html><head><meta charset="utf-8">
    <title>Invoice #${booking.id}</title>
    <style>
      body { font-family: Georgia, serif; max-width: 700px; margin: 40px auto; color: #1a2744; }
      .header { border-bottom: 3px solid #C9A96E; padding-bottom: 20px; margin-bottom: 30px; }
      .hotel { font-size: 28px; font-weight: bold; color: #C9A96E; }
      .invoice-title { font-size: 20px; margin-top: 5px; }
      .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0; }
      .label { color: #888; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; }
      .value { font-size: 15px; font-weight: bold; margin-top: 4px; }
      .total-row { border-top: 2px solid #C9A96E; padding-top: 15px; margin-top: 15px; font-size: 20px; }
      .status { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 13px; font-weight: bold; background: #d1fae5; color: #065f46; }
      .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #aaa; text-align: center; }
    </style></head><body>
    <div class="header">
      <div class="hotel">🏨 Azura Haven</div>
      <div class="invoice-title">Booking Invoice</div>
    </div>
    <div class="grid">
      <div><div class="label">Invoice #</div><div class="value">${booking.id.toUpperCase()}</div></div>
      <div><div class="label">Date</div><div class="value">${new Date().toLocaleDateString('en-KE', { year:'numeric', month:'long', day:'numeric' })}</div></div>
      <div><div class="label">Guest</div><div class="value">${user?.name || 'Guest'}</div></div>
      <div><div class="label">Email</div><div class="value">${user?.email || ''}</div></div>
    </div>
    <hr style="border-color:#eee; margin: 20px 0"/>
    <div class="grid">
      <div><div class="label">Room</div><div class="value">${booking.roomName}</div></div>
      <div><div class="label">Status</div><div class="value"><span class="status">${booking.status}</span></div></div>
      <div><div class="label">Check-in</div><div class="value">${booking.checkIn}</div></div>
      <div><div class="label">Check-out</div><div class="value">${booking.checkOut}</div></div>
      <div><div class="label">Guests</div><div class="value">${booking.guests}</div></div>
      <div><div class="label">Payment</div><div class="value">${booking.paymentStatus || 'pending'}</div></div>
    </div>
    <div class="total-row">
      <div class="label">Total Amount</div>
      <div style="font-size:26px; color:#C9A96E; font-weight:bold; margin-top:6px">KES ${booking.totalPrice?.toLocaleString()}</div>
    </div>
    <div class="footer">Azura Haven Hotel · Nairobi, Kenya · reservations@azurahaven.com · +254 700 000 000</div>
    </body></html>
  `;
}

function downloadInvoice(booking, user) {
  const html = generateInvoiceHTML(booking, user);
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `invoice-${booking.id}.html`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function Profile() {
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();
  const [editName, setEditName] = useState(user?.name || '');
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState('');

  const { data: bookingsData, isLoading: bookingsLoading } = useQuery({
    queryKey: ['myBookings'],
    queryFn: () => api.get('/bookings/mine').then(r => {
      // API returns { bookings: [...] } with pagination
      const data = r.data;
      return Array.isArray(data) ? data : (data.bookings || []);
    }).catch(() => mockBookings),
  });

  const bookings = bookingsData || [];

  const updateProfile = useMutation({
    mutationFn: (data) => api.put('/auth/me', data),
    onSuccess: () => {
      queryClient.invalidateQueries(['user']);
      setMessage('Profile updated!');
      setEditing(false);
      setTimeout(() => setMessage(''), 3000);
    },
  });

  const cancelBooking = useMutation({
    mutationFn: (id) => api.delete(`/bookings/${id}`),
    onSuccess: () => queryClient.invalidateQueries(['myBookings']),
  });

  if (bookingsLoading) return <Loading />;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-serif font-bold text-navy mb-8">My Account</h1>

      {/* Profile Card */}
      <div className="bg-white rounded-2xl shadow-lg border border-cream-dark p-6 mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gold/20 flex items-center justify-center text-2xl font-bold text-gold">
            {user?.name?.[0]?.toUpperCase() || '👤'}
          </div>
          <div className="flex-1">
            {editing ? (
              <div className="flex gap-3">
                <input
                  type="text"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="px-4 py-2 rounded-xl bg-cream border border-cream-dark focus:border-gold focus:outline-none text-navy"
                />
                <button
                  onClick={() => updateProfile.mutate({ name: editName })}
                  className="bg-gold hover:bg-gold-light text-navy font-semibold px-4 py-2 rounded-xl text-sm transition-all"
                >
                  Save
                </button>
                <button onClick={() => setEditing(false)} className="text-muted hover:text-navy text-sm transition-colors">
                  Cancel
                </button>
              </div>
            ) : (
              <>
                <h2 className="text-xl font-bold text-navy">{user?.name || 'Guest'}</h2>
                <p className="text-muted text-sm">{user?.email}</p>
              </>
            )}
            {!editing && (
              <p className="text-xs text-muted mt-1">
                {user?.admin || user?.role === 'admin' ? '👑 Admin Account' : '🏨 Guest Account'}
              </p>
            )}
          </div>
          {!editing && (
            <button
              onClick={() => { setEditName(user?.name || ''); setEditing(true); }}
              className="text-gold hover:text-gold-dark text-sm font-medium transition-colors"
            >
              Edit Profile
            </button>
          )}
        </div>
        {message && <p className="text-green-600 text-sm mt-3 font-medium">{message}</p>}
      </div>

      {/* Bookings */}
      <div>
        <h2 className="text-2xl font-serif font-bold text-navy mb-6">My Bookings</h2>
        {bookings.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg border border-cream-dark p-10 text-center">
            <div className="text-4xl mb-4">📅</div>
            <h3 className="text-lg font-bold text-navy mb-2">No bookings yet</h3>
            <p className="text-muted text-sm mb-4">Browse our rooms and book your first stay!</p>
            <a href="/rooms" className="inline-block bg-gold hover:bg-gold-light text-navy font-semibold px-6 py-3 rounded-xl text-sm uppercase tracking-widest transition-all">
              Browse Rooms
            </a>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map(b => (
              <div key={b.id} className="bg-white rounded-2xl shadow-md border border-cream-dark p-5">
                <div className="flex flex-col sm:flex-row justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-bold text-navy text-lg">{b.roomName}</h3>
                    <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted">
                      <span>📅 {b.checkIn} → {b.checkOut}</span>
                      <span>🛏 {b.guests} guest{b.guests > 1 ? 's' : ''}</span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <StatusBadge status={b.status} />
                      {b.paymentStatus && (
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                          b.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {b.paymentStatus === 'paid' ? '💰 Paid' : '⏳ Payment pending'}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <span className="text-gold font-bold text-lg">KES {b.totalPrice?.toLocaleString()}</span>
                    <div className="flex gap-2">
                      {/* Invoice download — available for approved/paid bookings */}
                      {(b.status === 'approved' || b.paymentStatus === 'paid') && (
                        <button
                          onClick={() => downloadInvoice(b, user)}
                          className="flex items-center gap-1.5 text-xs font-semibold text-navy bg-cream hover:bg-cream-dark px-3 py-2 rounded-lg transition-all border border-cream-dark"
                          title="Download Invoice"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Invoice
                        </button>
                      )}
                      {b.status === 'pending' && (
                        <button
                          onClick={() => cancelBooking.mutate(b.id)}
                          className="text-red-500 hover:text-red-700 text-sm font-medium transition-colors"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    'checked-out': 'bg-gray-100 text-gray-700',
  };
  return (
    <span className={`text-xs font-semibold px-3 py-1 rounded-full uppercase ${styles[status] || 'bg-gray-100 text-gray-700'}`}>
      {status}
    </span>
  );
}
