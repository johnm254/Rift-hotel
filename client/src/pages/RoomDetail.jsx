import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import Loading from '../components/Loading';
import { mockRooms, mockReviews } from '../lib/mockData';

// ── Lightbox ──────────────────────────────────────────────────────────────────
function Lightbox({ photos, index, onClose }) {
  const [current, setCurrent] = useState(index);
  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center" onClick={onClose}>
      <button onClick={onClose} className="absolute top-4 right-4 text-white/70 hover:text-white text-3xl w-12 h-12 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-all">✕</button>
      <button
        onClick={e => { e.stopPropagation(); setCurrent(p => (p - 1 + photos.length) % photos.length); }}
        className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white text-3xl w-12 h-12 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-all"
      >‹</button>
      <img
        src={photos[current]}
        alt=""
        className="max-h-[85vh] max-w-[90vw] object-contain rounded-lg"
        onClick={e => e.stopPropagation()}
      />
      <button
        onClick={e => { e.stopPropagation(); setCurrent(p => (p + 1) % photos.length); }}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white text-3xl w-12 h-12 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-all"
      >›</button>
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {photos.map((_, i) => (
          <button key={i} onClick={e => { e.stopPropagation(); setCurrent(i); }}
            className={`w-2 h-2 rounded-full transition-all ${i === current ? 'bg-gold w-6' : 'bg-white/40 hover:bg-white/60'}`} />
        ))}
      </div>
      <div className="absolute bottom-4 right-4 text-white/50 text-sm">{current + 1} / {photos.length}</div>
    </div>
  );
}

