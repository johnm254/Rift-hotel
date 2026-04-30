import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import Loading from '../components/Loading';
import { mockRooms } from '../lib/mockData';

const CAPACITY_OPTIONS = [
  { label: 'Any', value: 0 },
  { label: '1–2', value: 2 },
  { label: '3–4', value: 4 },
  { label: '5+', value: 5 },
];

export default function Rooms() {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('default');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [capacityFilter, setCapacityFilter] = useState(0);

  const { data: rooms, isLoading } = useQuery({
    queryKey: ['rooms'],
    queryFn: () => api.get('/rooms').then(r => {
      const d = r.data;
      const arr = Array.isArray(d) ? d : (d.rooms || d.data || []);
      return arr.length > 0 ? arr : mockRooms;
    }).catch(() => mockRooms),
  });

  let filtered = rooms || [];

  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(r =>
      r.name?.toLowerCase().includes(q) ||
      r.description?.toLowerCase().includes(q) ||
      r.amenities?.some(a => a.toLowerCase().includes(q))
    );
  }

  if (minPrice) filtered = filtered.filter(r => r.price >= Number(minPrice));
  if (maxPrice) filtered = filtered.filter(r => r.price <= Number(maxPrice));

  if (capacityFilter === 2) filtered = filtered.filter(r => r.capacity <= 2);
  else if (capacityFilter === 4) filtered = filtered.filter(r => r.capacity >= 3 && r.capacity <= 4);
  else if (capacityFilter === 5) filtered = filtered.filter(r => r.capacity >= 5);

  if (sortBy === 'price-asc') filtered = [...filtered].sort((a, b) => a.price - b.price);
  if (sortBy === 'price-desc') filtered = [...filtered].sort((a, b) => b.price - a.price);
  if (sortBy === 'capacity') filtered = [...filtered].sort((a, b) => a.capacity - b.capacity);

  const hasFilters = search || minPrice || maxPrice || capacityFilter || sortBy !== 'default';
  const clearFilters = () => { setSearch(''); setMinPrice(''); setMaxPrice(''); setCapacityFilter(0); setSortBy('default'); };

  return (
    <div>
      {/* Header */}
      <section className="hero-gradient py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="text-gold text-sm uppercase tracking-widest font-semibold">Stay</span>
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-white mt-2 mb-4">
            Our Rooms & Suites
          </h1>
          <p className="text-cream/60 max-w-lg mx-auto">
            Each room is a sanctuary of comfort, designed to make you feel at home while surrounded by luxury.
          </p>
        </div>
      </section>

      {/* Filters */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl border border-cream-dark shadow-sm p-5 space-y-4">
          {/* Row 1: search + sort */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search by name, description or amenity..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-cream border border-cream-dark focus:border-gold focus:outline-none text-navy transition-colors"
              />
            </div>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="px-4 py-3 rounded-xl bg-cream border border-cream-dark focus:border-gold focus:outline-none text-navy cursor-pointer"
            >
              <option value="default">Sort: Featured</option>
              <option value="price-asc">Price: Low → High</option>
              <option value="price-desc">Price: High → Low</option>
              <option value="capacity">Capacity</option>
            </select>
          </div>

          {/* Row 2: price range + capacity */}
          <div className="flex flex-col sm:flex-row gap-3 items-center">
            <div className="flex items-center gap-2 flex-1">
              <span className="text-sm text-muted whitespace-nowrap">Price (KES):</span>
              <input
                type="number"
                placeholder="Min"
                value={minPrice}
                onChange={e => setMinPrice(e.target.value)}
                className="w-28 px-3 py-2 rounded-xl bg-cream border border-cream-dark focus:border-gold focus:outline-none text-navy text-sm transition-colors"
              />
              <span className="text-muted">—</span>
              <input
                type="number"
                placeholder="Max"
                value={maxPrice}
                onChange={e => setMaxPrice(e.target.value)}
                className="w-28 px-3 py-2 rounded-xl bg-cream border border-cream-dark focus:border-gold focus:outline-none text-navy text-sm transition-colors"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-muted whitespace-nowrap">Guests:</span>
              <div className="flex gap-1">
                {CAPACITY_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setCapacityFilter(opt.value)}
                    className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${capacityFilter === opt.value ? 'bg-navy text-cream' : 'bg-cream text-navy/60 hover:bg-cream-dark border border-cream-dark'}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {hasFilters && (
              <button onClick={clearFilters} className="text-sm text-gold hover:text-gold-dark font-medium transition-colors whitespace-nowrap">
                Clear filters ✕
              </button>
            )}
          </div>
        </div>

        {/* Results count */}
        {!isLoading && (
          <p className="text-sm text-muted mt-3 px-1">
            {filtered.length} room{filtered.length !== 1 ? 's' : ''} found
            {hasFilters && <span className="text-gold"> (filtered)</span>}
          </p>
        )}
      </section>

      {/* Room Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        {isLoading ? <Loading /> : filtered.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-cream-dark">
            <div className="text-4xl mb-3">🔍</div>
            <p className="text-navy font-semibold mb-1">No rooms match your filters</p>
            <p className="text-muted text-sm mb-4">Try adjusting your search or price range.</p>
            <button onClick={clearFilters} className="text-gold hover:text-gold-dark font-medium text-sm transition-colors">
              Clear all filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filtered.map(room => (
              <Link
                key={room.id}
                to={`/rooms/${room.id}`}
                className="group block bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border border-cream-dark"
              >
                <div className="relative h-64 overflow-hidden">
                  <img
                    src={
                      room.photos?.[0]
                        ? (typeof room.photos[0] === 'string' ? room.photos[0] : room.photos[0].thumb)
                        : 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=600'
                    }
                    alt={room.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-4 right-4 bg-gold text-navy font-bold px-3 py-1.5 rounded-full text-sm shadow-lg">
                    KES {room.price?.toLocaleString()}<span className="text-xs font-normal">/night</span>
                  </div>
                  {!room.available && (
                    <div className="absolute inset-0 bg-navy/60 flex items-center justify-center">
                      <span className="bg-red-500/90 text-white font-bold px-6 py-2 rounded-full text-sm uppercase tracking-widest">Unavailable</span>
                    </div>
                  )}
                  {room.avgRating && (
                    <div className="absolute bottom-4 left-4 bg-navy/70 backdrop-blur text-gold text-xs font-bold px-2.5 py-1 rounded-full">
                      ★ {room.avgRating}
                    </div>
                  )}
                </div>

                <div className="p-6">
                  <h3 className="font-serif text-xl font-bold text-navy mb-2 group-hover:text-gold-dark transition-colors">
                    {room.name}
                  </h3>
                  <p className="text-muted text-sm leading-relaxed line-clamp-2 mb-4">{room.description}</p>

                  <div className="flex items-center gap-4 text-xs text-muted mb-4">
                    <span>🛏 {room.capacity} guest{room.capacity > 1 ? 's' : ''}</span>
                    {room.amenities?.length > 0 && <span>✓ {room.amenities.length} amenities</span>}
                  </div>

                  {room.amenities?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {room.amenities.slice(0, 3).map(a => (
                        <span key={a} className="bg-cream text-navy/60 text-xs px-2.5 py-1 rounded-full">{a}</span>
                      ))}
                      {room.amenities.length > 3 && (
                        <span className="text-gold text-xs font-medium">+{room.amenities.length - 3} more</span>
                      )}
                    </div>
                  )}

                  <span className="inline-flex items-center gap-1 text-gold font-semibold text-sm group-hover:gap-2 transition-all">
                    View Details <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
