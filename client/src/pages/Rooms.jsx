import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import Loading from '../components/Loading';

export default function Rooms() {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('default');

  const { data: rooms, isLoading, error } = useQuery({
    queryKey: ['rooms'],
    queryFn: () => api.get('/rooms').then(r => r.data),
  });

  let filtered = rooms || [];
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(r =>
      r.name?.toLowerCase().includes(q) ||
      r.description?.toLowerCase().includes(q)
    );
  }

  if (sortBy === 'price-asc') filtered = [...filtered].sort((a, b) => a.price - b.price);
  if (sortBy === 'price-desc') filtered = [...filtered].sort((a, b) => b.price - a.price);

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
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search rooms..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-white border border-cream-dark focus:border-gold focus:outline-none text-navy transition-colors"
            />
          </div>

          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="w-full sm:w-auto px-4 py-3 rounded-xl bg-white border border-cream-dark focus:border-gold focus:outline-none text-navy cursor-pointer"
          >
            <option value="default">Sort: Featured</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
          </select>
        </div>
      </section>

      {/* Room Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        {isLoading ? <Loading /> : error ? (
          <div className="text-center py-16">
            <p className="text-muted text-lg">Unable to load rooms. Start the backend with data to see rooms here.</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted text-lg">No rooms match your search.</p>
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
                    src={room.photos?.[0] || 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=600'}
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
                </div>

                <div className="p-6">
                  <h3 className="font-serif text-xl font-bold text-navy mb-2 group-hover:text-gold-dark transition-colors">
                    {room.name}
                  </h3>
                  <p className="text-muted text-sm leading-relaxed line-clamp-2 mb-4">{room.description}</p>

                  <div className="flex items-center gap-4 text-xs text-muted mb-4">
                    <span className="flex items-center gap-1">🛏 {room.capacity} guests</span>
                  </div>

                  {room.amenities?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {room.amenities.slice(0, 4).map(a => (
                        <span key={a} className="bg-cream text-navy/60 text-xs px-2.5 py-1 rounded-full">{a}</span>
                      ))}
                      {room.amenities.length > 4 && (
                        <span className="text-gold text-xs">+{room.amenities.length - 4} more</span>
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
