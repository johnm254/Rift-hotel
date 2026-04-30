import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import api from '../../lib/api';
import Loading from '../../components/Loading';

export default function AdminMeals() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    name: '', description: '', price: '', category: 'main', dietary: '', available: 'true'
  });
  const [photo, setPhoto] = useState(null);

  const { data: meals, isLoading } = useQuery({
    queryKey: ['adminMeals'],
    queryFn: () => api.get('/meals').then(r => {
      const d = r.data;
      return Array.isArray(d) ? d : (d.meals || d.data || []);
    }).catch(() => []),
  });

  const saveMeal = useMutation({
    mutationFn: (formData) => {
      if (editing) return api.put(`/meals/${editing}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      return api.post('/meals', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['adminMeals']);
      resetForm();
      toast.success(editing ? 'Meal updated!' : 'Meal created!');
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to save meal'),
  });

  const deleteMeal = useMutation({
    mutationFn: (id) => api.delete(`/meals/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['adminMeals']);
      toast.success('Meal deleted');
    },
    onError: () => toast.error('Failed to delete meal'),
  });

  const resetForm = () => {
    setForm({ name: '', description: '', price: '', category: 'main', dietary: '', available: 'true' });
    setPhoto(null); setShowForm(false); setEditing(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append('name', form.name);
    fd.append('description', form.description);
    fd.append('price', form.price);
    fd.append('category', form.category);
    fd.append('dietary', JSON.stringify(form.dietary.split(',').map(a => a.trim()).filter(Boolean)));
    fd.append('available', form.available);
    if (photo) fd.append('photo', photo);
    saveMeal.mutate(fd);
  };

  const startEdit = (meal) => {
    setEditing(meal.id);
    setForm({
      name: meal.name, description: meal.description, price: meal.price?.toString() || '',
      category: meal.category || 'main', dietary: meal.dietary?.join(', ') || '', available: meal.available ? 'true' : 'false'
    });
    setShowForm(true);
  };

  if (isLoading) return <Loading />;

  const categories = [...new Set((meals || []).map(m => m.category).filter(Boolean))];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
        <div>
          <h1 className="text-3xl font-serif font-bold text-navy">Meal Management</h1>
          <p className="text-muted text-sm mt-1">{meals?.length || 0} dishes · {categories.length} categories</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(!showForm); }} className="mt-4 sm:mt-0 bg-gold hover:bg-gold-light text-navy font-bold px-6 py-3 rounded-xl text-sm uppercase tracking-widest transition-all shadow-lg shadow-gold/20">
          {showForm ? '✕ Cancel' : '+ Add Meal'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl border border-cream-dark p-6 mb-8 space-y-4">
          <h2 className="text-xl font-serif font-bold text-navy mb-2">{editing ? 'Edit Meal' : 'New Meal'}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-navy mb-1">Name *</label>
              <input type="text" required value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                className="w-full px-4 py-3 rounded-xl bg-cream border border-cream-dark focus:border-gold focus:outline-none text-navy" placeholder="Grilled Nyama Choma" />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy mb-1">Price (KES) *</label>
              <input type="number" required value={form.price} onChange={e => setForm({...form, price: e.target.value})}
                className="w-full px-4 py-3 rounded-xl bg-cream border border-cream-dark focus:border-gold focus:outline-none text-navy" placeholder="1200" />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy mb-1">Category</label>
              <select value={form.category} onChange={e => setForm({...form, category: e.target.value})}
                className="w-full px-4 py-3 rounded-xl bg-cream border border-cream-dark focus:border-gold focus:outline-none text-navy">
                <option value="breakfast">Breakfast</option>
                <option value="lunch">Lunch</option>
                <option value="dinner">Dinner</option>
                <option value="main">Main Course</option>
                <option value="dessert">Dessert</option>
                <option value="drinks">Drinks</option>
                <option value="appetizer">Appetizer</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-navy mb-1">Description</label>
            <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})}
              rows={3} className="w-full px-4 py-3 rounded-xl bg-cream border border-cream-dark focus:border-gold focus:outline-none text-navy resize-none"
              placeholder="Describe the dish..." />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-navy mb-1">Dietary Tags</label>
              <input type="text" value={form.dietary} onChange={e => setForm({...form, dietary: e.target.value})}
                className="w-full px-4 py-3 rounded-xl bg-cream border border-cream-dark focus:border-gold focus:outline-none text-navy" placeholder="gf, vegan, halal, spicy" />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy mb-1">Status</label>
              <select value={form.available} onChange={e => setForm({...form, available: e.target.value})}
                className="w-full px-4 py-3 rounded-xl bg-cream border border-cream-dark focus:border-gold focus:outline-none text-navy">
                <option value="true">Available</option>
                <option value="false">Unavailable</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-navy mb-1">Photo</label>
            <input type="file" accept="image/*" onChange={e => setPhoto(e.target.files[0])}
              className="w-full text-sm text-muted file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-gold file:text-navy hover:file:bg-gold-light" />
          </div>
          <button type="submit" disabled={saveMeal.isPending}
            className="w-full bg-navy hover:bg-navy-light disabled:bg-navy/50 text-white font-bold py-4 rounded-xl text-sm uppercase tracking-widest transition-all">
            {saveMeal.isPending ? 'Saving...' : editing ? 'Update Meal' : 'Create Meal'}
          </button>
        </form>
      )}

      <div className="space-y-4">
        {meals?.map(meal => (
          <div key={meal.id} className="bg-white rounded-2xl shadow-md border border-cream-dark p-5">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="w-full md:w-32 h-24 rounded-xl overflow-hidden shrink-0">
                <img src={meal.photo || 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=200'} alt={meal.name}
                  className="w-full h-full object-cover" />
              </div>
              <div className="flex-1">
                <div className="flex flex-col sm:flex-row justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-navy text-lg">{meal.name}</h3>
                    <p className="text-muted text-sm line-clamp-1">{meal.description}</p>
                  </div>
                  <span className="text-gold font-bold">KES {meal.price?.toLocaleString()}</span>
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <span className="bg-cream text-navy/60 text-xs px-2.5 py-1 rounded-full capitalize">{meal.category}</span>
                  {meal.dietary?.map(d => <span key={d} className="bg-cream-dark text-navy/50 text-xs px-2 py-1 rounded-full capitalize">{d}</span>)}
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${meal.available ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {meal.available ? 'Available' : 'Off Menu'}
                  </span>
                </div>
              </div>
              <div className="flex gap-2 items-start">
                <button onClick={() => startEdit(meal)} className="bg-cream hover:bg-cream-dark text-navy px-4 py-2 rounded-xl text-sm font-medium transition-colors">Edit</button>
                <button onClick={() => { if (confirm('Delete this meal?')) deleteMeal.mutate(meal.id); }} className="bg-red-50 hover:bg-red-100 text-red-700 px-4 py-2 rounded-xl text-sm font-medium transition-colors">Delete</button>
              </div>
            </div>
          </div>
        ))}
        {meals?.length === 0 && (
          <div className="text-center py-16 bg-white rounded-2xl border border-cream-dark">
            <div className="text-4xl mb-3">🍽️</div>
            <p className="text-muted">No meals yet. Add your first dish above.</p>
          </div>
        )}
      </div>
    </div>
  );
}
