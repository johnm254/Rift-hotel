import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';
import Loading from '../../components/Loading';

const mockGuests = [
  { uid: 'u1', name: 'Sarah Kamau', email: 'sarah@email.com', role: 'guest', createdAt: '2026-01-15', bookingCount: 3, totalSpent: 285000 },
  { uid: 'u2', name: 'James Ochieng', email: 'james@email.com', role: 'guest', createdAt: '2026-02-03', bookingCount: 1, totalSpent: 45000 },
  { uid: 'u3', name: 'Amina Hassan', email: 'amina@email.com', role: 'guest', createdAt: '2026-02-20', bookingCount: 2, totalSpent: 130000 },
  { uid: 'u4', name: 'David Mwangi', email: 'david@email.com', role: 'guest', createdAt: '2026-03-01', bookingCount: 4, totalSpent: 520000 },
  { uid: 'u5', name: 'Grace Wanjiku', email: 'grace@email.com', role: 'admin', createdAt: '2025-12-01', bookingCount: 0, totalSpent: 0 },
  { uid: 'u6', name: 'Peter Njoroge', email: 'peter@email.com', role: 'guest', createdAt: '2026-03-15', bookingCount: 1, totalSpent: 89000 },
  { uid: 'u7', name: 'Faith Ndung\'u', email: 'faith@email.com', role: 'guest', createdAt: '2026-04-02', bookingCount: 2, totalSpent: 210000 },
  { uid: 'u8', name: 'Tom Mutua', email: 'tom@email.com', role: 'guest', createdAt: '2026-04-18', bookingCount: 1, totalSpent: 32000 },
];

