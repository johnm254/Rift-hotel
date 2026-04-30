import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import Loading from '../components/Loading';

export default function RoomDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activePhoto, setActivePhoto] = useState(0);

  const { data: room, isLoading } = useQuery({
    queryKey: ['room', id],
    queryFn: () => api.get(`/rooms/${id}`).then(r => r.data),
  });

  if (isLoading) return <Loading />;
  if (!room) return <div className="text-center py-20 text-muted">Room not found.</div>;

  const photos = room.photos?.length ? room.photos : ['https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=1200'];

  return (
    <div>
      {/* Photo Gallery */}
      <section className="relative h-[50vh] md:h-[60vh] bg-navy">
        <img
          src={photos[activePhoto]}
          alt={room.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-navy/60 to-transparent"></div>

        {/* Photo nav */}
        {photos.length > 1 && (
          <>
            <button
              onClick={() => setActivePhoto(p => (p - 1 + photos.length) % photos.length)}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-navy/60 hover:bg-navy/80 text-white w-12 h-12 rounded-full flex items-center justify-center text-xl backdrop-blur transition-all"
            >
              ‹
            </button>
            <button
              onClick={() => setActivePhoto(p => (p + 1) % photos.length)}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-navy/60 hover:bg-navy/80 text-white w-12 h-12 rounded-full flex items-center justify-center text-xl backdrop-blur transition-all"
            >
              ›
            </button>
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
              {photos.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActivePhoto(i)}
                  className={`w-2.5 h-2.5 rounded-full transition-all ${i === activePhoto ? 'bg-gold w-8' : 'bg-white/50 hover:bg-white/70'}`}
                />
              ))}
            </div>
          </>
        )}

        {/* Title overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl md:text-5xl font-serif font-bold text-white mb-2">{room.name}</h1>
            <div className="flex items-center gap-3">
              <span className="text-gold font-bold text-2xl">KES {room.price?.toLocaleString()}</span>
              <span className="text-cream/50">/ night</span>
              <span className="text-cream/30">·</span>
              <span className="text-cream/50">🛏 {room.capacity} guests</span>
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Main */}
          <div className="lg:col-span-2 space-y-8">
            <div>
              <h2 className="text-2xl font-serif font-bold text-navy mb-4">About This Room</h2>
              <p className="text-muted leading-relaxed whitespace-pre-line">{room.description}</p>
            </div>

            {room.amenities?.length > 0 && (
              <div>
                <h2 className="text-2xl font-serif font-bold text-navy mb-4">Amenities</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {room.amenities.map(a => (
                    <div key={a} className="flex items-center gap-2 bg-cream px-4 py-3 rounded-xl">
                      <span className="text-gold">✓</span>
                      <span className="text-navy/70 text-sm">{a}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Photo thumbnails */}
            {photos.length > 1 && (
              <div>
                <h2 className="text-2xl font-serif font-bold text-navy mb-4">Gallery</h2>
                <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                  {photos.map((p, i) => (
                    <button
                      key={i}
                      onClick={() => setActivePhoto(i)}
                      className={`rounded-xl overflow-hidden h-24 ring-2 ring-offset-2 transition-all ${i === activePhoto ? 'ring-gold ring-offset-white' : 'ring-transparent hover:ring-cream-dark'}`}
                    >
                      <img src={p} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Booking sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 bg-white rounded-2xl shadow-xl border border-cream-dark p-6 space-y-5">
              <div className="text-center">
                <div className="text-3xl font-bold text-navy">KES {room.price?.toLocaleString()}</div>
                <div className="text-muted text-sm">per night</div>
              </div>

              <hr className="border-cream-dark" />

              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-muted">
                  <span>Capacity</span>
                  <span className="font-medium text-navy">{room.capacity} guests</span>
                </div>
                {room.amenities?.length > 0 && (
                  <div className="flex justify-between text-muted">
                    <span>Amenities</span>
                    <span className="font-medium text-navy">{room.amenities.length} features</span>
                  </div>
                )}
                <div className="flex justify-between text-muted">
                  <span>Availability</span>
                  <span className={`font-medium ${room.available ? 'text-green-600' : 'text-red-500'}`}>
                    {room.available ? 'Available' : 'Unavailable'}
                  </span>
                </div>
              </div>

              {room.available ? (
                user ? (
                  <button
                    onClick={() => navigate(`/booking/${room.id}`)}
                    className="w-full bg-gold hover:bg-gold-light text-navy font-bold py-4 rounded-xl text-sm uppercase tracking-widest transition-all shadow-lg shadow-gold/20"
                  >
                    Book This Room
                  </button>
                ) : (
                  <Link
                    to="/login"
                    className="block text-center w-full bg-gold hover:bg-gold-light text-navy font-bold py-4 rounded-xl text-sm uppercase tracking-widest transition-all shadow-lg shadow-gold/20"
                  >
                    Sign In to Book
                  </Link>
                )
              ) : (
                <button disabled className="w-full bg-muted/20 text-muted font-bold py-4 rounded-xl text-sm uppercase tracking-widest cursor-not-allowed">
                  Currently Unavailable
                </button>
              )}

              <p className="text-center text-muted text-xs">No payment required to book. You'll be charged at check-in.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
