import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import api from '../lib/api';
import Loading from '../components/Loading';
import { mockRooms, mockMeals } from '../lib/mockData';

// Testimonials data
const testimonials = [
  { name: 'Sarah K.', country: 'Kenya', rating: 5, text: 'Absolutely breathtaking. The Presidential Suite exceeded every expectation — the butler service, the ocean view, the food. We will be back.', stay: 'Presidential Ocean Suite', avatar: 'S' },
  { name: 'James & Amina', country: 'UK', rating: 5, text: 'Our honeymoon was perfect. Rose petals, champagne, a private dinner under the stars. Azura Haven made it magical.', stay: 'Honeymoon Retreat', avatar: 'J' },
  { name: 'David L.', country: 'USA', rating: 5, text: 'I travel for business constantly. This is the first hotel where I genuinely did not want to leave. The Executive Room is world-class.', stay: 'Executive Business Room', avatar: 'D' },
  { name: 'Faith N.', country: 'Kenya', rating: 5, text: 'Brought the whole family — three kids included. The Safari Suite was incredible. Kids are still talking about it weeks later.', stay: 'Safari Family Suite', avatar: 'F' },
];

export default function Home() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState('2');
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (checkIn) params.set('checkIn', checkIn);
    if (checkOut) params.set('checkOut', checkOut);
    if (guests) params.set('guests', guests);
    navigate(`/rooms?${params.toString()}`);
  };
  const { data: rooms, isLoading } = useQuery({
    queryKey: ['rooms'],
    queryFn: () => api.get('/rooms').then(r => {
      const d = r.data;
      const arr = Array.isArray(d) ? d : (d.rooms || d.data || []);
      return arr.length > 0 ? arr : mockRooms;
    }).catch(() => mockRooms),
  });

  const { data: meals } = useQuery({
    queryKey: ['meals'],
    queryFn: () => api.get('/meals').then(r => {
      const d = r.data;
      const arr = Array.isArray(d) ? d : (d.meals || d.data || []);
      return arr.length > 0 ? arr : mockMeals;
    }).catch(() => mockMeals),
  });

  return (
    <div>
      {/* ===== HERO ===== */}
      <section className="relative text-white overflow-hidden min-h-[85vh] flex flex-col">
        {/* Background image */}
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1800&q=80"
            alt="Azura Haven Hotel"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-navy/90 via-navy/70 to-navy/30"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-navy/60 via-transparent to-transparent"></div>
        </div>

        <div className="relative flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 md:py-28 flex items-center">
          <div className="w-full max-w-3xl">
            <span className="inline-block bg-gold/20 backdrop-blur text-gold border border-gold/30 px-3 py-1 rounded-full text-xs sm:text-sm font-medium mb-4 sm:mb-6 tracking-wide uppercase">
              {t('welcomeToParadise')}
            </span>
            <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-serif font-bold mb-4 sm:mb-6 leading-tight">
              Experience <span className="text-gold">Luxury</span><br className="hidden sm:block"/>
              <span className="sm:hidden"> </span>Like Never Before
            </h1>
            <p className="text-base sm:text-lg text-cream/80 mb-6 sm:mb-8 leading-relaxed max-w-lg">
              {t('heroSubtitle')}
            </p>

            {/* ── Date Search Widget ── */}
            <form onSubmit={handleSearch} className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-2 sm:p-3 flex flex-col sm:flex-row gap-2 max-w-2xl">
              <div className="flex sm:flex-1 gap-2">
                <div className="flex-1 bg-white/10 rounded-xl px-3 py-2.5 sm:px-4 sm:py-3">
                  <label className="block text-gold text-xs font-semibold uppercase tracking-widest mb-1">Check-in</label>
                  <input type="date" value={checkIn} onChange={e => setCheckIn(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full bg-transparent text-white text-sm focus:outline-none [color-scheme:dark]" />
                </div>
                <div className="flex-1 bg-white/10 rounded-xl px-3 py-2.5 sm:px-4 sm:py-3">
                  <label className="block text-gold text-xs font-semibold uppercase tracking-widest mb-1">Check-out</label>
                  <input type="date" value={checkOut} onChange={e => setCheckOut(e.target.value)}
                    min={checkIn || new Date().toISOString().split('T')[0]}
                    className="w-full bg-transparent text-white text-sm focus:outline-none [color-scheme:dark]" />
                </div>
              </div>
              <div className="flex gap-2">
                <div className="bg-white/10 rounded-xl px-3 py-2.5 sm:px-4 sm:py-3 flex-1 sm:flex-none sm:min-w-[100px]">
                  <label className="block text-gold text-xs font-semibold uppercase tracking-widest mb-1">Guests</label>
                  <select value={guests} onChange={e => setGuests(e.target.value)}
                    className="w-full bg-transparent text-white text-sm focus:outline-none [color-scheme:dark]">
                    {[1,2,3,4,5,6].map(n => <option key={n} value={n} className="text-navy bg-white">{n} guest{n > 1 ? 's' : ''}</option>)}
                  </select>
                </div>
                <button type="submit"
                  className="bg-gold hover:bg-gold-light text-navy font-bold px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl text-sm uppercase tracking-widest transition-all shadow-lg shadow-gold/30 whitespace-nowrap flex-shrink-0">
                  Search
                </button>
              </div>
            </form>

            <div className="flex flex-wrap gap-3 sm:gap-4 mt-4 sm:mt-5">
              <Link to="/offers" className="text-cream/70 hover:text-gold text-xs sm:text-sm font-medium transition-colors flex items-center gap-1.5">
                🎁 View special offers →
              </Link>
              <Link to="/about" className="text-cream/70 hover:text-gold text-sm font-medium transition-colors flex items-center gap-1.5">
                🏨 About Azura Haven →
              </Link>
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <div className="relative bg-navy/80 backdrop-blur border-t border-gold/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 text-center">
            <Stat label="Rooms & Suites" value={rooms?.length || '—'} />
            <Stat label="Dining Options" value={meals?.length || '—'} />
            <Stat label="Guest Rating" value="4.9 ★" />
            <Stat label="Years of Service" value="15+" />
          </div>
        </div>
      </section>

      {/* ===== FEATURED ROOMS ===== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-12">
          <span className="text-gold text-sm uppercase tracking-widest font-semibold">Accommodations</span>
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-navy mt-2 mb-4">
            Our Premium Rooms
          </h2>
          <p className="text-muted max-w-md mx-auto">
            Choose from our carefully curated selection of rooms, each designed for your comfort.
          </p>
        </div>

        {isLoading ? <Loading /> : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {(rooms || []).slice(0, 3).map(room => (
              <RoomCard key={room.id} room={room} />
            ))}
          </div>
        )}

        <div className="text-center mt-10">
          <Link to="/rooms" className="inline-block border-2 border-navy text-navy hover:bg-navy hover:text-cream font-semibold px-8 py-3 rounded-lg text-sm uppercase tracking-widest transition-all">
            View All Rooms
          </Link>
        </div>
      </section>

      {/* ===== FEATURED DINING ===== */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-gold text-sm uppercase tracking-widest font-semibold">Culinary</span>
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-navy mt-2 mb-4">
              Exquisite Dining
            </h2>
            <p className="text-muted max-w-md mx-auto">
              Savor gourmet cuisine crafted by world-class chefs using the finest local ingredients.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {(meals || []).slice(0, 3).map(meal => (
              <MealCard key={meal.id} meal={meal} />
            ))}
          </div>

          <div className="text-center mt-10">
            <Link to="/meals" className="inline-block border-2 border-navy text-navy hover:bg-navy hover:text-cream font-semibold px-8 py-3 rounded-lg text-sm uppercase tracking-widest transition-all">
              Full Menu
            </Link>
          </div>
        </div>
      </section>

      {/* ===== TESTIMONIALS ===== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-12">
          <span className="text-gold text-sm uppercase tracking-widest font-semibold">Guest Stories</span>
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-navy mt-2 mb-4">
            What Our Guests Say
          </h2>
          <div className="flex justify-center gap-1 mb-2">
            {[1,2,3,4,5].map(s => <span key={s} className="text-gold text-xl">★</span>)}
          </div>
          <p className="text-muted text-sm">4.9 out of 5 · Based on 500+ reviews</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {testimonials.map((t, i) => (
            <div key={i}
              onClick={() => setActiveTestimonial(i)}
              className={`bg-white rounded-2xl p-6 border-2 cursor-pointer transition-all duration-300 hover:shadow-lg ${activeTestimonial === i ? 'border-gold shadow-lg shadow-gold/10' : 'border-cream-dark'}`}>
              <div className="flex gap-0.5 mb-3">
                {[1,2,3,4,5].map(s => <span key={s} className="text-gold text-sm">★</span>)}
              </div>
              <p className="text-muted text-sm leading-relaxed line-clamp-4 mb-4">"{t.text}"</p>
              <div className="flex items-center gap-3 mt-auto">
                <div className="w-9 h-9 rounded-full bg-gold/20 flex items-center justify-center text-gold font-bold text-sm flex-shrink-0">
                  {t.avatar}
                </div>
                <div>
                  <div className="font-semibold text-navy text-sm">{t.name}</div>
                  <div className="text-xs text-muted">{t.stay}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Featured testimonial */}
        <div className="bg-navy rounded-2xl p-8 md:p-12 text-center max-w-3xl mx-auto">
          <div className="text-4xl mb-4">❝</div>
          <p className="text-cream/90 text-lg md:text-xl leading-relaxed font-serif italic mb-6">
            {testimonials[activeTestimonial].text}
          </p>
          <div className="flex items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gold/20 flex items-center justify-center text-gold font-bold text-lg">
              {testimonials[activeTestimonial].avatar}
            </div>
            <div className="text-left">
              <div className="font-bold text-gold">{testimonials[activeTestimonial].name}</div>
              <div className="text-cream/50 text-sm">{testimonials[activeTestimonial].country} · {testimonials[activeTestimonial].stay}</div>
            </div>
          </div>
          <div className="flex justify-center gap-2 mt-6">
            {testimonials.map((_, i) => (
              <button key={i} onClick={() => setActiveTestimonial(i)}
                className={`w-2 h-2 rounded-full transition-all ${i === activeTestimonial ? 'bg-gold w-6' : 'bg-cream/30 hover:bg-cream/50'}`} />
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="hero-gradient py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-white mb-4">
            Ready to Experience <span className="text-gold">Azura Haven</span>?
          </h2>
          <p className="text-cream/60 mb-8 max-w-lg mx-auto">
            Book your stay today and discover why we're Kenya's premier luxury destination.
          </p>
          <Link to="/rooms" className="inline-block bg-gold hover:bg-gold-light text-navy font-bold px-10 py-4 rounded-lg text-sm uppercase tracking-widest transition-all shadow-lg shadow-gold/20">
            Book Your Stay
          </Link>
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div>
      <div className="text-2xl font-bold text-gold">{value}</div>
      <div className="text-cream/50 text-xs uppercase tracking-wider mt-1">{label}</div>
    </div>
  );
}

function RoomCard({ room }) {
  const photo = room.photos?.[0]
    ? (typeof room.photos[0] === 'string' ? room.photos[0] : room.photos[0].thumb)
    : 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=600';

  return (
    <Link to={`/rooms/${room.id}`} className="group block bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border border-cream-dark">
      <div className="relative h-56 overflow-hidden">
        <img
          src={photo}
          alt={room.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute top-4 right-4 bg-gold text-navy font-bold px-3 py-1 rounded-full text-sm">
          KES {room.price?.toLocaleString()}/night
        </div>
      </div>
      <div className="p-5">
        <h3 className="font-serif text-xl font-bold text-navy mb-2 group-hover:text-gold-dark transition-colors">
          {room.name}
        </h3>
        <p className="text-muted text-sm line-clamp-2 mb-3">{room.description}</p>
        <div className="flex items-center gap-3 text-xs text-muted">
          <span>🛏 {room.capacity} guests</span>
          <span className="text-gold">View Details →</span>
        </div>
      </div>
    </Link>
  );
}

function MealCard({ meal }) {
  return (
    <div className="group bg-cream rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
      <div className="h-48 overflow-hidden">
        <img 
          src={meal.photo || 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600'} 
          alt={meal.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
      </div>
      <div className="p-5">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-serif text-lg font-bold text-navy">{meal.name}</h3>
          <span className="text-gold font-bold text-sm">KES {meal.price?.toLocaleString()}</span>
        </div>
        <p className="text-muted text-sm line-clamp-2">{meal.description}</p>
        {meal.dietary?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {meal.dietary.map(d => (
              <span key={d} className="bg-cream-dark text-navy/60 text-xs px-2 py-1 rounded-full">{d}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
