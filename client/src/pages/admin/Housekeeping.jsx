import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import api from '../../lib/api';
import Loading from '../../components/Loading';

const STATUS_CONFIG = {
  dirty:        { label: 'Dirty',       color: 'bg-red-100 text-red-700 border-red-200',     dot: 'bg-red-500',    icon: '🔴' },
  'in-progress':{ label: 'In Progress', color: 'bg-yellow-100 text-yellow-700 border-yellow-200', dot: 'bg-yellow-500', icon: '🟡' },
  clean:        { label: 'Clean',       color: 'bg-green-100 text-green-700 border-green-200',  dot: 'bg-green-500',  icon: '🟢' },
  inspected:    { label: 'Inspected',   color: 'bg-blue-100 text-blue-700 border-blue-200',    dot: 'bg-blue-500',   icon: '🔵' },
};

const STATUSES = Object.keys(STATUS_CONFIG);

export default function Housekeeping() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [notes, setNotes] = useState('');
  const [assignedName, setAssignedName] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['housekeeping'],
    queryFn: () => api.get('/housekeeping').then(r => r.data.rooms || []).catch(() => []),
    refetchInterval: 30000, // auto-refresh every 30s
  });

  const rooms = data || [];

  const updateStatus = useMutation({
    mutationFn: ({ roomId, status, notes, assignedName }) =>
      api.patch(`/housekeeping/${roomId}`, { status, notes, assignedName }),
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries(['housekeeping']);
      toast.success(`Room marked as ${STATUS_CONFIG[status]?.label}`);
      setSelectedRoom(null);
    },
    onError: () => toast.error('Failed to update status'),
  });

  const filtered = rooms.filter(r => {
    if (filter !== 'all' && r.status !== filter) return false;
    if (search && !r.name?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const counts = STATUSES.reduce((acc, s) => {
    acc[s] = rooms.filter(r => r.status === s).length;
    return acc;
  }, {});

  if (isLoading) return <Loading />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
        <div>
          <h1 className="text-3xl font-serif font-bold text-navy">Housekeeping</h1>
          <p className="text-muted text-sm mt-1">{rooms.length} rooms · Auto-refreshes every 30s</p>
        </div>
        <div className="flex items-center gap-2 mt-4 sm:mt-0">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-xs text-muted">Live</span>
        </div>
      </div>

      {/* Status summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {STATUSES.map(s => {
          const cfg = STATUS_CONFIG[s];
          return (
            <button key={s} onClick={() => setFilter(filter === s ? 'all' : s)}
              className={`rounded-2xl p-5 border-2 text-left transition-all ${filter === s ? cfg.color + ' border-current' : 'border-cream-dark bg-white hover:border-gray-300'}`}>
              <div className="flex items-center gap-2 mb-1">
                <div className={`w-3 h-3 rounded-full ${cfg.dot}`} />
                <span className="text-xs font-semibold uppercase tracking-widest text-muted">{cfg.label}</span>
              </div>
              <div className="text-3xl font-bold text-navy">{counts[s] || 0}</div>
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input type="text" placeholder="Search rooms..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-white border border-cream-dark focus:border-gold focus:outline-none text-navy transition-colors" />
        </div>
        {filter !== 'all' && (
          <button onClick={() => setFilter('all')} className="px-4 py-3 rounded-xl border border-cream-dark text-muted hover:text-navy text-sm transition-colors">
            Clear ✕
          </button>
        )}
      </div>

      {/* Room grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(room => {
          const cfg = STATUS_CONFIG[room.status] || STATUS_CONFIG.clean;
          return (
            <div key={room.id} className="bg-white rounded-2xl border border-cream-dark shadow-sm hover:shadow-md transition-all overflow-hidden">
              {/* Room photo */}
              <div className="relative h-36 overflow-hidden">
                <img
                  src={room.photo ? (typeof room.photo === 'string' ? room.photo : room.photo.thumb) : 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=400'}
                  alt={room.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-navy/40 to-transparent" />
                <div className="absolute top-3 right-3">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${cfg.color}`}>{cfg.icon} {cfg.label}</span>
                </div>
              </div>

              <div className="p-4">
                <h3 className="font-bold text-navy mb-1">{room.name}</h3>
                {room.assignedName && (
                  <p className="text-xs text-muted mb-2">👤 Assigned to: <span className="font-medium text-navy">{room.assignedName}</span></p>
                )}
                {room.notes && (
                  <p className="text-xs text-muted italic mb-2 line-clamp-1">📝 {room.notes}</p>
                )}
                {room.updatedAt && (
                  <p className="text-xs text-muted mb-3">
                    Updated {new Date(room.updatedAt).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                )}

                {/* Quick status buttons */}
                <div className="flex flex-wrap gap-1.5">
                  {STATUSES.map(s => (
                    <button key={s} onClick={() => {
                      if (s === room.status) return;
                      if (s === 'in-progress' || s === 'inspected') {
                        setSelectedRoom(room);
                        setNotes(room.notes || '');
                        setAssignedName(room.assignedName || '');
                      } else {
                        updateStatus.mutate({ roomId: room.id, status: s });
                      }
                    }}
                      className={`text-xs px-2.5 py-1.5 rounded-lg font-medium transition-all border ${
                        s === room.status
                          ? STATUS_CONFIG[s].color + ' border-current'
                          : 'bg-cream text-navy/60 border-cream-dark hover:bg-cream-dark'
                      }`}>
                      {STATUS_CONFIG[s].icon} {STATUS_CONFIG[s].label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="col-span-3 text-center py-16 bg-white rounded-2xl border border-cream-dark">
            <div className="text-4xl mb-3">🧹</div>
            <p className="text-muted">No rooms match your filter.</p>
          </div>
        )}
      </div>

      {/* Assignment modal */}
      {selectedRoom && (
        <div className="fixed inset-0 bg-navy/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedRoom(null)}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h3 className="font-serif font-bold text-navy text-lg mb-4">Update: {selectedRoom.name}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted uppercase tracking-widest mb-1.5">Assign to Staff</label>
                <input type="text" value={assignedName} onChange={e => setAssignedName(e.target.value)}
                  placeholder="Staff member name"
                  className="w-full px-4 py-3 rounded-xl bg-cream border border-cream-dark focus:border-gold focus:outline-none text-navy text-sm transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted uppercase tracking-widest mb-1.5">Notes</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)}
                  rows={3} placeholder="Special instructions, issues found..."
                  className="w-full px-4 py-3 rounded-xl bg-cream border border-cream-dark focus:border-gold focus:outline-none text-navy text-sm transition-colors resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                {STATUSES.map(s => (
                  <button key={s} onClick={() => updateStatus.mutate({ roomId: selectedRoom.id, status: s, notes, assignedName })}
                    disabled={updateStatus.isPending}
                    className={`py-3 rounded-xl text-sm font-semibold border-2 transition-all ${STATUS_CONFIG[s].color}`}>
                    {STATUS_CONFIG[s].icon} {STATUS_CONFIG[s].label}
                  </button>
                ))}
              </div>
              <button onClick={() => setSelectedRoom(null)} className="w-full text-muted hover:text-navy text-sm transition-colors py-2">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
