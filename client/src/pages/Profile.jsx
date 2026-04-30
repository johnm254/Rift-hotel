import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import Loading from '../components/Loading';

export default function Profile() {
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();
  const [editName, setEditName] = useState(user?.name || '');
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState('');

  const { data: bookings, isLoading: bookingsLoading } = useQuery({
    queryKey: ['myBookings'],
    queryFn: () => api.get('/bookings/mine').then(r => r.data),
  });

  const updateProfile = useMutation({
    mutationFn: (data) => api.put('/auth/me', data),
    onSuccess: () => {
      queryClient.invalidateQueries(['user']);
      setMessage('Profile updated!');
      setEditing(false);
    },
  });

  const cancelBooking = useMutation({
    mutationFn: (id) => api.delete(`/bookings/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['myBookings']);
    },
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
                <button
                  onClick={() => setEditing(false)}
                  className="text-muted hover:text-navy text-sm transition-colors"
                >
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
        {message && (
          <p className="text-green-600 text-sm mt-3 font-medium">{message}</p>
        )}
      </div>

      {/* Bookings */}
      <div>
        <h2 className="text-2xl font-serif font-bold text-navy mb-6">My Bookings</h2>
        {bookings?.length === 0 ? (
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
            {bookings?.map(b => (
              <div key={b.id} className="bg-white rounded-2xl shadow-md border border-cream-dark p-5 flex flex-col sm:flex-row justify-between gap-4">
                <div>
                  <h3 className="font-bold text-navy text-lg">{b.roomName}</h3>
                  <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted">
                    <span>📅 {b.checkIn} → {b.checkOut}</span>
                    <span>🛏 {b.guests} guest{b.guests > 1 ? 's' : ''}</span>
                  </div>
                  <div className="mt-2">
                    <StatusBadge status={b.status} />
                    {b.paymentStatus && (
                      <span className={`ml-2 text-xs font-medium px-2.5 py-1 rounded-full ${
                        b.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {b.paymentStatus === 'paid' ? '💰 Paid' : '⏳ Payment pending'}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-gold font-bold">KES {b.totalPrice?.toLocaleString()}</span>
                  {b.status === 'pending' && (
                    <button
                      onClick={() => cancelBooking.mutate(b.id)}
                      className="text-red-500 hover:text-red-700 text-sm font-medium transition-colors"
                    >
                      Cancel
                    </button>
                  )}</div>
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
  };
  return (
    <span className={`text-xs font-semibold px-3 py-1 rounded-full uppercase ${styles[status] || 'bg-gray-100 text-gray-700'}`}>
      {status}
    </span>
  );
}