// ── Availability Calendar ─────────────────────────────────────────────────────
function AvailabilityCalendar({ bookedRanges = [] }) {
  const today = new Date();
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const isBooked = (day) => {
    const d = new Date(year, month, day);
    return bookedRanges.some(({ checkIn, checkOut }) => {
      const start = new Date(checkIn);
      const end = new Date(checkOut);
      return d >= start && d < end;
    });
  };

  const isPast = (day) => new Date(year, month, day) < new Date(today.getFullYear(), today.getMonth(), today.getDate());

  const monthName = viewDate.toLocaleDateString('en-KE', { month: 'long', year: 'numeric' });

  return (
    <div className="bg-white border border-cream-dark rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-serif font-bold text-navy">Availability</h3>
        <div className="flex items-center gap-2">
          <button onClick={() => setViewDate(new Date(year, month - 1, 1))}
            className="w-8 h-8 rounded-lg bg-cream hover:bg-cream-dark flex items-center justify-center text-navy transition-colors">‹</button>
          <span className="text-sm font-medium text-navy min-w-[130px] text-center">{monthName}</span>
          <button onClick={() => setViewDate(new Date(year, month + 1, 1))}
            className="w-8 h-8 rounded-lg bg-cream hover:bg-cream-dark flex items-center justify-center text-navy transition-colors">›</button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
          <div key={d} className="text-center text-xs font-semibold text-muted py-1">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {Array(firstDay).fill(null).map((_, i) => <div key={`e-${i}`} />)}
        {Array(daysInMonth).fill(null).map((_, i) => {
          const day = i + 1;
          const booked = isBooked(day);
          const past = isPast(day);
          return (
            <div key={day} className={`aspect-square flex items-center justify-center rounded-lg text-xs font-medium transition-all
              ${past ? 'text-muted/40 cursor-not-allowed' :
                booked ? 'bg-red-100 text-red-500 cursor-not-allowed line-through' :
                'bg-green-50 text-green-700 hover:bg-green-100 cursor-pointer'}`}>
              {day}
            </div>
          );
        })}
      </div>

      <div className="flex gap-4 mt-4 text-xs text-muted">
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-green-100 border border-green-200"></div> Available</div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-red-100 border border-red-200"></div> Booked</div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-cream-dark"></div> Past</div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function RoomDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activePhoto, setActivePhoto] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState(null);

  const { data: room, isLoading } = useQuery({
    queryKey: ['room', id],
    queryFn: () => api.get(`/rooms/${id}`).then(r => r.data)
      .catch(() => mockRooms.find(r => r.id === id) || null),
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ['reviews', id],
    queryFn: () => api.get(`/rooms/${id}/reviews`).then(r => r.data)
      .catch(() => mockReviews.filter(r => r.roomId === id)),
    enabled: !!id,
  });

  // Fetch booked dates for this room
  const { data: bookedRanges = [] } = useQuery({
    queryKey: ['roomBookings', id],
    queryFn: () => api.get(`/bookings?roomId=${id}&status=approved`).then(r => {
      const d = r.data;
      const arr = Array.isArray(d) ? d : (d.bookings || []);
      return arr.map(b => ({ checkIn: b.checkIn, checkOut: b.checkOut }));
    }).catch(() => []),
    enabled: !!id,
  });

  // Similar rooms
  const { data: allRooms = [] } = useQuery({
    queryKey: ['rooms'],
    queryFn: () => api.get('/rooms').then(r => {
      const d = r.data;
      const arr = Array.isArray(d) ? d : (d.rooms || d.data || []);
      return arr.length > 0 ? arr : mockRooms;
    }).catch(() => mockRooms),
  });

  if (isLoading) return <Loading />;
  if (!room) return <div className="text-center py-20 text-muted">Room not found.</div>;

  const photos = room.photos?.length
    ? room.photos.map(p => (typeof p === 'string' ? p : p.full))
    : ['https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=1200'];

  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  const similarRooms = allRooms
    .filter(r => r.id !== id && r.available)
    .sort((a, b) => Math.abs(a.price - room.price) - Math.abs(b.price - room.price))
    .slice(0, 3);

  return (
    <div>
      {/* Lightbox */}
      {lightboxIndex !== null && (
        <Lightbox photos={photos} index={lightboxIndex} onClose={() => setLightboxIndex(null)} />
      )}

      {/* Photo Gallery */}
      <section className="relative h-[50vh] md:h-[60vh] bg-navy">
        <img
          src={photos[activePhoto]}
          alt={room.name}
          className="w-full h-full object-cover cursor-zoom-in"
          onClick={() => setLightboxIndex(activePhoto)}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-navy/60 to-transparent pointer-events-none" />

        {/* Expand hint */}
        <button onClick={() => setLightboxIndex(activePhoto)}
          className="absolute top-4 right-4 bg-navy/60 hover:bg-navy/80 backdrop-blur text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-all">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
          View all {photos.length} photos
        </button>

        {photos.length > 1 && (
          <>
            <button onClick={() => setActivePhoto(p => (p - 1 + photos.length) % photos.length)}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-navy/60 hover:bg-navy/80 text-white w-12 h-12 rounded-full flex items-center justify-center text-xl backdrop-blur transition-all">‹</button>
            <button onClick={() => setActivePhoto(p => (p + 1) % photos.length)}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-navy/60 hover:bg-navy/80 text-white w-12 h-12 rounded-full flex items-center justify-center text-xl backdrop-blur transition-all">›</button>
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
              {photos.map((_, i) => (
                <button key={i} onClick={() => setActivePhoto(i)}
                  className={`w-2.5 h-2.5 rounded-full transition-all ${i === activePhoto ? 'bg-gold w-8' : 'bg-white/50 hover:bg-white/70'}`} />
              ))}
            </div>
          </>
        )}

        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 pointer-events-none">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl md:text-5xl font-serif font-bold text-white mb-2">{room.name}</h1>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-gold font-bold text-2xl">KES {room.price?.toLocaleString()}</span>
              <span className="text-cream/50">/ night</span>
              <span className="text-cream/30">·</span>
              <span className="text-cream/50">🛏 {room.capacity} guests</span>
              {avgRating && (
                <>
                  <span className="text-cream/30">·</span>
                  <span className="text-gold">★ {avgRating}</span>
                  <span className="text-cream/50 text-sm">({reviews.length} reviews)</span>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Main */}
          <div className="lg:col-span-2 space-y-10">
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

            {/* Gallery with lightbox */}
            {photos.length > 1 && (
              <div>
                <h2 className="text-2xl font-serif font-bold text-navy mb-4">Gallery</h2>
                <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                  {photos.map((p, i) => (
                    <button key={i} onClick={() => setLightboxIndex(i)}
                      className={`rounded-xl overflow-hidden h-24 ring-2 ring-offset-2 transition-all hover:opacity-90 ${i === activePhoto ? 'ring-gold ring-offset-white' : 'ring-transparent hover:ring-cream-dark'}`}>
                      <img src={p} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted mt-2">Click any photo to view full screen</p>
              </div>
            )}

            {/* Reviews */}
            <div>
              <h2 className="text-2xl font-serif font-bold text-navy mb-6">
                Guest Reviews
                {avgRating && (
                  <span className="ml-3 text-lg font-normal text-gold">
                    ★ {avgRating} <span className="text-muted text-sm">({reviews.length})</span>
                  </span>
                )}
              </h2>
              {reviews.length === 0 ? (
                <div className="bg-cream rounded-2xl p-8 text-center">
                  <div className="text-3xl mb-2">💬</div>
                  <p className="text-muted">No reviews yet. Be the first to stay!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reviews.map(review => (
                    <div key={review.id} className="bg-white border border-cream-dark rounded-2xl p-5 shadow-sm">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center text-gold font-bold text-sm">
                            {review.userName?.[0]?.toUpperCase() || '?'}
                          </div>
                          <div>
                            <div className="font-semibold text-navy text-sm">{review.userName}</div>
                            <div className="text-xs text-muted">
                              {new Date(review.createdAt).toLocaleDateString('en-KE', { year: 'numeric', month: 'short', day: 'numeric' })}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map(s => (
                            <span key={s} className={`text-lg ${s <= review.rating ? 'text-gold' : 'text-cream-dark'}`}>★</span>
                          ))}
                        </div>
                      </div>
                      <p className="text-muted text-sm leading-relaxed">{review.comment}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-5">
            {/* Booking card */}
            <div className="sticky top-24 space-y-5">
              <div className="bg-white rounded-2xl shadow-xl border border-cream-dark p-6 space-y-5">
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
                  {avgRating && (
                    <div className="flex justify-between text-muted">
                      <span>Rating</span>
                      <span className="font-medium text-gold">★ {avgRating} / 5</span>
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
                    <button onClick={() => navigate(`/booking/${room.id}`)}
                      className="w-full bg-gold hover:bg-gold-light text-navy font-bold py-4 rounded-xl text-sm uppercase tracking-widest transition-all shadow-lg shadow-gold/20">
                      Book This Room
                    </button>
                  ) : (
                    <Link to="/login"
                      className="block text-center w-full bg-gold hover:bg-gold-light text-navy font-bold py-4 rounded-xl text-sm uppercase tracking-widest transition-all shadow-lg shadow-gold/20">
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

              {/* Availability calendar */}
              <AvailabilityCalendar bookedRanges={bookedRanges} />
            </div>
          </div>
        </div>
      </section>

      {/* Similar Rooms */}
      {similarRooms.length > 0 && (
        <section className="bg-cream py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <span className="text-gold text-sm uppercase tracking-widest font-semibold">You Might Also Like</span>
                <h2 className="text-2xl font-serif font-bold text-navy mt-1">Similar Rooms</h2>
              </div>
              <Link to="/rooms" className="text-gold hover:text-gold-dark text-sm font-medium transition-colors">
                View all rooms →
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {similarRooms.map(r => {
                const photo = r.photos?.[0]
                  ? (typeof r.photos[0] === 'string' ? r.photos[0] : r.photos[0].thumb)
                  : 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=600';
                return (
                  <Link key={r.id} to={`/rooms/${r.id}`}
                    className="group bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-cream-dark">
                    <div className="relative h-48 overflow-hidden">
                      <img src={photo} alt={r.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      <div className="absolute top-3 right-3 bg-gold text-navy font-bold px-2.5 py-1 rounded-full text-xs">
                        KES {r.price?.toLocaleString()}/night
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-serif font-bold text-navy group-hover:text-gold-dark transition-colors">{r.name}</h3>
                      <p className="text-muted text-xs mt-1 line-clamp-2">{r.description}</p>
                      <div className="flex items-center gap-2 mt-2 text-xs text-muted">
                        <span>🛏 {r.capacity} guests</span>
                        <span className="text-gold font-medium ml-auto">View →</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
