
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import api from '../../lib/api';
import Loading from '../../components/Loading';

// ── Constants ─────────────────────────────────────────────────────────────────
const DEPARTMENTS = [
  { id: 'Housekeeping',  icon: '🧹', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  { id: 'Kitchen',       icon: '👨‍🍳', color: 'bg-orange-100 text-orange-800 border-orange-200' },
  { id: 'Room Service',  icon: '🛎️', color: 'bg-purple-100 text-purple-800 border-purple-200' },
  { id: 'Maintenance',   icon: '🔧', color: 'bg-red-100 text-red-800 border-red-200' },
  { id: 'Concierge',     icon: '🎩', color: 'bg-gold/20 text-yellow-800 border-yellow-200' },
  { id: 'Security',      icon: '🛡️', color: 'bg-gray-100 text-gray-800 border-gray-200' },
  { id: 'Spa Team',      icon: '💆', color: 'bg-pink-100 text-pink-800 border-pink-200' },
  { id: 'Front Desk',    icon: '🏨', color: 'bg-teal-100 text-teal-800 border-teal-200' },
  { id: 'Management',    icon: '👔', color: 'bg-navy/10 text-navy border-navy/20' },
];

const STATUS_CONFIG = {
  active:   { label: 'Active',    color: 'bg-green-100 text-green-700',  dot: 'bg-green-500' },
  off:      { label: 'Off Duty',  color: 'bg-gray-100 text-gray-600',    dot: 'bg-gray-400' },
  leave:    { label: 'On Leave',  color: 'bg-yellow-100 text-yellow-700', dot: 'bg-yellow-500' },
};

const MOCK_STAFF = [
  { id: 's1', name: 'Mary Wanjiku',   role: 'Head Housekeeper',    department: 'Housekeeping', phone: '0712000001', email: 'mary@azurahaven.com',   isLeader: true,  status: 'active', assignedTasks: 3 },
  { id: 's2', name: 'John Kamau',     role: 'Housekeeper',         department: 'Housekeeping', phone: '0712000002', email: 'john@azurahaven.com',   isLeader: false, status: 'active', assignedTasks: 2 },
  { id: 's3', name: 'Chef Ali Hassan',role: 'Executive Chef',      department: 'Kitchen',      phone: '0712000003', email: 'ali@azurahaven.com',    isLeader: true,  status: 'active', assignedTasks: 5 },
  { id: 's4', name: 'Grace Otieno',   role: 'Sous Chef',           department: 'Kitchen',      phone: '0712000004', email: 'grace@azurahaven.com',  isLeader: false, status: 'active', assignedTasks: 4 },
  { id: 's5', name: 'Peter Njoroge',  role: 'Room Service Lead',   department: 'Room Service', phone: '0712000005', email: 'peter@azurahaven.com',  isLeader: true,  status: 'active', assignedTasks: 6 },
  { id: 's6', name: 'Faith Ndungu',   role: 'Room Attendant',      department: 'Room Service', phone: '0712000006', email: 'faith@azurahaven.com',  isLeader: false, status: 'off',    assignedTasks: 0 },
  { id: 's7', name: 'James Ochieng',  role: 'Chief Engineer',      department: 'Maintenance',  phone: '0712000007', email: 'james@azurahaven.com',  isLeader: true,  status: 'active', assignedTasks: 2 },
  { id: 's8', name: 'David Mwangi',   role: 'Head Concierge',      department: 'Concierge',    phone: '0712000008', email: 'david@azurahaven.com',  isLeader: true,  status: 'active', assignedTasks: 1 },
  { id: 's9', name: 'Amina Hassan',   role: 'Security Supervisor', department: 'Security',     phone: '0712000009', email: 'amina@azurahaven.com',  isLeader: true,  status: 'active', assignedTasks: 0 },
  { id: 's10',name: 'Rose Kimani',    role: 'Spa Therapist',       department: 'Spa Team',     phone: '0712000010', email: 'rose@azurahaven.com',   isLeader: true,  status: 'active', assignedTasks: 2 },
  { id: 's11',name: 'Tom Mutua',      role: 'Front Desk Agent',    department: 'Front Desk',   phone: '0712000011', email: 'tom@azurahaven.com',    isLeader: false, status: 'active', assignedTasks: 3 },
  { id: 's12',name: 'Sarah Kamau',    role: 'General Manager',     department: 'Management',   phone: '0712000012', email: 'sarah@azurahaven.com',  isLeader: true,  status: 'active', assignedTasks: 0 },
];

const EMPTY_FORM = { name: '', role: '', department: 'Housekeeping', phone: '', email: '', isLeader: false, notes: '', status: 'active' };

// ── Helpers ───────────────────────────────────────────────────────────────────
function getDeptConfig(deptId) {
  return DEPARTMENTS.find(d => d.id === deptId) || { icon: '👤', color: 'bg-gray-100 text-gray-700 border-gray-200' };
}

function Avatar({ name, size = 'md' }) {
  const initials = name?.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?';
  const colors = ['bg-blue-500','bg-purple-500','bg-green-500','bg-orange-500','bg-pink-500','bg-teal-500','bg-red-500','bg-indigo-500'];
  const color = colors[(name?.charCodeAt(0) || 0) % colors.length];
  const sz = size === 'lg' ? 'w-14 h-14 text-xl' : size === 'sm' ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm';
  return (
    <div className={`${sz} ${color} rounded-full flex items-center justify-center text-white font-bold flex-shrink-0`}>
      {initials}
    </div>
  );
}

// ── Staff Form Modal ──────────────────────────────────────────────────────────
function StaffModal({ member, onClose, onSave, isSaving }) {
  const [form, setForm] = useState(member ? {
    name: member.name || '',
    role: member.role || '',
    department: member.department || 'Housekeeping',
    phone: member.phone || '',
    email: member.email || '',
    isLeader: member.isLeader || false,
    notes: member.notes || '',
    status: member.status || 'active',
  } : EMPTY_FORM);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const isEdit = !!member?.id;

  return (
    <div className="fixed inset-0 bg-navy/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-cream-dark">
          <h2 className="font-serif font-bold text-navy text-xl">{isEdit ? 'Edit Staff Member' : 'Add Staff Member'}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-cream flex items-center justify-center text-muted transition-colors">✕</button>
        </div>

        <div className="p-6 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-navy mb-1.5">Full Name *</label>
            <input value={form.name} onChange={e => set('name', e.target.value)}
              placeholder="e.g. Mary Wanjiku"
              className="w-full px-4 py-3 rounded-xl bg-cream border border-cream-dark focus:border-gold focus:outline-none text-navy transition-colors" />
          </div>

          {/* Department */}
          <div>
            <label className="block text-sm font-medium text-navy mb-1.5">Department *</label>
            <div className="grid grid-cols-3 gap-2">
              {DEPARTMENTS.map(d => (
                <button key={d.id} type="button" onClick={() => set('department', d.id)}
                  className={`py-2 px-2 rounded-xl text-xs font-semibold border-2 transition-all flex items-center gap-1.5 ${form.department === d.id ? 'border-gold bg-gold/10 text-navy' : 'border-cream-dark text-muted hover:border-gold/40'}`}>
                  <span>{d.icon}</span>
                  <span className="truncate">{d.id}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Role / Title */}
          <div>
            <label className="block text-sm font-medium text-navy mb-1.5">Job Title / Role</label>
            <input value={form.role} onChange={e => set('role', e.target.value)}
              placeholder={`e.g. Head ${form.department}`}
              className="w-full px-4 py-3 rounded-xl bg-cream border border-cream-dark focus:border-gold focus:outline-none text-navy transition-colors" />
          </div>

          {/* Phone + Email */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-navy mb-1.5">Phone</label>
              <input value={form.phone} onChange={e => set('phone', e.target.value)}
                placeholder="07XX XXX XXX"
                className="w-full px-4 py-3 rounded-xl bg-cream border border-cream-dark focus:border-gold focus:outline-none text-navy transition-colors" />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy mb-1.5">Email</label>
              <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
                placeholder="staff@azurahaven.com"
                className="w-full px-4 py-3 rounded-xl bg-cream border border-cream-dark focus:border-gold focus:outline-none text-navy transition-colors" />
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-navy mb-1.5">Status</label>
            <div className="flex gap-2">
              {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                <button key={key} type="button" onClick={() => set('status', key)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${form.status === key ? 'border-gold bg-gold/10 text-navy' : 'border-cream-dark text-muted hover:border-gold/40'}`}>
                  <span className={`inline-block w-2 h-2 rounded-full mr-1.5 ${cfg.dot}`} />
                  {cfg.label}
                </button>
              ))}
            </div>
          </div>

          {/* Department Leader toggle */}
          <div className="flex items-center justify-between bg-cream rounded-xl px-4 py-3">
            <div>
              <div className="text-sm font-semibold text-navy">Department Leader</div>
              <div className="text-xs text-muted">This person leads their department</div>
            </div>
            <button type="button" onClick={() => set('isLeader', !form.isLeader)}
              className={`relative w-12 h-6 rounded-full transition-colors ${form.isLeader ? 'bg-gold' : 'bg-gray-300'}`}>
              <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.isLeader ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </button>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-navy mb-1.5">Notes <span className="text-muted font-normal">(optional)</span></label>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)}
              rows={2} placeholder="Skills, shift, special notes..."
              className="w-full px-4 py-3 rounded-xl bg-cream border border-cream-dark focus:border-gold focus:outline-none text-navy transition-colors resize-none" />
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 pb-6">
          <button onClick={() => onSave(form)} disabled={!form.name.trim() || isSaving}
            className="flex-1 bg-navy hover:bg-navy-light disabled:bg-navy/40 text-white font-bold py-3.5 rounded-xl text-sm uppercase tracking-widest transition-all">
            {isSaving ? 'Saving...' : isEdit ? 'Save Changes' : 'Add Staff Member'}
          </button>
          <button onClick={onClose} className="px-5 py-3.5 rounded-xl border border-cream-dark text-muted hover:text-navy text-sm transition-colors">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Assign Task Modal ─────────────────────────────────────────────────────────
function AssignModal({ staff, pendingOrders, onClose, onAssign, isAssigning }) {
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [note, setNote] = useState('');

  return (
    <div className="fixed inset-0 bg-navy/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-cream-dark">
          <div>
            <h2 className="font-serif font-bold text-navy text-xl">Assign Task to Staff</h2>
            <p className="text-muted text-sm mt-0.5">{pendingOrders.length} pending guest request{pendingOrders.length !== 1 ? 's' : ''}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-cream flex items-center justify-center text-muted transition-colors">✕</button>
        </div>

        <div className="p-6 space-y-5">
          {/* Step 1: Pick request */}
          <div>
            <h3 className="text-sm font-semibold text-navy uppercase tracking-widest mb-3">1. Select Guest Request</h3>
            {pendingOrders.length === 0 ? (
              <div className="text-center py-8 bg-cream rounded-xl">
                <div className="text-3xl mb-2">✅</div>
                <p className="text-muted text-sm">No pending requests right now</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {pendingOrders.map(order => (
                  <button key={order.id} onClick={() => setSelectedOrder(order)}
                    className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all ${selectedOrder?.id === order.id ? 'border-gold bg-gold/5' : 'border-cream-dark hover:border-gold/40'}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-semibold text-navy text-sm">
                          {order.type === 'service' ? '🛎️' : '🍽️'} {order.items?.[0]?.name || 'Request'}
                          {order.items?.length > 1 ? ` +${order.items.length - 1}` : ''}
                        </span>
                        <div className="text-xs text-muted mt-0.5">
                          Room {order.roomNumber} · {order.userName} · {new Date(order.createdAt).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                      <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full font-medium flex-shrink-0 ml-2">
                        🔔 New
                      </span>
                    </div>
                    {order.notes && <p className="text-xs text-muted italic mt-1 truncate">💬 {order.notes}</p>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Step 2: Pick staff */}
          <div>
            <h3 className="text-sm font-semibold text-navy uppercase tracking-widest mb-3">2. Assign to Staff Member</h3>
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {staff.filter(s => s.status === 'active').map(member => {
                const dept = getDeptConfig(member.department);
                return (
                  <button key={member.id} onClick={() => setSelectedStaff(member)}
                    className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all ${selectedStaff?.id === member.id ? 'border-gold bg-gold/5' : 'border-cream-dark hover:border-gold/40'}`}>
                    <div className="flex items-center gap-3">
                      <Avatar name={member.name} size="sm" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-navy text-sm">{member.name}</span>
                          {member.isLeader && <span className="text-xs bg-gold/20 text-yellow-800 px-1.5 py-0.5 rounded-full font-medium">Leader</span>}
                        </div>
                        <div className="text-xs text-muted">{dept.icon} {member.department} · {member.role}</div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_CONFIG[member.status]?.color}`}>
                          {STATUS_CONFIG[member.status]?.label}
                        </div>
                        {member.assignedTasks > 0 && (
                          <div className="text-xs text-muted mt-0.5">{member.assignedTasks} active</div>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 3: Note */}
          <div>
            <h3 className="text-sm font-semibold text-navy uppercase tracking-widest mb-2">3. Instructions <span className="text-muted font-normal normal-case">(optional)</span></h3>
            <textarea value={note} onChange={e => setNote(e.target.value)}
              rows={2} placeholder="Any special instructions for the staff member..."
              className="w-full px-4 py-3 rounded-xl bg-cream border border-cream-dark focus:border-gold focus:outline-none text-navy text-sm transition-colors resize-none" />
          </div>
        </div>

        <div className="flex gap-3 px-6 pb-6">
          <button
            onClick={() => onAssign({ order: selectedOrder, staffMember: selectedStaff, note })}
            disabled={!selectedOrder || !selectedStaff || isAssigning}
            className="flex-1 bg-navy hover:bg-navy-light disabled:bg-navy/40 text-white font-bold py-3.5 rounded-xl text-sm uppercase tracking-widest transition-all">
            {isAssigning ? 'Assigning...' : `Assign to ${selectedStaff?.name?.split(' ')[0] || 'Staff'}`}
          </button>
          <button onClick={onClose} className="px-5 py-3.5 rounded-xl border border-cream-dark text-muted hover:text-navy text-sm transition-colors">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function Staff() {
  const queryClient = useQueryClient();
  const [view, setView] = useState('grid');           // 'grid' | 'dept'
  const [deptFilter, setDeptFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editMember, setEditMember] = useState(null);
  const [showAssign, setShowAssign] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  // ── Data fetching ──────────────────────────────────────────────────────────
  const { data: staffData, isLoading } = useQuery({
    queryKey: ['staff'],
    queryFn: () => api.get('/staff').then(r => {
      const d = r.data;
      return Array.isArray(d) ? d : (d.staff || []);
    }).catch(() => MOCK_STAFF),
    refetchInterval: 60000,
  });

  const { data: ordersData } = useQuery({
    queryKey: ['adminOrders'],
    queryFn: () => api.get('/orders').then(r => {
      const d = r.data;
      return Array.isArray(d) ? d : (d.orders || []);
    }).catch(() => []),
    refetchInterval: 30000,
  });

  const staff = staffData || MOCK_STAFF;
  const pendingOrders = (ordersData || []).filter(o => o.status === 'received');

  // ── Mutations ──────────────────────────────────────────────────────────────
  const addStaff = useMutation({
    mutationFn: (data) => api.post('/staff', data),
    onSuccess: () => {
      queryClient.invalidateQueries(['staff']);
      toast.success('Staff member added');
      setShowModal(false);
    },
    onError: () => toast.error('Failed to add staff member'),
  });

  const updateStaff = useMutation({
    mutationFn: ({ id, data }) => api.patch(`/staff/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['staff']);
      toast.success('Staff member updated');
      setEditMember(null);
    },
    onError: () => toast.error('Failed to update'),
  });

  const deleteStaff = useMutation({
    mutationFn: (id) => api.delete(`/staff/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['staff']);
      toast.success('Staff member removed');
      setConfirmDelete(null);
    },
    onError: () => toast.error('Failed to delete'),
  });

  const assignTask = useMutation({
    mutationFn: ({ order, staffMember, note }) =>
      api.patch(`/orders/${order.id}/status`, {
        status: 'preparing',
        assignedTo: staffMember.name,
        assignNote: note || '',
      }),
    onSuccess: (_, { staffMember }) => {
      queryClient.invalidateQueries(['adminOrders']);
      toast.success(`Assigned to ${staffMember.name}`);
      setShowAssign(false);
    },
    onError: () => toast.error('Failed to assign task'),
  });

  // ── Filtering ──────────────────────────────────────────────────────────────
  let filtered = staff;
  if (deptFilter !== 'all') filtered = filtered.filter(s => s.department === deptFilter);
  if (statusFilter !== 'all') filtered = filtered.filter(s => s.status === statusFilter);
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(s =>
      s.name?.toLowerCase().includes(q) ||
      s.role?.toLowerCase().includes(q) ||
      s.department?.toLowerCase().includes(q)
    );
  }

  // ── Stats ──────────────────────────────────────────────────────────────────
  const totalActive = staff.filter(s => s.status === 'active').length;
  const totalLeaders = staff.filter(s => s.isLeader).length;
  const totalTasks = staff.reduce((sum, s) => sum + (s.assignedTasks || 0), 0);

  // Group by department for dept view
  const byDept = DEPARTMENTS.map(dept => ({
    ...dept,
    members: staff.filter(s => s.department === dept.id),
    leader: staff.find(s => s.department === dept.id && s.isLeader),
  })).filter(d => d.members.length > 0);

  if (isLoading) return <Loading />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-navy">Staff Management</h1>
          <p className="text-muted text-sm mt-1">{staff.length} staff members · {totalActive} active</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {pendingOrders.length > 0 && (
            <button onClick={() => setShowAssign(true)}
              className="relative flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-all">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              Assign Requests
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                {pendingOrders.length}
              </span>
            </button>
          )}
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-navy hover:bg-navy-light text-cream font-bold px-4 py-2.5 rounded-xl text-sm transition-all">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Staff
          </button>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { icon: '👥', label: 'Total Staff',    value: staff.length,   color: 'text-navy' },
          { icon: '✅', label: 'Active Now',     value: totalActive,    color: 'text-green-600' },
          { icon: '👑', label: 'Team Leaders',   value: totalLeaders,   color: 'text-yellow-600' },
          { icon: '📋', label: 'Active Tasks',   value: totalTasks,     color: 'text-purple-600' },
        ].map(stat => (
          <div key={stat.label} className="bg-white rounded-2xl border border-cream-dark p-5 shadow-sm">
            <div className="text-2xl mb-1">{stat.icon}</div>
            <div className={`text-3xl font-bold ${stat.color}`}>{stat.value}</div>
            <div className="text-xs text-muted mt-0.5">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* ── Filters & View Toggle ── */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        {/* Search */}
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input type="text" placeholder="Search by name, role, department..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-white border border-cream-dark focus:border-gold focus:outline-none text-navy transition-colors" />
        </div>

        {/* Status filter */}
        <div className="flex gap-1.5">
          {[['all','All'],['active','Active'],['off','Off'],['leave','Leave']].map(([val, label]) => (
            <button key={val} onClick={() => setStatusFilter(val)}
              className={`px-3 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${statusFilter === val ? 'bg-navy text-cream' : 'bg-white text-navy/60 border border-cream-dark hover:bg-cream'}`}>
              {label}
            </button>
          ))}
        </div>

        {/* View toggle */}
        <div className="flex gap-1 bg-cream rounded-xl p-1">
          <button onClick={() => setView('grid')}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${view === 'grid' ? 'bg-white text-navy shadow-sm' : 'text-muted hover:text-navy'}`}>
            Grid
          </button>
          <button onClick={() => setView('dept')}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${view === 'dept' ? 'bg-white text-navy shadow-sm' : 'text-muted hover:text-navy'}`}>
            By Dept
          </button>
        </div>
      </div>

      {/* ── Department filter pills ── */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
        <button onClick={() => setDeptFilter('all')}
          className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${deptFilter === 'all' ? 'bg-navy text-cream' : 'bg-white text-navy/60 border border-cream-dark hover:bg-cream'}`}>
          All Departments
        </button>
        {DEPARTMENTS.map(d => (
          <button key={d.id} onClick={() => setDeptFilter(d.id)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${deptFilter === d.id ? 'bg-navy text-cream' : 'bg-white text-navy/60 border border-cream-dark hover:bg-cream'}`}>
            {d.icon} {d.id}
          </button>
        ))}
      </div>

      {/* ── GRID VIEW ── */}
      {view === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(member => {
            const dept = getDeptConfig(member.department);
            const statusCfg = STATUS_CONFIG[member.status] || STATUS_CONFIG.active;
            return (
              <div key={member.id} className="bg-white rounded-2xl border border-cream-dark shadow-sm hover:shadow-md transition-all overflow-hidden group">
                {/* Card top */}
                <div className="bg-gradient-to-br from-navy to-navy-light p-5 relative">
                  {member.isLeader && (
                    <div className="absolute top-3 right-3 bg-gold text-navy text-xs font-bold px-2 py-0.5 rounded-full">
                      👑 Leader
                    </div>
                  )}
                  <Avatar name={member.name} size="lg" />
                  <h3 className="font-bold text-white mt-3 text-base leading-tight">{member.name}</h3>
                  <p className="text-cream/60 text-xs mt-0.5">{member.role || member.department}</p>
                </div>

                {/* Card body */}
                <div className="p-4 space-y-3">
                  {/* Department badge */}
                  <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${dept.color}`}>
                    {dept.icon} {member.department}
                  </span>

                  {/* Status + tasks */}
                  <div className="flex items-center justify-between">
                    <span className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${statusCfg.color}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                      {statusCfg.label}
                    </span>
                    {member.assignedTasks > 0 && (
                      <span className="text-xs text-muted bg-cream px-2 py-0.5 rounded-full">
                        📋 {member.assignedTasks} task{member.assignedTasks !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>

                  {/* Contact */}
                  {member.phone && (
                    <a href={`tel:${member.phone}`} className="flex items-center gap-2 text-xs text-muted hover:text-navy transition-colors">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      {member.phone}
                    </a>
                  )}
                  {member.notes && (
                    <p className="text-xs text-muted italic line-clamp-1">📝 {member.notes}</p>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-1">
                    <button onClick={() => setEditMember(member)}
                      className="flex-1 bg-cream hover:bg-cream-dark text-navy text-xs font-semibold py-2 rounded-lg transition-all">
                      Edit
                    </button>
                    <button onClick={() => setConfirmDelete(member)}
                      className="px-3 py-2 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-all">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div className="col-span-4 text-center py-16 bg-white rounded-2xl border border-cream-dark">
              <div className="text-4xl mb-3">👤</div>
              <p className="text-muted">No staff members found.</p>
              <button onClick={() => setShowModal(true)} className="mt-4 bg-navy text-cream font-semibold px-5 py-2.5 rounded-xl text-sm transition-all hover:bg-navy-light">
                Add First Staff Member
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── DEPARTMENT VIEW ── */}
      {view === 'dept' && (
        <div className="space-y-6">
          {byDept.map(dept => (
            <div key={dept.id} className="bg-white rounded-2xl border border-cream-dark shadow-sm overflow-hidden">
              {/* Dept header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-cream-dark bg-cream/50">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{dept.icon}</span>
                  <div>
                    <h3 className="font-bold text-navy">{dept.id}</h3>
                    <p className="text-xs text-muted">{dept.members.length} member{dept.members.length !== 1 ? 's' : ''}</p>
                  </div>
                </div>
                {dept.leader && (
                  <div className="flex items-center gap-2 bg-gold/10 border border-gold/30 rounded-xl px-3 py-1.5">
                    <Avatar name={dept.leader.name} size="sm" />
                    <div>
                      <div className="text-xs font-bold text-navy">{dept.leader.name}</div>
                      <div className="text-xs text-muted">Department Leader</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Members table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-cream-dark">
                      <th className="text-left px-6 py-3 text-xs font-semibold text-muted uppercase tracking-widest">Staff Member</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-muted uppercase tracking-widest hidden sm:table-cell">Role</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-muted uppercase tracking-widest">Status</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-muted uppercase tracking-widest hidden md:table-cell">Contact</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-muted uppercase tracking-widest hidden md:table-cell">Tasks</th>
                      <th className="px-6 py-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {dept.members.map(member => {
                      const statusCfg = STATUS_CONFIG[member.status] || STATUS_CONFIG.active;
                      return (
                        <tr key={member.id} className="border-b border-cream-dark last:border-0 hover:bg-cream/30 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <Avatar name={member.name} size="sm" />
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="font-semibold text-navy text-sm">{member.name}</span>
                                  {member.isLeader && <span className="text-xs bg-gold/20 text-yellow-800 px-1.5 py-0.5 rounded-full">👑</span>}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-muted hidden sm:table-cell">{member.role}</td>
                          <td className="px-6 py-4">
                            <span className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full w-fit ${statusCfg.color}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                              {statusCfg.label}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-muted hidden md:table-cell">
                            {member.phone || '—'}
                          </td>
                          <td className="px-6 py-4 hidden md:table-cell">
                            <span className={`text-sm font-medium ${member.assignedTasks > 0 ? 'text-navy' : 'text-muted'}`}>
                              {member.assignedTasks || 0}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex gap-1.5">
                              <button onClick={() => setEditMember(member)}
                                className="text-xs bg-cream hover:bg-cream-dark text-navy font-medium px-3 py-1.5 rounded-lg transition-all">
                                Edit
                              </button>
                              <button onClick={() => setConfirmDelete(member)}
                                className="text-xs text-red-400 hover:text-red-600 hover:bg-red-50 px-2 py-1.5 rounded-lg transition-all">
                                ✕
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Modals ── */}
      {showModal && (
        <StaffModal
          onClose={() => setShowModal(false)}
          onSave={(data) => addStaff.mutate(data)}
          isSaving={addStaff.isPending}
        />
      )}

      {editMember && (
        <StaffModal
          member={editMember}
          onClose={() => setEditMember(null)}
          onSave={(data) => updateStaff.mutate({ id: editMember.id, data })}
          isSaving={updateStaff.isPending}
        />
      )}

      {showAssign && (
        <AssignModal
          staff={staff}
          pendingOrders={pendingOrders}
          onClose={() => setShowAssign(false)}
          onAssign={(payload) => assignTask.mutate(payload)}
          isAssigning={assignTask.isPending}
        />
      )}

      {/* Delete confirm */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-navy/60 z-50 flex items-center justify-center p-4" onClick={() => setConfirmDelete(null)}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="text-center mb-5">
              <div className="text-4xl mb-3">⚠️</div>
              <h3 className="font-bold text-navy text-lg">Remove Staff Member?</h3>
              <p className="text-muted text-sm mt-1">
                <strong>{confirmDelete.name}</strong> will be removed from the system. This cannot be undone.
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => deleteStaff.mutate(confirmDelete.id)}
                disabled={deleteStaff.isPending}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-bold py-3 rounded-xl text-sm transition-all">
                {deleteStaff.isPending ? 'Removing...' : 'Yes, Remove'}
              </button>
              <button onClick={() => setConfirmDelete(null)}
                className="flex-1 border border-cream-dark text-muted hover:text-navy py-3 rounded-xl text-sm transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
