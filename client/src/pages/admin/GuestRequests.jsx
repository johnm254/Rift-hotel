import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import api from '../../lib/api';
import Loading from '../../components/Loading';

const STATUS_COLORS = {
  received:   'bg-yellow-100 text-yellow-800',
  preparing:  'bg-blue-100 text-blue-800',
  'on-the-way': 'bg-purple-100 text-purple-800',
  delivered:  'bg-green-100 text-green-800',
  completed:  'bg-green-100 text-green-800',
  cancelled:  'bg-red-100 text-red-800',
};

const STAFF_ROLES = [
  'Housekeeping', 'Room Service', 'Maintenance', 'Concierge',
  'Spa Team', 'Kitchen', 'Front Desk', 'Security',
];

export default function GuestRequests() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [assignModal, setAssignModal] = useState(null);
  const [assignee, setAssignee] = useState('');
  const [assignNote, setAssignNote] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['adminOrders'],
    queryFn: () => api.get('/orders').then(r => {
      const d = r.data;
      return Array.isArray(d) ? d : (d.orders || []);
    }).catch(() => []),
    refetchInterval: 30000, // auto-refresh every 30s
  });

  const orders = data || [];

  const updateStatus = useMutation({
    mutationFn: ({ id, status }) => api.patch(`/orders/${id}/status`, { status }),
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries(['adminOrders']);
      toast.success(`Request marked as ${status}`);
    },
    onError: () => toast.error('Failed to update status'),
  });

  const assignRequest = useMutation({
    mutationFn: ({ id, assignee, note }) => api.patch(`/orders/${id}/status`, {
      status: 'preparing',
      assignedTo: assignee,
      assignNote: note,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['adminOrders']);
      toast.success(`Assigned to ${assignee}`);
      setAssignModal(null);
      setAssignee('');
      setAssignNote('');
    },
    onError: () => toast.error('Failed to assign'),
  });

  // Filter
  const filtered = orders.filter(o => {
    if (filter !== 'all' && o.status !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return o.roomNumber?.toLowerCase().includes(q) ||
        o.userName?.toLowerCase().includes(q) ||
        o.notes?.toLowerCase().includes(q);
    }
    return true;
  });

  const counts = {
    all: orders.length,
    received: orders.filter(o => o.status === 'received').length,
    preparing: orders.filter(o => o.status === 'preparing').length,
    'on-the-way': orders.filter(o => o.status === 'on-the-way').length,
    delivered: orders.filter(o => o.status === 'delivered' || o.status === 'completed').length,
  };

  const isServiceRequest = (order) => order.type === 'service' || order.total === 0;

  if (isLoading) return <Loading />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
        <div>
          <h1 className="text-3xl font-serif font-bold text-navy">Guest Requests</h1>
          <p className="text-muted text-sm mt-1">{orders.length} total · Auto-refreshes every 30s</p>
        </div>
        <div className="flex items-center gap-2 mt-4 sm:mt-0">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-xs text-muted">Live</span>
        </div>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
        {[
          { key: 'all', label: 'All' },
          { key: 'received', label: '🔔 New' },
          { key: 'preparing', label: '⚙️ In Progress' },
          { key: 'on-the-way', label: '🚶 On the Way' },
          { key: 'delivered', label: '✅ Done' },
        ].map(tab => (
          <button key={tab.key} onClick={() => setFilter(tab.key)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all ${filter === tab.key ? 'bg-navy text-cream' : 'bg-white text-navy/60 border border-cream-dark hover:bg-cream'}`}>
            {tab.label}
            {counts[tab.key] > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${filter === tab.key ? 'bg-gold text-navy' : 'bg-cream-dark text-navy/60'}`}>
                {counts[tab.key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input type="text" placeholder="Search by room, guest, or request..." value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-xl bg-white border border-cream-dark focus:border-gold focus:outline-none text-navy transition-colors" />
      </div>

      {/* Requests list */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-cream-dark">
            <div className="text-4xl mb-3">{filter === 'received' ? '🔔' : '✅'}</div>
            <p className="text-muted">{filter === 'received' ? 'No new requests' : 'No requests found'}</p>
          </div>
        ) : filtered.map(order => (
          <div key={order.id} className={`bg-white rounded-2xl border-2 p-5 transition-all hover:shadow-md ${order.status === 'received' ? 'border-yellow-300' : 'border-cream-dark'}`}>
            <div className="flex flex-col sm:flex-row justify-between gap-4">
              <div className="flex-1">
                {/* Header */}
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="text-lg">{isServiceRequest(order) ? '🛎️' : '🍽️'}</span>
                  <h3 className="font-bold text-navy">
                    {isServiceRequest(order) ? 'Service Request' : 'Room Service Order'}
                  </h3>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full uppercase ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-700'}`}>
                    {order.status}
                  </span>
                  {order.assignedTo && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full font-medium">
                      👤 {order.assignedTo}
                    </span>
                  )}
                </div>

                {/* Room & time */}
                <div className="flex flex-wrap gap-3 text-sm text-muted mb-2">
                  <span>🏨 {order.roomNumber || 'Unknown Room'}</span>
                  <span>👤 {order.userName || 'Guest'}</span>
                  <span>🕐 {new Date(order.createdAt).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })}</span>
                  {order.total > 0 && <span className="text-gold font-bold">KES {order.total?.toLocaleString()}</span>}
                </div>

                {/* Items */}
                {order.items?.length > 0 && (
                  <div className="bg-cream rounded-xl p-3 mb-2">
                    {order.items.map((item, i) => (
                      <div key={i} className="flex justify-between text-sm">
                        <span className="text-navy">{item.name} {item.qty > 1 ? `× ${item.qty}` : ''}</span>
                        {item.price > 0 && <span className="text-gold font-medium">KES {(item.price * item.qty).toLocaleString()}</span>}
                      </div>
                    ))}
                  </div>
                )}

                {/* Notes */}
                {order.notes && (
                  <p className="text-sm text-muted italic bg-cream rounded-lg px-3 py-2">
                    💬 {order.notes}
                  </p>
                )}

                {order.assignNote && (
                  <p className="text-xs text-blue-600 mt-1">📋 Staff note: {order.assignNote}</p>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2 flex-shrink-0">
                {order.status === 'received' && (
                  <>
                    <button onClick={() => setAssignModal(order)}
                      className="bg-navy hover:bg-navy-light text-cream px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap">
                      👤 Assign
                    </button>
                    <button onClick={() => updateStatus.mutate({ id: order.id, status: 'preparing' })}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap">
                      ⚙️ Start
                    </button>
                  </>
                )}
                {order.status === 'preparing' && (
                  <button onClick={() => updateStatus.mutate({ id: order.id, status: 'on-the-way' })}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap">
                    🚶 On the Way
                  </button>
                )}
                {order.status === 'on-the-way' && (
                  <button onClick={() => updateStatus.mutate({ id: order.id, status: 'delivered' })}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap">
                    ✅ Delivered
                  </button>
                )}
                {(order.status === 'delivered' || order.status === 'completed') && (
                  <span className="text-green-600 text-sm font-medium text-center">✅ Done</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Assign modal */}
      {assignModal && (
        <div className="fixed inset-0 bg-navy/50 z-50 flex items-center justify-center p-4" onClick={() => setAssignModal(null)}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h3 className="font-serif font-bold text-navy text-lg mb-1">Assign Request</h3>
            <p className="text-muted text-sm mb-4">
              {assignModal.roomNumber} — {assignModal.items?.[0]?.name || 'Service Request'}
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-navy mb-2">Assign to Department / Staff</label>
                <div className="grid grid-cols-2 gap-2">
                  {STAFF_ROLES.map(role => (
                    <button key={role} onClick={() => setAssignee(role)}
                      className={`py-2.5 px-3 rounded-xl text-sm font-medium transition-all border-2 ${assignee === role ? 'border-gold bg-gold/10 text-navy' : 'border-cream-dark text-muted hover:border-gold/40'}`}>
                      {role}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-navy mb-1.5">Instructions for Staff</label>
                <textarea value={assignNote} onChange={e => setAssignNote(e.target.value)}
                  rows={3} placeholder="Any special instructions..."
                  className="w-full px-4 py-3 rounded-xl bg-cream border border-cream-dark focus:border-gold focus:outline-none text-navy text-sm transition-colors resize-none" />
              </div>
              <div className="flex gap-3">
                <button onClick={() => assignRequest.mutate({ id: assignModal.id, assignee, note: assignNote })}
                  disabled={!assignee || assignRequest.isPending}
                  className="flex-1 bg-navy hover:bg-navy-light disabled:bg-navy/50 text-white font-bold py-3 rounded-xl text-sm transition-all">
                  {assignRequest.isPending ? 'Assigning...' : 'Assign & Start'}
                </button>
                <button onClick={() => setAssignModal(null)}
                  className="px-4 py-3 rounded-xl border border-cream-dark text-muted hover:text-navy text-sm transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
