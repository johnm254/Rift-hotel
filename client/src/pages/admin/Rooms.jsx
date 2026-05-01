import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import api from '../../lib/api';
import Loading from '../../components/Loading';

export default function AdminRooms() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    name: '', description: '', price: '', capacity: '2', amenities: '', available: 'true', tourUrl: ''
  });
  const [photos, setPhotos] = useState(null);

  const { data: rooms, isLoading } = useQuery({
    queryKey: ['adminRooms'],
    queryFn: () => api.get('/rooms').then(r => {
      const d = r.data;
      return Array.isArray(d) ? d : (d.rooms || d.data || []);
    }).catch(() => []),
  });

  const saveRoom = useMutation({
    mutationFn: (formData) => {
      if (editing) return api.put(`/rooms/${editing}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      return api.post('/rooms', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['adminRooms']);
      resetForm();
      toast.success(editing ? 'Room updated!' : 'Room created successfully!');
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to save room'),
  });

  const deleteRoom = useMutation({
    mutationFn: (id) => api.delete(`/rooms/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['adminRooms']);
      toast.success('Room deleted');
    },
    onError: () => toast.error('Failed to delete room'),
  });

  // Quick availability toggle
  const toggleAvailability = useMutation({
    mutationFn: ({ id, available }) => {
      const fd = new FormData();
      fd.append('available', String(!available));
      return api.put(`/rooms/${id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    },
    onSuccess: (_, { available }) => {
      queryClient.invalidateQueries(['adminRooms']);
      toast.success(`Room marked as ${!available ? 'available' : 'unavailable'}`);
    },
    onError: () => toast.error('Failed to update availability'),
  });

  const resetForm = () => {
    setForm({ name: '', description: '', price: '', capacity: '2', amenities: '', available: 'true', tourUrl: '' });
    setPhotos(null);
    setShowForm(false);
    setEditing(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append('name', form.name);
    fd.append('description', form.description);
    fd.append('price', form.price);
    fd.append('capacity', form.capacity);
    fd.append('amenities', JSON.stringify(form.amenities.split(',').map(a => a.trim()).filter(Boolean)));
    fd.append('available', form.available);
    if (form.tourUrl) fd.append('tourUrl', form.tourUrl);
    if (photos) for (let i = 0; i < photos.length; i++) fd.append('photos', photos[i]);
    saveRoom.mutate(fd);
  };

  const startEdit = (room) => {
    setEditing(room.id);
    setForm({
      name: room.name, description: room.description,
      price: room.price?.toString() || '',
      capacity: room.capacity?.toString() || '2',
      amenities: room.amenities?.join(', ') || '',
      available: room.available ? 'true' : 'false',
      tourUrl: room.tourUrl || '',
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (isLoading) return <Loading />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
        <div>
          <h1 className="text-3xl font-serif font-bold text-navy">Room Management</h1>
          <p className="text-muted text-sm mt-1">{rooms?.length || 0} rooms · {rooms?.filter(r => r.available).length || 0} available</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(!showForm); }}
          className="mt-4 sm:mt-0 bg-gold hover:bg-gold-light text-navy font-bold px-6 py-3 rounded-xl text-sm uppercase tracking-widest transition-all shadow-lg shadow-gold/20">
          {showForm ? '✕ Cancel' : '+ Add Room'}
        </button>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl border border-cream-dark p-6 mb-8 space-y-4">
          <h2 className="text-xl font-serif font-bold text-navy mb-2">{editing ? 'Edit Room' : 'New Room'}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-navy mb-1">Room Name *</label>
              <input type="text" required value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                className="w-full px-4 py-3 rounded-xl bg-cream border border-cream-dark focus:border-gold focus:outline-none text-navy" placeholder="Deluxe Suite" />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy mb-1">Price (KES) *</label>
              <input type="number" required value={form.price} onChange={e => setForm({...form, price: e.target.value})}
                className="w-full px-4 py-3 rounded-xl bg-cream border border-cream-dark focus:border-gold focus:outline-none text-navy" placeholder="15000" />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy mb-1">Capacity *</label>
              <select value={form.capacity} onChange={e => setForm({...form, capacity: e.target.value})}
                className="w-full px-4 py-3 rounded-xl bg-cream border border-cream-dark focus:border-gold focus:outline-none text-navy">
                {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n} guest{n>1?'s':''}</option>)}
              </select>
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
            <label className="block text-sm font-medium text-navy mb-1">Description</label>
            <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})}
              rows={3} className="w-full px-4 py-3 rounded-xl bg-cream border border-cream-dark focus:border-gold focus:outline-none text-navy resize-none" placeholder="Describe the room..." />
          </div>
          <div>
            <label className="block text-sm font-medium text-navy mb-1">Amenities (comma-separated)</label>
            <input type="text" value={form.amenities} onChange={e => setForm({...form, amenities: e.target.value})}
              className="w-full px-4 py-3 rounded-xl bg-cream border border-cream-dark focus:border-gold focus:outline-none text-navy" placeholder="WiFi, TV, AC, Mini Bar, Ocean View" />
          </div>
          <div>
            <label className="block text-sm font-medium text-navy mb-1">Photos</label>
            <input type="file" multiple accept="image/*" onChange={e => setPhotos(e.target.files)}
              className="w-full text-sm text-muted file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-gold file:text-navy hover:file:bg-gold-light" />
          </div>
          <div>
            <label className="block text-sm font-medium text-navy mb-1">Virtual Tour URL <span className="text-muted font-normal">(YouTube, Matterport, or iframe URL)</span></label>
            <input type="url" value={form.tourUrl || ''} onChange={e => setForm({...form, tourUrl: e.target.value})}
              placeholder="https://youtube.com/watch?v=... or https://my.matterport.com/show/?m=..."
              className="w-full px-4 py-3 rounded-xl bg-cream border border-cream-dark focus:border-gold focus:outline-none text-navy" />
          </div>
          <button type="submit" disabled={saveRoom.isPending}
            className="w-full bg-navy hover:bg-navy-light disabled:bg-navy/50 text-white font-bold py-4 rounded-xl text-sm uppercase tracking-widest transition-all">
            {saveRoom.isPending ? 'Saving...' : editing ? 'Update Room' : 'Create Room'}
          </button>
        </form>
      )}

      {/* Room List */}
      <div className="space-y-4">
        {rooms?.map(room => (
          <div key={room.id} className="bg-white rounded-2xl shadow-md border border-cream-dark p-5 hover:shadow-lg transition-shadow">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="w-full md:w-40 h-28 rounded-xl overflow-hidden shrink-0">
                <img
                  src={room.photos?.[0] ? (typeof room.photos[0] === 'string' ? room.photos[0] : room.photos[0].thumb) : 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=200'}
                  alt={room.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1">
                <div className="flex flex-col sm:flex-row justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-navy text-lg">{room.name}</h3>
                    <p className="text-muted text-sm line-clamp-1">{room.description}</p>
                  </div>
                  <span className="text-gold font-bold text-lg">KES {room.price?.toLocaleString()}</span>
                </div>
                <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-muted">
                  <span>🛏 {room.capacity} guests</span>
                  <span>{room.photos?.length || 0} photos</span>
                  <span>{room.amenities?.length || 0} amenities</span>

                  {/* Quick availability toggle */}
                  <label className="flex items-center gap-2 cursor-pointer ml-1">
                    <span className={room.available ? 'text-green-600 font-medium' : 'text-red-500 font-medium'}>
                      {room.available ? 'Available' : 'Unavailable'}
                    </span>
                    <div className="relative" onClick={() => toggleAvailability.mutate({ id: room.id, available: room.available })}>
                      <div className={`w-10 h-6 rounded-full transition-colors ${room.available ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                      <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${room.available ? 'translate-x-4' : 'translate-x-0.5'}`}></div>
                    </div>
                  </label>
                </div>
              </div>
              <div className="flex gap-2 items-start">
                <button onClick={() => startEdit(room)}
                  className="bg-cream hover:bg-cream-dark text-navy px-4 py-2 rounded-xl text-sm font-medium transition-colors">Edit</button>
                <button onClick={() => { if (confirm('Delete this room?')) deleteRoom.mutate(room.id); }}
                  className="bg-red-50 hover:bg-red-100 text-red-700 px-4 py-2 rounded-xl text-sm font-medium transition-colors">Delete</button>
              </div>
            </div>
          </div>
        ))}
        {rooms?.length === 0 && (
          <div className="text-center py-16 bg-white rounded-2xl border border-cream-dark">
            <div className="text-4xl mb-3">🛏</div>
            <p className="text-muted mb-2">No rooms yet.</p>
            <p className="text-sm text-muted">Add your first room above or use the seed button on the dashboard.</p>
          </div>
        )}
      </div>
    </div>
  );
}
