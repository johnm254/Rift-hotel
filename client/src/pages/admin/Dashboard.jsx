import { Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';
import api from '../../lib/api';
import Loading from '../../components/Loading';

// Generate monthly chart data from bookings array
function buildChartData(bookings) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const now = new Date();
  const data = [];

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = months[d.getMonth()] + (d.getFullYear() !== now.getFullYear() ? ` '${String(d.getFullYear()).slice(2)}` : '');
    const monthBookings = bookings.filter(b => {
      const bd = new Date(b.createdAt);
      return bd.getMonth() === d.getMonth() && bd.getFullYear() === d.getFullYear();
    });
    data.push({
      month: label,
      bookings: monthBookings.length,
      revenue: monthBookings.filter(b => b.status !== 'rejected').reduce((s, b) => s + (b.totalPrice || 0), 0),
      approved: monthBookings.filter(b => b.status === 'approved' || b.status === 'checked-out').length,
    });
  }
  return data;
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-navy text-cream rounded-xl p-3 shadow-xl text-sm">
      <p className="font-bold mb-1">{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: {p.name === 'Revenue' ? `KES ${p.value.toLocaleString()}` : p.value}
        </p>
      ))}
    </div>
  );
};

export default function AdminDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['adminDashboard'],
    queryFn: () => api.get('/admin/dashboard').then(r => r.data).catch(() => null),
  });

  const { data: bookingsData } = useQuery({
    queryKey: ['adminBookings'],
    queryFn: () => api.get('/bookings').then(r => {
      const d = r.data;
      return Array.isArray(d) ? d : (d.bookings || []);
    }).catch(() => []),
  });

  const seedData = useMutation({
    mutationFn: () => api.post('/admin/seed'),
    onSuccess: (res) => {
      toast.success(`Seeded: ${res.data.added}${res.data.skipped?.length ? ` · Skipped: ${res.data.skipped.join(', ')}` : ''}`);
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Seed failed'),
  });

  if (isLoading) return <Loading />;

  const bookings = bookingsData || [];
  const pendingBookings = bookings.filter(b => b.status === 'pending').slice(0, 5);
  const chartData = buildChartData(bookings);

  const thisMonth = chartData[chartData.length - 1];
  const lastMonth = chartData[chartData.length - 2];
  const revenueChange = lastMonth?.revenue > 0
    ? Math.round(((thisMonth?.revenue - lastMonth?.revenue) / lastMonth?.revenue) * 100)
    : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10">
        <div>
          <h1 className="text-3xl font-serif font-bold text-navy">Admin Dashboard</h1>
          <p className="text-muted text-sm mt-1">Hotel operations overview</p>
        </div>
        <div className="flex flex-wrap gap-2 mt-4 sm:mt-0">
          <button
            onClick={() => { if (window.confirm('Seed mock rooms and meals into Firestore? Existing data will not be overwritten.')) seedData.mutate(); }}
            disabled={seedData.isPending}
            className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-1.5">
            {seedData.isPending ? (
              <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> Seeding...</>
            ) : '🌱 Seed Data'}
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon="🛏" label="Total Rooms" value={stats?.rooms || 0} sub="Active listings" color="bg-blue-50 border-blue-200" />
        <StatCard icon="🍽" label="Menu Items" value={stats?.meals || 0} sub="Dishes available" color="bg-amber-50 border-amber-200" />
        <StatCard icon="📅" label="Total Bookings" value={stats?.bookings || bookings.length} sub="All time" color="bg-green-50 border-green-200" />
        <StatCard
          icon="💰"
          label="Total Revenue"
          value={`KES ${(stats?.totalRevenue || bookings.filter(b => b.status !== 'rejected').reduce((s, b) => s + (b.totalPrice || 0), 0)).toLocaleString()}`}
          sub="All time"
          color="bg-gold/10 border-gold/30"
        />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon="⏳" label="Pending" value={stats?.pendingBookings || bookings.filter(b => b.status === 'pending').length} sub="Awaiting approval" color="bg-yellow-50 border-yellow-200" />
        <StatCard icon="✅" label="Approved" value={stats?.approvedBookings || bookings.filter(b => b.status === 'approved').length} sub="Confirmed stays" color="bg-green-50 border-green-200" />
        <StatCard icon="🚪" label="Checked Out" value={bookings.filter(b => b.status === 'checked-out').length} sub="Completed stays" color="bg-gray-50 border-gray-200" />
        <StatCard icon="👥" label="Guests" value={stats?.users || 0} sub="Registered users" color="bg-purple-50 border-purple-200" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Revenue chart */}
        <div className="bg-white rounded-2xl shadow-lg border border-cream-dark p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-serif font-bold text-navy">Monthly Revenue</h2>
              <p className="text-xs text-muted mt-0.5">Last 6 months</p>
            </div>
            {revenueChange !== 0 && (
              <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${revenueChange > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                {revenueChange > 0 ? '↑' : '↓'} {Math.abs(revenueChange)}% vs last month
              </span>
            )}
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EBE3D6" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false}
                tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="revenue" name="Revenue" fill="#C9A96E" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Bookings trend */}
        <div className="bg-white rounded-2xl shadow-lg border border-cream-dark p-6">
          <div className="mb-6">
            <h2 className="text-lg font-serif font-bold text-navy">Booking Trends</h2>
            <p className="text-xs text-muted mt-0.5">Total vs approved bookings</p>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData} margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EBE3D6" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="bookings" name="Total" stroke="#1B2A4A" strokeWidth={2} dot={{ r: 4, fill: '#1B2A4A' }} />
              <Line type="monotone" dataKey="approved" name="Approved" stroke="#C9A96E" strokeWidth={2} dot={{ r: 4, fill: '#C9A96E' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Quick actions */}
        <div className="bg-white rounded-2xl shadow-lg border border-cream-dark p-6">
          <h2 className="text-lg font-serif font-bold text-navy mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            <QuickAction to="/admin/rooms" icon="➕" label="Add Room" />
            <QuickAction to="/admin/meals" icon="🍽" label="Add Meal" />
            <QuickAction to="/admin/guests" icon="👥" label="View Guests" />
            <QuickAction to="/admin/bookings" icon="📋" label="Review Bookings" />
          </div>
        </div>

        {/* Pending bookings */}
        <div className="bg-white rounded-2xl shadow-lg border border-cream-dark p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-serif font-bold text-navy">Pending Bookings</h2>
            {pendingBookings.length > 0 && (
              <span className="bg-yellow-100 text-yellow-800 text-xs font-bold px-2.5 py-1 rounded-full">
                {pendingBookings.length} waiting
              </span>
            )}
          </div>
          {pendingBookings.length === 0 ? (
            <div className="text-center py-6">
              <div className="text-3xl mb-2">✅</div>
              <p className="text-muted text-sm">All caught up! No pending bookings.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingBookings.map(b => (
                <div key={b.id} className="flex items-center justify-between bg-cream rounded-xl p-3">
                  <div>
                    <p className="text-sm font-semibold text-navy">{b.roomName}</p>
                    <p className="text-xs text-muted">{b.userName} · {b.checkIn}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gold">KES {b.totalPrice?.toLocaleString()}</span>
                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full font-medium">Pending</span>
                  </div>
                </div>
              ))}
              <Link to="/admin/bookings" className="block text-center text-gold text-sm font-medium hover:underline mt-2">
                Manage all bookings →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, sub, color }) {
  return (
    <div className={`${color} border rounded-2xl p-5`}>
      <div className="text-2xl mb-2">{icon}</div>
      <div className="text-xl font-bold text-navy leading-tight">{value}</div>
      <div className="text-sm font-medium text-navy/70 mt-0.5">{label}</div>
      {sub && <div className="text-xs text-muted mt-0.5">{sub}</div>}
    </div>
  );
}

function QuickAction({ to, icon, label }) {
  return (
    <Link to={to} className="flex items-center gap-3 bg-cream hover:bg-cream-dark rounded-xl p-4 transition-colors group">
      <span className="text-xl">{icon}</span>
      <span className="text-navy font-medium text-sm group-hover:text-gold transition-colors">{label}</span>
    </Link>
  );
}
