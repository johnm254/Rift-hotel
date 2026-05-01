import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import api from '../../lib/api';
import Loading from '../../components/Loading';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const RULE_TYPES = [
  { value: 'multiplier', label: 'Multiplier', example: '1.2 = 20% surcharge, 0.8 = 20% discount' },
  { value: 'fixed_add', label: 'Fixed Add/Subtract', example: '5000 = add KES 5,000, -2000 = subtract KES 2,000' },
  { value: 'fixed_set', label: 'Fixed Override', example: '25000 = set price to KES 25,000 regardless of base' },
];

const emptyForm = {
  name: '', type: 'multiplier', value: '', startDate: '', endDate: '',
  daysOfWeek: [], active: true,
};

export default function AdminPricing() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const { data, isLoading } = useQuery({
    queryKey: ['pricingRules'],
    queryFn: () => api.get('/pricing/rules').then(r => r.data.rules || []).catch(() => []),
  });

  const rules = data || [];

  const saveRule = useMutation({
    mutationFn: (d) => editing ? api.put(`/pricing/rules/${editing}`, d) : api.post('/pricing/rules', d),
    onSuccess: () => {
      queryClient.invalidateQueries(['pricingRules']);
      toast.success(editing ? 'Rule updated!' : 'Rule created!');
      resetForm();
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to save rule'),
  });

  const deleteRule = useMutation({
    mutationFn: (id) => api.delete(`/pricing/rules/${id}`),
    onSuccess: () => { queryClient.invalidateQueries(['pricingRules']); toast.success('Rule deleted'); },
  });

  const toggleActive = useMutation({
    mutationFn: ({ id, active }) => api.put(`/pricing/rules/${id}`, { active: !active }),
    onSuccess: () => queryClient.invalidateQueries(['pricingRules']),
  });

  const resetForm = () => { setForm(emptyForm); setEditing(null); setShowForm(false); };

  const startEdit = (rule) => {
    setEditing(rule.id);
    setForm({
      name: rule.name, type: rule.type, value: rule.value?.toString() || '',
      startDate: rule.startDate || '', endDate: rule.endDate || '',
      daysOfWeek: rule.daysOfWeek || [], active: rule.active !== false,
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleDay = (day) => {
    setForm(f => ({
      ...f,
      daysOfWeek: f.daysOfWeek.includes(day)
        ? f.daysOfWeek.filter(d => d !== day)
        : [...f.daysOfWeek, day],
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    saveRule.mutate({ ...form, value: parseFloat(form.value) });
  };

  const getRuleEffect = (rule) => {
    if (rule.type === 'multiplier') {
      const pct = Math.round((rule.value - 1) * 100);
      return pct >= 0 ? `+${pct}% surcharge` : `${pct}% discount`;
    }
    if (rule.type === 'fixed_add') return rule.value >= 0 ? `+KES ${rule.value?.toLocaleString()}` : `−KES ${Math.abs(rule.value)?.toLocaleString()}`;
    return `Fixed KES ${rule.value?.toLocaleString()}`;
  };

  if (isLoading) return <Loading />;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
        <div>
          <h1 className="text-3xl font-serif font-bold text-navy">Dynamic Pricing</h1>
          <p className="text-muted text-sm mt-1">Set weekend rates, seasonal pricing, and event surcharges</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(!showForm); }}
          className="mt-4 sm:mt-0 bg-gold hover:bg-gold-light text-navy font-bold px-6 py-3 rounded-xl text-sm uppercase tracking-widest transition-all shadow-lg shadow-gold/20">
          {showForm ? '✕ Cancel' : '+ New Rule'}
        </button>
      </div>

      {/* How it works */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 mb-6 text-sm text-blue-800">
        <strong>How it works:</strong> Rules are applied in order when a guest selects dates. Multiple rules can stack.
        Example: "Weekend Surcharge" (×1.2) + "December Peak" (×1.3) = ×1.56 total on a December weekend.
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl border border-cream-dark p-6 mb-8 space-y-5">
          <h2 className="text-xl font-serif font-bold text-navy">{editing ? 'Edit Rule' : 'New Pricing Rule'}</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-navy mb-1">Rule Name *</label>
              <input type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="Weekend Surcharge" className="w-full px-4 py-3 rounded-xl bg-cream border border-cream-dark focus:border-gold focus:outline-none text-navy" />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy mb-1">Rule Type *</label>
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-cream border border-cream-dark focus:border-gold focus:outline-none text-navy">
                {RULE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
              <p className="text-xs text-muted mt-1">{RULE_TYPES.find(t => t.value === form.type)?.example}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-navy mb-1">Value *</label>
              <input type="number" required step="0.01" value={form.value} onChange={e => setForm({ ...form, value: e.target.value })}
                placeholder={form.type === 'multiplier' ? '1.2' : '5000'}
                className="w-full px-4 py-3 rounded-xl bg-cream border border-cream-dark focus:border-gold focus:outline-none text-navy" />
            </div>
          </div>

          {/* Date range */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-navy mb-1">Start Date <span className="text-muted font-normal">(optional)</span></label>
              <input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-cream border border-cream-dark focus:border-gold focus:outline-none text-navy" />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy mb-1">End Date <span className="text-muted font-normal">(optional)</span></label>
              <input type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-cream border border-cream-dark focus:border-gold focus:outline-none text-navy" />
            </div>
          </div>

          {/* Days of week */}
          <div>
            <label className="block text-sm font-medium text-navy mb-2">Apply on Days <span className="text-muted font-normal">(leave empty = all days)</span></label>
            <div className="flex gap-2 flex-wrap">
              {DAYS.map((day, i) => (
                <button key={i} type="button" onClick={() => toggleDay(i)}
                  className={`px-3 py-2 rounded-xl text-sm font-medium transition-all border-2 ${form.daysOfWeek.includes(i) ? 'border-gold bg-gold/10 text-navy' : 'border-cream-dark text-muted hover:border-gold/40'}`}>
                  {day}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={form.active} onChange={e => setForm({ ...form, active: e.target.checked })} className="sr-only peer" />
              <div className="w-10 h-6 bg-cream-dark peer-checked:bg-gold rounded-full transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-4"></div>
            </label>
            <span className="text-sm font-medium text-navy">Active (applies to new bookings)</span>
          </div>

          <button type="submit" disabled={saveRule.isPending}
            className="w-full bg-navy hover:bg-navy-light disabled:bg-navy/50 text-white font-bold py-4 rounded-xl text-sm uppercase tracking-widest transition-all">
            {saveRule.isPending ? 'Saving...' : editing ? 'Update Rule' : 'Create Rule'}
          </button>
        </form>
      )}

      {/* Rules list */}
      <div className="space-y-4">
        {rules.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-cream-dark">
            <div className="text-4xl mb-3">💰</div>
            <p className="text-muted mb-1">No pricing rules yet.</p>
            <p className="text-sm text-muted">Create rules to automatically adjust room prices based on dates, seasons, or days of the week.</p>
          </div>
        ) : rules.map(rule => (
          <div key={rule.id} className={`bg-white rounded-2xl border-2 p-5 transition-all ${rule.active !== false ? 'border-cream-dark' : 'border-dashed border-gray-200 opacity-60'}`}>
            <div className="flex flex-col sm:flex-row justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-bold text-navy">{rule.name}</h3>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    rule.type === 'multiplier' && rule.value > 1 ? 'bg-red-100 text-red-700' :
                    rule.type === 'multiplier' && rule.value < 1 ? 'bg-green-100 text-green-700' :
                    rule.value > 0 ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'
                  }`}>
                    {getRuleEffect(rule)}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${rule.active !== false ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {rule.active !== false ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex flex-wrap gap-3 text-xs text-muted">
                  {rule.startDate && <span>📅 From {rule.startDate}</span>}
                  {rule.endDate && <span>to {rule.endDate}</span>}
                  {rule.daysOfWeek?.length > 0 && (
                    <span>📆 {rule.daysOfWeek.map(d => DAYS[d]).join(', ')}</span>
                  )}
                  {!rule.startDate && !rule.endDate && rule.daysOfWeek?.length === 0 && (
                    <span>🔄 Applies always</span>
                  )}
                </div>
              </div>
              <div className="flex gap-2 items-start flex-shrink-0">
                <button onClick={() => toggleActive.mutate({ id: rule.id, active: rule.active })}
                  className="bg-cream hover:bg-cream-dark text-navy px-3 py-2 rounded-xl text-xs font-medium transition-colors">
                  {rule.active !== false ? 'Disable' : 'Enable'}
                </button>
                <button onClick={() => startEdit(rule)}
                  className="bg-cream hover:bg-cream-dark text-navy px-4 py-2 rounded-xl text-sm font-medium transition-colors">Edit</button>
                <button onClick={() => { if (confirm('Delete this rule?')) deleteRule.mutate(rule.id); }}
                  className="bg-red-50 hover:bg-red-100 text-red-700 px-4 py-2 rounded-xl text-sm font-medium transition-colors">Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