export default function AdminGuests() {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [selectedGuest, setSelectedGuest] = useState(null);

  const { data: usersData, isLoading } = useQuery({
    queryKey: ['adminGuests'],
    queryFn: () => api.get('/admin/users').then(r => {
      const d = r.data;
      return Array.isArray(d) ? d : (d.users || []);
    }).catch(() => mockGuests),
  });

  const { data: guestBookings } = useQuery({
    queryKey: ['guestBookings', selectedGuest?.uid],
    queryFn: () => api.get(`/bookings?userId=${selectedGuest.uid}`).then(r => {
      const d = r.data;
      return Array.isArray(d) ? d : (d.bookings || []);
    }).catch(() => []),
    enabled: !!selectedGuest,
  });

  const users = usersData || [];

  let filtered = users;
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(u =>
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q)
    );
  }
  if (roleFilter !== 'all') filtered = filtered.filter(u => u.role === roleFilter);

  const totalGuests = users.filter(u => u.role !== 'admin').length;
  const totalAdmins = users.filter(u => u.role === 'admin').length;
  const totalRevenue = users.reduce((s, u) => s + (u.totalSpent || 0), 0);

  if (isLoading) return <Loading />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
        <div>
          <h1 className="text-3xl font-serif font-bold text-navy">Guest Management</h1>
          <p className="text-muted text-sm mt-1">{users.length} registered users</p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-2xl border border-cream-dark p-5 shadow-sm">
          <div className="text-3xl mb-1">👥</div>
          <div className="text-2xl font-bold text-navy">{totalGuests}</div>
          <div className="text-sm text-muted">Total Guests</div>
        </div>
        <div className="bg-white rounded-2xl border border-cream-dark p-5 shadow-sm">
          <div className="text-3xl mb-1">👑</div>
          <div className="text-2xl font-bold text-navy">{totalAdmins}</div>
          <div className="text-sm text-muted">Admins</div>
        </div>
        <div className="bg-white rounded-2xl border border-cream-dark p-5 shadow-sm">
          <div className="text-3xl mb-1">💰</div>
          <div className="text-2xl font-bold text-navy">KES {totalRevenue.toLocaleString()}</div>
          <div className="text-sm text-muted">Total Guest Spend</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input type="text" placeholder="Search by name or email..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-white border border-cream-dark focus:border-gold focus:outline-none text-navy transition-colors" />
        </div>
        <div className="flex gap-2">
          {[['all', 'All'], ['guest', 'Guests'], ['admin', 'Admins']].map(([val, label]) => (
            <button key={val} onClick={() => setRoleFilter(val)}
              className={`px-4 py-3 rounded-xl text-sm font-medium transition-all ${roleFilter === val ? 'bg-navy text-cream' : 'bg-white text-navy/60 border border-cream-dark hover:bg-cream'}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Guest list */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-cream-dark overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-cream-dark bg-cream">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted uppercase tracking-widest">Guest</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted uppercase tracking-widest hidden sm:table-cell">Joined</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted uppercase tracking-widest hidden md:table-cell">Bookings</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted uppercase tracking-widest hidden md:table-cell">Spent</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(u => (
                  <tr key={u.uid}
                    onClick={() => setSelectedGuest(selectedGuest?.uid === u.uid ? null : u)}
                    className={`border-b border-cream-dark last:border-0 cursor-pointer transition-colors ${selectedGuest?.uid === u.uid ? 'bg-gold/5' : 'hover:bg-cream/50'}`}>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gold/20 flex items-center justify-center text-gold font-bold text-sm flex-shrink-0">
                          {u.name?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <div className="font-semibold text-navy text-sm">{u.name}</div>
                          <div className="text-xs text-muted">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-muted hidden sm:table-cell">
                      {new Date(u.createdAt).toLocaleDateString('en-KE', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell">
                      <span className="text-sm font-medium text-navy">{u.bookingCount || 0}</span>
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell">
                      <span className="text-sm font-medium text-gold">KES {(u.totalSpent || 0).toLocaleString()}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${u.role === 'admin' ? 'bg-gold/20 text-gold-dark' : 'bg-cream text-navy/60'}`}>
                        {u.role === 'admin' ? '👑 Admin' : '🏨 Guest'}
                      </span>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={5} className="px-5 py-12 text-center text-muted">No users found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Guest detail panel */}
        <div>
          {selectedGuest ? (
            <div className="bg-white rounded-2xl shadow-sm border border-cream-dark p-6 sticky top-24">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-14 h-14 rounded-full bg-gold/20 flex items-center justify-center text-gold font-bold text-xl">
                  {selectedGuest.name?.[0]?.toUpperCase() || '?'}
                </div>
                <div>
                  <h3 className="font-bold text-navy">{selectedGuest.name}</h3>
                  <p className="text-xs text-muted">{selectedGuest.email}</p>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full mt-1 inline-block ${selectedGuest.role === 'admin' ? 'bg-gold/20 text-gold-dark' : 'bg-cream text-navy/60'}`}>
                    {selectedGuest.role === 'admin' ? '👑 Admin' : '🏨 Guest'}
                  </span>
                </div>
              </div>

              <div className="space-y-3 mb-5">
                {[
                  ['Member since', new Date(selectedGuest.createdAt).toLocaleDateString('en-KE', { month: 'long', year: 'numeric' })],
                  ['Total bookings', selectedGuest.bookingCount || 0],
                  ['Total spent', `KES ${(selectedGuest.totalSpent || 0).toLocaleString()}`],
                ].map(([label, val]) => (
                  <div key={label} className="flex justify-between text-sm">
                    <span className="text-muted">{label}</span>
                    <span className="font-medium text-navy">{val}</span>
                  </div>
                ))}
              </div>

              {/* Recent bookings */}
              <div>
                <h4 className="text-xs font-semibold text-muted uppercase tracking-widest mb-3">Recent Bookings</h4>
                {guestBookings?.length > 0 ? (
                  <div className="space-y-2">
                    {guestBookings.slice(0, 3).map(b => (
                      <div key={b.id} className="bg-cream rounded-xl p-3">
                        <div className="text-sm font-medium text-navy">{b.roomName}</div>
                        <div className="text-xs text-muted">{b.checkIn} → {b.checkOut}</div>
                        <div className="flex justify-between mt-1">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${b.status === 'approved' ? 'bg-green-100 text-green-700' : b.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'}`}>
                            {b.status}
                          </span>
                          <span className="text-xs font-bold text-gold">KES {b.totalPrice?.toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted">No bookings found.</p>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-cream-dark p-8 text-center sticky top-24">
              <div className="text-4xl mb-3">👤</div>
              <p className="text-muted text-sm">Click a guest to view their details and booking history.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
