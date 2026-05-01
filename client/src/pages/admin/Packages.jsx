import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import api from '../../lib/api';
import Loading from '../../components/Loading';

const TAGS = ['Romance', 'Family', 'Business', 'Wellness', 'Leisure', 'Value'];

const emptyForm = {
  title: '', subtitle: '', description: '', tag: 'Leisure',
  roomId: '', price: '', originalPrice: '',
  includes: '', image: '',
  active: true,
};

export default function AdminPackages() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const { data: packagesData, isLoading: pkgLoading } = useQuery({
    queryKey: ['adminPackages'],
    queryFn: () => api.get('/packages').then(r => {
      const d = r.data;
      return Array.isArray(d) ? d : (d.packages || []);
    }).catch(() => []),
  });

  const { data: roomsData } = useQuery({
    queryKey: ['adminRooms'],
    queryFn: () => api.get('/rooms').then(r => {
      const d = r.data;
      return Array.isArray(d) ? d : (d.rooms || d.data || []);
    }).catch(() => []),
  });

  const packages = packagesData || [];
  const rooms = roomsData || [];

  const savePackage = useMutation({
    mutationFn: (data) => editing
      ? api.put(`/packages/${editing}`, data)
      : api.post('/packages', data),
    onSuccess: () => {
      queryClient.invalidateQueries(['adminPackages']);
      toast.success(editing ? 'Package updated!' : 'Package created!');
      resetForm();
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to save package'),
  });

  const deletePackage = useMutation({
    mutationFn: (id) => api.delete(`/packages/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['adminPackages']);
      toast.success('Package deleted');
    },
    onError: () => toast.error('Failed to delete package'),
  });

  const toggleActive = useMutation({
    mutationFn: ({ id, active }) => api.put(`/packages/${id}`, { active: !active }),
    onSuccess: () => queryClient.invalidateQueries(['adminPackages']),
  });

  const resetForm = () => {
    setForm(emptyForm);
    setEditing(null);
    setShowForm(false);
  };

  const startEdit = (pkg) => {
    setEditing(pkg.id);
    setForm({
      title: pkg.title || '',
      subtitle: pkg.subtitle || '',
      description: pkg.description || '',
      tag: pkg.tag || 'Leisure',
      roomId: pkg.roomId || '',
      price: pkg.price?.toString() || '',
      originalPrice: pkg.originalPrice?.toString() || '',
      includes: Array.isArray(pkg.includes) ? pkg.includes.join('\n') : (pkg.includes || ''),
      image: pkg.image || '',
      active: pkg.active !== false,
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const includesArr = form.includes.split('\n').map(s => s.trim()).filter(Boolean);
    savePackage.mutate({
      ...form,
      price: Number(form.price),
      originalPrice: form.originalPrice ? Number(form.originalPrice) : null,
      includes: includesArr,
    });
  };

  if (pkgLoading) return <Loading />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
        <div>
          <h1 className="text-3xl font-serif font-bold text-navy">Packages & Offers</h1>
          <p className="text-muted text-sm mt-1">{packages.length} packages · {packages.filter(p => p.active !== false).length} active</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(!showForm); }}
          className="mt-4 sm:mt-0 bg-gold hover:bg-gold-light text-navy font-bold px-6 py-3 rounded-xl text-sm uppercase tracking-widest transition-all shadow-lg shadow-gold/20">
          {showForm ? '✕ Cancel' : '+ New Package'}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl border border-cream-dark p-6 mb-8 space-y-5">
          <h2 className="text-xl font-serif font-bold text-navy">{editing ? 'Edit Package' : 'Create Package'}</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-navy mb-1">Package Title *</label>
              <input type="text" required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                placeholder="Honeymoon Escape" className="w-full px-4 py-3 rounded-xl bg-cream border border-cream-dark focus:border-gold focus:outline-none text-navy" />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy mb-1">Subtitle</label>
              <input type="text" value={form.subtitle} onChange={e => setForm({ ...form, subtitle: e.target.value })}
                placeholder="3 nights · 2 guests" className="w-full px-4 py-3 rounded-xl bg-cream border border-cream-dark focus:border-gold focus:outline-none text-navy" />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy mb-1">Package Price (KES) *</label>
              <input type="number" required value={form.price} onChange={e => setForm({ ...form, price: e.target.value })}
                placeholder="185000" className="w-full px-4 py-3 rounded-xl bg-cream border border-cream-dark focus:border-gold focus:outline-none text-navy" />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy mb-1">Original Price (KES) — for savings badge</label>
              <input type="number" value={form.originalPrice} onChange={e => setForm({ ...form, originalPrice: e.target.value })}
                placeholder="220000" className="w-full px-4 py-3 rounded-xl bg-cream border border-cream-dark focus:border-gold focus:outline-none text-navy" />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy mb-1">Tag / Category</label>
              <select value={form.tag} onChange={e => setForm({ ...form, tag: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-cream border border-cream-dark focus:border-gold focus:outline-none text-navy">
                {TAGS.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-navy mb-1">Linked Room</label>
              <select value={form.roomId} onChange={e => setForm({ ...form, roomId: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-cream border border-cream-dark focus:border-gold focus:outline-none text-navy">
                <option value="">— No specific room —</option>
                {rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-navy mb-1">Description *</label>
            <textarea required value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
              rows={3} placeholder="Describe what makes this package special..."
              className="w-full px-4 py-3 rounded-xl bg-cream border border-cream-dark focus:border-gold focus:outline-none text-navy resize-none" />
          </div>

          <div>
            <label className="block text-sm font-medium text-navy mb-1">What's Included (one item per line) *</label>
            <textarea required value={form.includes} onChange={e => setForm({ ...form, includes: e.target.value })}
              rows={5} placeholder={"3 nights in Honeymoon Retreat\nChampagne & roses on arrival\nCouples spa (90 min)\nPrivate candlelit dinner\nLate checkout (2 PM)"}
              className="w-full px-4 py-3 rounded-xl bg-cream border border-cream-dark focus:border-gold focus:outline-none text-navy resize-none font-mono text-sm" />
            <p className="text-xs text-muted mt-1">Each line becomes a bullet point on the offers page</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-navy mb-1">Cover Image URL</label>
            <input type="url" value={form.image} onChange={e => setForm({ ...form, image: e.target.value })}
              placeholder="https://images.unsplash.com/..." className="w-full px-4 py-3 rounded-xl bg-cream border border-cream-dark focus:border-gold focus:outline-none text-navy" />
            {form.image && <img src={form.image} alt="preview" className="mt-2 h-24 rounded-xl object-cover" onError={e => e.target.style.display = 'none'} />}
          </div>

          <div className="flex items-center gap-3">
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={form.active} onChange={e => setForm({ ...form, active: e.target.checked })} className="sr-only peer" />
              <div className="w-10 h-6 bg-cream-dark peer-checked:bg-gold rounded-full transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-4"></div>
            </label>
            <span className="text-sm font-medium text-navy">Active (visible on Offers page)</span>
          </div>

          <button type="submit" disabled={savePackage.isPending}
            className="w-full bg-navy hover:bg-navy-light disabled:bg-navy/50 text-white font-bold py-4 rounded-xl text-sm uppercase tracking-widest transition-all">
            {savePackage.isPending ? 'Saving...' : editing ? 'Update Package' : 'Create Package'}
          </button>
        </form>
      )}

      {/* Package list */}
      <div className="space-y-4">
        {packages.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-cream-dark">
            <div className="text-4xl mb-3">🎁</div>
            <p className="text-muted mb-1">No packages yet.</p>
            <p className="text-sm text-muted">Create your first package above. It will appear on the Offers page.</p>
          </div>
        ) : packages.map(pkg => (
          <div key={pkg.id} className={`bg-white rounded-2xl shadow-sm border-2 p-5 transition-all ${pkg.active !== false ? 'border-cream-dark' : 'border-dashed border-gray-200 opacity-60'}`}>
            <div className="flex flex-col md:flex-row gap-4">
              {pkg.image && (
                <div className="w-full md:w-32 h-24 rounded-xl overflow-hidden shrink-0">
                  <img src={pkg.image} alt={pkg.title} className="w-full h-full object-cover" />
                </div>
              )}
              <div className="flex-1">
                <div className="flex flex-wrap items-start justify-between gap-2 mb-1">
                  <div>
                    <h3 className="font-bold text-navy text-lg">{pkg.title}</h3>
                    {pkg.subtitle && <p className="text-muted text-sm">{pkg.subtitle}</p>}
                  </div>
                  <div className="text-right">
                    <div className="text-gold font-bold text-lg">KES {pkg.price?.toLocaleString()}</div>
                    {pkg.originalPrice && <div className="text-xs text-muted line-through">KES {pkg.originalPrice?.toLocaleString()}</div>}
                  </div>
                </div>
                <p className="text-muted text-sm line-clamp-2 mb-2">{pkg.description}</p>
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="bg-cream text-navy/60 text-xs px-2.5 py-1 rounded-full">{pkg.tag}</span>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${pkg.active !== false ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {pkg.active !== false ? '● Active' : '○ Hidden'}
                  </span>
                  {pkg.includes?.length > 0 && <span className="text-xs text-muted">{pkg.includes.length} items included</span>}
                </div>
              </div>
              <div className="flex gap-2 items-start flex-shrink-0">
                <button onClick={() => toggleActive.mutate({ id: pkg.id, active: pkg.active })}
                  className="bg-cream hover:bg-cream-dark text-navy px-3 py-2 rounded-xl text-xs font-medium transition-colors">
                  {pkg.active !== false ? 'Hide' : 'Show'}
                </button>
                <button onClick={() => startEdit(pkg)}
                  className="bg-cream hover:bg-cream-dark text-navy px-4 py-2 rounded-xl text-sm font-medium transition-colors">Edit</button>
                <button onClick={() => { if (confirm('Delete this package?')) deletePackage.mutate(pkg.id); }}
                  className="bg-red-50 hover:bg-red-100 text-red-700 px-4 py-2 rounded-xl text-sm font-medium transition-colors">Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
