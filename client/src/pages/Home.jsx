import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import Loading from '../components/Loading';

export default function Home() {
  const { data: rooms, isLoading } = useQuery({
    queryKey: ['rooms'],
    queryFn: () => api.get('/rooms').then(r => r.data),
  });

  const { data: meals } = useQuery({
    queryKey: ['meals'],
    queryFn: () => api.get('/meals').then(r => r.data),
  });

  return (
    <div>
      {/* ===== HERO ===== */}
      <section className="hero-gradient text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: 'radial-gradient(circle at 20% 30%, #C9A96E 1px, transparent 1px)',
          backgroundSize: '50px 50px'
        }}></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32 relative">
          <div className="max-w-2xl">
            <span className="inline-block bg-gold/20 text-gold px-4 py-1.5 rounded-full text-sm font-medium mb-6 tracking-wide uppercase">
              Welcome to Paradise
            </span>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-serif font-bold mb-6 leading-tight">
              Experience <span className="text-gold">Luxury</span><br/>Like Never Before
            </h1>
            <p className="text-lg text-cream/70 mb-8 leading-relaxed max-w-lg">
              Nestled in the heart of Kenya, Azura Haven offers world-class hospitality, 
              exquisite dining, and unforgettable experiences.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/rooms" className="bg-gold hover:bg-gold-light text-navy font-bold px-8 py-4 rounded-lg text-sm uppercase tracking-widest transition-all shadow-lg shadow-gold/20">
                Explore Rooms
              </Link>
              <Link to="/meals" className="border-2 border-cream/30 hover:border-gold text-cream hover:text-gold font-semibold px-8 py-4 rounded-lg text-sm uppercase tracking-widest transition-all">
                View Dining
              </Link>
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <div className="bg-navy-dark/60 backdrop-blur border-t border-gold/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
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
  return (
    <Link to={`/rooms/${room.id}`} className="group block bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border border-cream-dark">
      <div className="relative h-56 overflow-hidden">
        <img 
          src={room.photos?.[0] || 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=600'} 
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
