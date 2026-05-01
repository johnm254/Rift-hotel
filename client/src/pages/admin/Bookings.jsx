import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import api from '../../lib/api';
import Loading from '../../components/Loading';

export default function AdminBookings() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');

  const { data: bookingsRaw, isLoading } = useQuery({
    queryKey: ['adminBookings', filter],
    queryFn: () => {
      const params = filter ? `/bookings?status=${filter}` : '/bookings';
      return api.get(params).then(r => {
        const d = r.data;
        return Array.isArray(d) ? d : (d.bookings || []);
      }).catch(() => []);
    },
  });

  const bookings = bookingsRaw || [];

  const filtered = search
    ? bookings.filter(b =>
        b.roomName?.toLowerCase().includes(search.toLowerCase()) ||
        b.userName?.toLowerCase().includes(search.toLowerCase()) ||
        b.userEmail?.toLowerCase().includes(search.toLowerCase())
      )
    : bookings;

  const updateStatus = useMutation({
    mutationFn: ({ id, status }) => api.patch(`/bookings/${id}/status`, { status }),
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries(['adminBookings']);
      const msgs = { approved: 'Booking approved ✓', rejected: 'Booking rejected', 'checked-out': 'Guest checked out 🚪' };
      toast.success(msgs[status] || 'Booking updated');
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Update failed'),
  });

  if (isLoading) return <Loading />;

  const pending = bookings.filter(b => b.status === 'pending');
  const approved = bookings.filter(b => b.status === 'approved');
  const rejected = bookings.filter(b => b.status === 'rejected');
  const checkedOut = bookings.filter(b => b.status === 'checked-out');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
        <div>
          <h1 className="text-3xl font-serif font-bold text-navy">Booking Management</h1>
          <p className="text-muted text-sm mt-1">{bookings.length} total · {filtered.length} shown</p>
        </div>
        <button
          onClick={() => window.open('/api/bookings/export', '_blank')}
          className="mt-4 sm:mt-0 flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-all">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Export CSV
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Pending', count: pending.length, val: 'pending', active: 'border-yellow-400 bg-yellow-50', num: 'text-yellow-600' },
          { label: 'Approved', count: approved.length, val: 'approved', active: 'border-green-400 bg-green-50', num: 'text-green-600' },
          { label: 'Rejected', count: rejected.length, val: 'rejected', active: 'border-red-400 bg-red-50', num: 'text-red-600' },
          { label: 'Checked Out', count: checkedOut.length, val: 'checked-out', active: 'border-gray-400 bg-gray-50', num: 'text-gray-600' },
        ].map(s => (
          <button key={s.val} onClick={() => setFilter(filter === s.val ? '' : s.val)}
            className={`rounded-2xl p-5 border-2 text-left transition-all ${filter === s.val ? s.active : 'border-cream-dark bg-white hover:border-gray-300'}`}>
            <div className={`text-3xl font-bold ${s.num}`}>{s.count}</div>
            <div className="text-sm text-muted mt-1">{s.label}</div>
          </button>
        ))}
      </div>

      {/* Search bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input type="text" placeholder="Search by guest name, email or room..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-white border border-cream-dark focus:border-gold focus:outline-none text-navy transition-colors" />
        </div>
        {(filter || search) && (
          <button onClick={() => { setFilter(''); setSearch(''); }}
            className="px-4 py-3 rounded-xl border border-cream-dark text-muted hover:text-navy text-sm font-medium transition-colors whitespace-nowrap">
            Clear ✕
          </button>
        )}
      </div>

      <div className="space-y-4">
        {filtered.map(b => (
          <div key={b.id} className="bg-white rounded-2xl shadow-md border border-cream-dark p-5 hover:shadow-lg transition-shadow">
            <div className="flex flex-col md:flex-row justify-between gap-4">
              <div className="flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="font-bold text-navy text-lg">{b.roomName}</h3>
                  <StatusBadge status={b.status} />
                  {b.paymentStatus === 'paid' && (
                    <span className="bg-green-100 text-green-700 text-xs font-medium px-2.5 py-1 rounded-full">💰 Paid</span>
                  )}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-muted">
                  <div><span className="font-medium text-navy">Guest:</span> {b.userName}</div>
                  <div><span className="font-medium text-navy">Email:</span> {b.userEmail}</div>
                  <div><span className="font-medium text-navy">Check-in:</span> {b.checkIn}</div>
                  <div><span className="font-medium text-navy">Check-out:</span> {b.checkOut}</div>
                  <div><span className="font-medium text-navy">Guests:</span> {b.guests}</div>
                  <div><span className="font-medium text-navy">Total:</span> <span className="text-gold font-bold">KES {b.totalPrice?.toLocaleString()}</span></div>
                  <div><span className="font-medium text-navy">Payment:</span> {b.paymentMethod || 'N/A'}</div>
                  <div><span className="font-medium text-navy">Booked:</span> {new Date(b.createdAt).toLocaleDateString()}</div>
                </div>
                {b.specialRequests && (
                  <p className="text-sm text-muted italic bg-cream rounded-lg p-3">💬 {b.specialRequests}</p>
                )}
              </div>
              <div className="flex gap-2 items-start md:flex-col">
                {b.status === 'pending' && (<>
                  <button onClick={() => updateStatus.mutate({ id: b.id, status: 'approved' })}
                    disabled={updateStatus.isPending}
                    className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap">
                    ✓ Approve
                  </button>
                  <button onClick={() => updateStatus.mutate({ id: b.id, status: 'rejected' })}
                    disabled={updateStatus.isPending}
                    className="bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap">
                    ✕ Reject
                  </button>
                </>)}
                {b.status === 'approved' && (
                  <button onClick={() => { if (window.confirm(`Check out ${b.userName} from ${b.roomName}?`)) updateStatus.mutate({ id: b.id, status: 'checked-out' }); }}
                    disabled={updateStatus.isPending}
                    className="bg-navy hover:bg-navy-light disabled:bg-navy/40 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap">
                    🚪 Check Out
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-16 bg-white rounded-2xl border border-cream-dark">
            <div className="text-4xl mb-3">📋</div>
            <p className="text-muted">No bookings found{filter || search ? ' matching your filters' : ''}.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = { pending: 'bg-yellow-100 text-yellow-800', approved: 'bg-green-100 text-green-800', rejected: 'bg-red-100 text-red-800', 'checked-out': 'bg-gray-100 text-gray-700' };
  return <span className={`text-xs font-semibold px-3 py-1 rounded-full uppercase ${styles[status] || 'bg-gray-100 text-gray-700'}`}>{status}</span>;
}

export default function AdminBookings() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('');
  const [message, setMessage] = useState('');

  const { data: bookingsRaw, isLoading } = useQuery({
    queryKey: ['adminBookings', filter],
    queryFn: () => {
      const params = filter ? `/bookings?status=${filter}` : '/bookings';
      return api.get(params).then(r => {
        const d = r.data;
        return Array.isArray(d) ? d : (d.bookings || []);
      }).catch(() => []);
    },
  });

  const bookings = bookingsRaw || [];

  const updateStatus = useMutation({
    mutationFn: ({ id, status }) => api.patch(`/bookings/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries(['adminBookings']);
      setMessage('Booking updated!');
      setTimeout(() => setMessage(''), 3000);
    },
    onError: (err) => setMessage('Error: ' + (err.response?.data?.error || 'Update failed'))
  });

  if (isLoading) return <Loading />;

  const pending = bookings.filter(b => b.status === 'pending');
  const approved = bookings.filter(b => b.status === 'approved');
  const rejected = bookings.filter(b => b.status === 'rejected');
  const checkedOut = bookings.filter(b => b.status === 'checked-out');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
        <div>
          <h1 className="text-3xl font-serif font-bold text-navy">Booking Management</h1>
          <p className="text-muted text-sm mt-1">{bookings.length} total bookings</p>
        </div>
      </div>

      {message && (
        <div className={`mb-6 px-4 py-3 rounded-xl text-sm font-medium ${message.includes('Error') ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
          {message}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <button onClick={() => setFilter('pending')}
          className={`rounded-2xl p-5 border-2 text-left transition-all ${filter === 'pending' ? 'border-yellow-400 bg-yellow-50' : 'border-cream-dark bg-white hover:border-yellow-300'}`}>
          <div className="text-3xl font-bold text-yellow-600">{pending.length}</div>
          <div className="text-sm text-muted mt-1">Pending</div>
        </button>
        <button onClick={() => setFilter('approved')}
          className={`rounded-2xl p-5 border-2 text-left transition-all ${filter === 'approved' ? 'border-green-400 bg-green-50' : 'border-cream-dark bg-white hover:border-green-300'}`}>
          <div className="text-3xl font-bold text-green-600">{approved.length}</div>
          <div className="text-sm text-muted mt-1">Approved</div>
        </button>
        <button onClick={() => setFilter('rejected')}
          className={`rounded-2xl p-5 border-2 text-left transition-all ${filter === 'rejected' ? 'border-red-400 bg-red-50' : 'border-cream-dark bg-white hover:border-red-300'}`}>
          <div className="text-3xl font-bold text-red-600">{rejected.length}</div>
          <div className="text-sm text-muted mt-1">Rejected</div>
        </button>
        <button onClick={() => setFilter('checked-out')}
          className={`rounded-2xl p-5 border-2 text-left transition-all ${filter === 'checked-out' ? 'border-gray-400 bg-gray-50' : 'border-cream-dark bg-white hover:border-gray-300'}`}>
          <div className="text-3xl font-bold text-gray-600">{checkedOut.length}</div>
          <div className="text-sm text-muted mt-1">Checked Out</div>
        </button>
      </div>

      {filter && (
        <button onClick={() => setFilter('')} className="mb-4 text-gold hover:text-gold-dark text-sm font-medium transition-colors">
          ← Show all
        </button>
      )}

      <div className="space-y-4">
        {bookings.map(b => (
          <div key={b.id} className="bg-white rounded-2xl shadow-md border border-cream-dark p-5 hover:shadow-lg transition-shadow">
            <div className="flex flex-col md:flex-row justify-between gap-4">
              <div className="flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="font-bold text-navy text-lg">{b.roomName}</h3>
                  <StatusBadge status={b.status} />
                  {b.paymentStatus === 'paid' && (
                    <span className="bg-green-100 text-green-700 text-xs font-medium px-2.5 py-1 rounded-full">💰 Paid</span>
                  )}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-muted">
                  <div><span className="font-medium text-navy">Guest:</span> {b.userName}</div>
                  <div><span className="font-medium text-navy">Email:</span> {b.userEmail}</div>
                  <div><span className="font-medium text-navy">Check-in:</span> {b.checkIn}</div>
                  <div><span className="font-medium text-navy">Check-out:</span> {b.checkOut}</div>
                  <div><span className="font-medium text-navy">Guests:</span> {b.guests}</div>
                  <div><span className="font-medium text-navy">Total:</span> <span className="text-gold font-bold">KES {b.totalPrice?.toLocaleString()}</span></div>
                  <div><span className="font-medium text-navy">Payment:</span> {b.paymentMethod || 'N/A'}</div>
                  <div><span className="font-medium text-navy">Booked:</span> {new Date(b.createdAt).toLocaleDateString()}</div>
                </div>
                {b.specialRequests && (
                  <p className="text-sm text-muted italic bg-cream rounded-lg p-3">
                    💬 {b.specialRequests}
                  </p>
                )}
              </div>

              <div className="flex gap-2 items-start md:flex-col">
                {b.status === 'pending' && (<>
                  <button onClick={() => updateStatus.mutate({ id: b.id, status: 'approved' })}
                    disabled={updateStatus.isPending}
                    className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap">
                    ✓ Approve
                  </button>
                  <button onClick={() => updateStatus.mutate({ id: b.id, status: 'rejected' })}
                    disabled={updateStatus.isPending}
                    className="bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap">
                    ✕ Reject
                  </button>
                </>)}
                {b.status === 'approved' && (
                  <button
                    onClick={() => {
                      if (window.confirm(`Check out ${b.userName} from ${b.roomName}?`)) {
                        updateStatus.mutate({ id: b.id, status: 'checked-out' });
                      }
                    }}
                    disabled={updateStatus.isPending}
                    className="bg-navy hover:bg-navy-light disabled:bg-navy/40 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap">
                    🚪 Check Out
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
        {bookings.length === 0 && (
          <div className="text-center py-16 bg-white rounded-2xl border border-cream-dark">
            <div className="text-4xl mb-3">📋</div>
            <p className="text-muted">No bookings found{filter ? ` with status "${filter}"` : ''}.</p>
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
