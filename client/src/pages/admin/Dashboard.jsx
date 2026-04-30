import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';
import Loading from '../../components/Loading';

export default function AdminDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['adminDashboard'],
    queryFn: () => api.get('/admin/dashboard').then(r => r.data),
  });

  const { data: bookings } = useQuery({
    queryKey: ['adminBookings'],
    queryFn: () => api.get('/bookings').then(r => r.data),
  });

  if (isLoading) return <Loading />;

  const pendingBookings = (bookings || []).filter(b => b.status === 'pending').slice(0, 5);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10">
        <div>
          <h1 className="text-3xl font-serif font-bold text-navy">Admin Dashboard</h1>
          <p className="text-muted text-sm mt-1">Manage your hotel operations</p>
        </div>
        <div className="flex gap-3 mt-4 sm:mt-0">
          <Link to="/admin/rooms" className="bg-navy hover:bg-navy-light text-cream px-5 py-2.5 rounded-xl text-sm font-medium transition-all">Rooms</Link>
          <Link to="/admin/meals" className="bg-navy hover:bg-navy-light text-cream px-5 py-2.5 rounded-xl text-sm font-medium transition-all">Meals</Link>
          <Link to="/admin/bookings" className="bg-navy hover:bg-navy-light text-cream px-5 py-2.5 rounded-xl text-sm font-medium transition-all">Bookings</Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <StatCard icon="🛏" label="Total Rooms" value={stats?.rooms || 0} color="bg-blue-50 border-blue-200" />
        <StatCard icon="🍽" label="Menu Items" value={stats?.meals || 0} color="bg-amber-50 border-amber-200" />
        <StatCard icon="📅" label="Total Bookings" value={stats?.bookings || 0} color="bg-green-50 border-green-200" />
        <StatCard icon="💰" label="Revenue" value={`KES ${(stats?.totalRevenue || 0).toLocaleString()}`} color="bg-gold/10 border-gold/30" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        <StatCard icon="⏳" label="Pending" value={stats?.pendingBookings || 0} color="bg-yellow-50 border-yellow-200" />
        <StatCard icon="✅" label="Approved" value={stats?.approvedBookings || 0} color="bg-green-50 border-green-200" />
        <StatCard icon="👥" label="Users" value={stats?.users || 0} color="bg-purple-50 border-purple-200" />
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-lg border border-cream-dark p-6">
          <h2 className="text-lg font-serif font-bold text-navy mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            <QuickAction to="/admin/rooms" icon="➕" label="Add Room" />
            <QuickAction to="/admin/meals" icon="🍽" label="Add Meal" />
            <QuickAction to="/admin/rooms" icon="📷" label="Upload Photos" />
            <QuickAction to="/admin/bookings" icon="📋" label="Review Bookings" />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-cream-dark p-6">
          <h2 className="text-lg font-serif font-bold text-navy mb-4">Pending Bookings</h2>
          {pendingBookings.length === 0 ? (
            <p className="text-muted text-sm py-4">No pending bookings</p>
          ) : (
            <div className="space-y-3">
              {pendingBookings.map(b => (
                <div key={b.id} className="flex items-center justify-between bg-cream rounded-xl p-3">
                  <div>
                    <p className="text-sm font-semibold text-navy">{b.roomName}</p>
                    <p className="text-xs text-muted">{b.userName} · {b.checkIn}</p>
                  </div>
                  <span className="text-xs bg-yellow-100 text-yellow-800 px-2.5 py-1 rounded-full font-medium">Pending</span>
                </div>
              ))}
              <Link to="/admin/bookings" className="block text-center text-gold text-sm font-medium hover:underline mt-3">View all →</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }) {
  return (
    <div className={`${color} border rounded-2xl p-5`}>
      <div className="text-2xl mb-2">{icon}</div>
      <div className="text-2xl font-bold text-navy">{value}</div>
      <div className="text-sm text-muted">{label}</div>
    </div>
  );
}

function QuickAction({ to, icon, label }) {
  return (
    <Link to={to} className="flex items-center gap-3 bg-cream hover:bg-cream-dark rounded-xl p-4 transition-colors">
      <span className="text-xl">{icon}</span>
      <span className="text-navy font-medium text-sm">{label}</span>
    </Link>
  );
}
