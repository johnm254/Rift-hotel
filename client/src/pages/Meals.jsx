import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import Loading from '../components/Loading';
import { mockMeals } from '../lib/mockData';

export default function Meals() {
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');

  const { data: meals, isLoading } = useQuery({
    queryKey: ['meals', category],
    queryFn: () => {
      const params = category ? `/meals?category=${category}` : '/meals';
      return api.get(params).then(r => r.data).catch(() =>
        category ? mockMeals.filter(m => m.category === category) : mockMeals
      );
    },
  });

  const categories = [...new Set((meals || []).map(m => m.category).filter(Boolean))];

  let filtered = meals || [];
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(m =>
      m.name?.toLowerCase().includes(q) ||
      m.description?.toLowerCase().includes(q)
    );
  }

  return (
    <div>
      {/* Header */}
      <section className="hero-gradient py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="text-gold text-sm uppercase tracking-widest font-semibold">Dining</span>
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-white mt-2 mb-4">
            Culinary Excellence
          </h1>
          <p className="text-cream/60 max-w-lg mx-auto">
            From gourmet entrées to indulgent desserts — every dish is crafted with passion.
          </p>
        </div>
      </section>

      {/* Filters */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          {/* Category tabs */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setCategory('')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                !category ? 'bg-navy text-cream' : 'bg-white text-navy/60 hover:bg-cream border border-cream-dark'
              }`}
            >
              All
            </button>
            {categories.map(c => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`px-4 py-2 rounded-full text-sm font-medium capitalize transition-all ${
                  category === c ? 'bg-navy text-cream' : 'bg-white text-navy/60 hover:bg-cream border border-cream-dark'
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-64">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search dishes..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-white border border-cream-dark focus:border-gold focus:outline-none text-navy transition-colors"
            />
          </div>
        </div>
      </section>

      {/* Meal Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        {isLoading ? <Loading /> : filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted text-lg">No dishes found. Add meals from the admin panel.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filtered.map(meal => (
              <div
                key={meal.id}
                className="group bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border border-cream-dark"
              >
                <div className="h-52 overflow-hidden relative">
                  <img
                    src={meal.photo || 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600'}
                    alt={meal.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-4 left-4">
                    <span className="bg-navy/80 backdrop-blur text-cream text-xs px-3 py-1.5 rounded-full capitalize font-medium">
                      {meal.category || 'Main'}
                    </span>
                  </div>
                </div>

                <div className="p-5">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-serif text-lg font-bold text-navy group-hover:text-gold-dark transition-colors">
                      {meal.name}
                    </h3>
                    <span className="text-gold font-bold">KES {meal.price?.toLocaleString()}</span>
                  </div>
                  <p className="text-muted text-sm leading-relaxed mb-3">{meal.description}</p>

                  {meal.dietary?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {meal.dietary.map(d => (
                        <span key={d} className="bg-cream text-navy/60 text-xs px-2.5 py-1 rounded-full capitalize">
                          {d}
                        </span>
                      ))}
                    </div>
                  )}

                  {!meal.available && (
                    <span className="inline-block mt-3 text-red-500 text-xs font-medium">Currently unavailable</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
