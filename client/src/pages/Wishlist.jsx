import { Link } from 'react-router-dom';
import { useWishlist } from '../context/WishlistContext';

export default function Wishlist() {
  const { wishlist, toggle } = useWishlist();

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-serif font-bold text-navy">My Wishlist</h1>
          <p className="text-muted text-sm mt-1">{wishlist.length} saved room{wishlist.length !== 1 ? 's' : ''}</p>
        </div>
        <Link to="/rooms" className="text-gold hover:text-gold-dark text-sm font-medium transition-colors">
          Browse more rooms →
        </Link>
      </div>

      {wishlist.length === 0 ? (
        <div className="bg-white rounded-2xl border border-cream-dark p-16 text-center">
          <div className="text-5xl mb-4">🤍</div>
          <h3 className="text-xl font-serif font-bold text-navy mb-2">No saved rooms yet</h3>
          <p className="text-muted text-sm mb-6">Click the heart icon on any room to save it here.</p>
          <Link to="/rooms" className="inline-block bg-gold hover:bg-gold-light text-navy font-bold px-6 py-3 rounded-xl text-sm uppercase tracking-widest transition-all">
            Browse Rooms
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {wishlist.map(room => {
            const photo = room.photo
              ? (typeof room.photo === 'string' ? room.photo : room.photo.thumb)
              : 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=600';
            return (
              <div key={room.id} className="bg-white rounded-2xl border border-cream-dark overflow-hidden shadow-md hover:shadow-xl transition-all group">
                <div className="relative h-48 overflow-hidden">
                  <img src={photo} alt={room.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <button onClick={() => toggle(room)}
                    className="absolute top-3 right-3 w-9 h-9 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-md transition-all">
                    <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </button>
                </div>
                <div className="p-5">
                  <h3 className="font-serif font-bold text-navy mb-1">{room.name}</h3>
                  <p className="text-gold font-bold mb-4">KES {room.price?.toLocaleString()}<span className="text-muted font-normal text-sm">/night</span></p>
                  <div className="flex gap-2">
                    <Link to={`/rooms/${room.id}`}
                      className="flex-1 text-center bg-cream hover:bg-cream-dark text-navy font-semibold py-2.5 rounded-xl text-sm transition-all border border-cream-dark">
                      View Room
                    </Link>
                    <Link to={`/booking/${room.id}`}
                      className="flex-1 text-center bg-gold hover:bg-gold-light text-navy font-bold py-2.5 rounded-xl text-sm transition-all">
                      Book Now
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
