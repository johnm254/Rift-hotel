import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import api from '../../lib/api';
import Loading from '../../components/Loading';

const emptyForm = {
  name: '', location: '', description: '', phone: '', email: '',
  website: '', currency: 'KES', timezone: 'Africa/Nairobi', active: true,
};

export default function AdminProperties() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const { data, isLoading } = useQuery({
    queryKey: ['adminProperties'],
    queryFn: () => api.get('/properties/all').then(r => {
      const d = r.data;
      return Array.isArray(d) ? d : (d.properties || []);
    }).catch(() => []),
  });

  const properties = data || [];

  const saveProperty = useMutation({
    mutationFn: (d) => editing ? api.put(`/properties/${editing}`, d) : api.post('/properties', d),
    onSuccess: () => {
      queryClient.invalidateQueries(['adminProperties']);
      queryClient.invalidateQueries(['properties']);
      toast.success(editing ? 'Property updated!' : 'Property created!');
      resetForm();
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to save'),
  });

  const deleteProperty = useMutation({
    mutationFn: (id) => api.delete(`/properties/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['adminProperties']);
      toast.success('Property deleted');
    },
  });

  const resetForm = () => { setForm(emptyForm); setEditing(null); setShowForm(false); };

  const startEdit = (p) => {
    setEditing(p.id);
    setForm({ name: p.name || '', location: p.location || '', description: p.description || '',
      phone: p.phone || '', email: p.email || '', website: p.website || '',
      currency: p.currency || 'KES', timezone: p.timezone || 'Africa/Nairobi', active: p.active !== false });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (isLoading) return <Loading />;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
        <div>
          <h1 className="text-3xl font-serif font-bold text-navy">Properties</h1>
          <p className="text-muted text-sm mt-1">Manage multiple hotel locations from one dashboard</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(!showForm); }}
          className="mt-4 sm:mt-0 bg-gold hover:bg-gold-light text-navy font-bold px-6 py-3 rounded-xl text-sm uppercase tracking-widest transition-all shadow-lg shadow-gold/20">
          {showForm ? '✕ Cancel' : '+ Add Property'}
        </button>
      </div>

      {/* Info banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-6 text-sm text-blue-800">
        <strong>Multi-Property Mode:</strong> When you have 2+ active properties, guests will see a property selector on the homepage. Each property has its own rooms, bookings, and settings.
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={e => { e.preventDefault(); saveProperty.mutate(form); }}
          className="bg-white rounded-2xl shadow-xl border border-cream-dark p-6 mb-8 space-y-4">
          <h2 className="text-xl font-serif font-bold text-navy">{editing ? 'Edit Property' : 'New Property'}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-navy mb-1">Property Name *</label>
              <input type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="Azura Haven Mombasa"
                className="w-full px-4 py-3 rounded-xl bg-cream border border-cream-dark focus:border-gold focus:outline-none text-navy" />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy mb-1">Location *</label>
              <input type="text" required value={form.location} onChange={e => setForm({ ...form, location: e.target.value })}
                placeholder="Nyali, Mombasa"
                className="w-full px-4 py-3 rounded-xl bg-cream border border-cream-dark focus:border-gold focus:outline-none text-navy" />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy mb-1">Phone</label>
              <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                placeholder="+254 700 000 000"
                className="w-full px-4 py-3 rounded-xl bg-cream border border-cream-dark focus:border-gold focus:outline-none text-navy" />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy mb-1">Email</label>
              <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                placeholder="mombasa@azurahaven.com"
                className="w-full px-4 py-3 rounded-xl bg-cream border border-cream-dark focus:border-gold focus:outline-none text-navy" />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy mb-1">Currency</label>
              <select value={form.currency} onChange={e => setForm({ ...form, currency: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-cream border border-cream-dark focus:border-gold focus:outline-none text-navy">
                <option value="KES">KES — Kenyan Shilling</option>
                <option value="USD">USD — US Dollar</option>
                <option value="EUR">EUR — Euro</option>
                <option value="GBP">GBP — British Pound</option>
                <option value="TZS">TZS — Tanzanian Shilling</option>
                <option value="UGX">UGX — Ugandan Shilling</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-navy mb-1">Timezone</label>
              <select value={form.timezone} onChange={e => setForm({ ...form, timezone: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-cream border border-cream-dark focus:border-gold focus:outline-none text-navy">
                <option value="Africa/Nairobi">Africa/Nairobi (EAT +3)</option>
                <option value="Africa/Lagos">Africa/Lagos (WAT +1)</option>
                <option value="Africa/Cairo">Africa/Cairo (EET +2)</option>
                <option value="UTC">UTC</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-navy mb-1">Description</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
              rows={2} placeholder="Brief description of this property..."
              className="w-full px-4 py-3 rounded-xl bg-cream border border-cream-dark focus:border-gold focus:outline-none text-navy resize-none" />
          </div>
          <div className="flex items-center gap-3">
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={form.active} onChange={e => setForm({ ...form, active: e.target.checked })} className="sr-only peer" />
              <div className="w-10 h-6 bg-cream-dark peer-checked:bg-gold rounded-full transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-4"></div>
            </label>
            <span className="text-sm font-medium text-navy">Active (visible to guests)</span>
          </div>
          <button type="submit" disabled={saveProperty.isPending}
            className="w-full bg-navy hover:bg-navy-light disabled:bg-navy/50 text-white font-bold py-4 rounded-xl text-sm uppercase tracking-widest transition-all">
            {saveProperty.isPending ? 'Saving...' : editing ? 'Update Property' : 'Create Property'}
          </button>
        </form>
      )}

      {/* Properties list */}
      <div className="space-y-4">
        {properties.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-cream-dark">
            <div className="text-4xl mb-3">🏨</div>
            <p className="text-muted mb-1">Only one property configured.</p>
            <p className="text-sm text-muted">Add more properties to enable multi-location management.</p>
          </div>
        ) : properties.map(p => (
          <div key={p.id} className={`bg-white rounded-2xl border-2 p-5 ${p.active !== false ? 'border-cream-dark' : 'border-dashed border-gray-200 opacity-60'}`}>
            <div className="flex flex-col sm:flex-row justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="font-bold text-navy text-lg">{p.name}</h3>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${p.active !== false ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {p.active !== false ? 'Active' : 'Inactive'}
                  </span>
                  {p.id === 'default' && <span className="text-xs bg-gold/20 text-gold-dark px-2.5 py-1 rounded-full font-medium">Primary</span>}
                </div>
                <div className="flex flex-wrap gap-3 text-sm text-muted">
                  <span>📍 {p.location}</span>
                  {p.phone && <span>📞 {p.phone}</span>}
                  {p.email && <span>✉️ {p.email}</span>}
                  <span>💱 {p.currency || 'KES'}</span>
                </div>
                {p.description && <p className="text-sm text-muted mt-1 line-clamp-1">{p.description}</p>}
              </div>
              <div className="flex gap-2 items-start flex-shrink-0">
                <button onClick={() => startEdit(p)}
                  className="bg-cream hover:bg-cream-dark text-navy px-4 py-2 rounded-xl text-sm font-medium transition-colors">Edit</button>
                {p.id !== 'default' && (
                  <button onClick={() => { if (confirm('Delete this property?')) deleteProperty.mutate(p.id); }}
                    className="bg-red-50 hover:bg-red-100 text-red-700 px-4 py-2 rounded-xl text-sm font-medium transition-colors">Delete</button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
