import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';

const staticOffers = [
  {
    id: 'honeymoon', badge: '💑 Most Popular', badgeColor: 'bg-pink-100 text-pink-700',
    title: 'Honeymoon Escape', subtitle: '3 nights · 2 guests',
    description: 'Begin your forever in absolute luxury. Champagne on arrival, couples spa, private candlelit dinner, and daily breakfast in bed.',
    price: 185000, originalPrice: 220000, roomId: 'room-6',
    image: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=80',
    includes: ['3 nights in Honeymoon Retreat','Champagne & roses on arrival','Couples spa (90 min)','Private candlelit dinner','Daily breakfast in bed','Late checkout (2 PM)'],
    tag: 'Romance',
  },
  {
    id: 'family', badge: '👨‍👩‍👧‍👦 Family Favourite', badgeColor: 'bg-blue-100 text-blue-700',
    title: 'Family Adventure', subtitle: '4 nights · up to 6 guests',
    description: 'Create memories that last a lifetime. Safari Family Suite with kids play area, daily activities, family dining, and a guided Nairobi National Park safari.',
    price: 210000, originalPrice: 260000, roomId: 'room-3',
    image: 'https://images.unsplash.com/photo-1598928506311-c55ed91a1066?w=800&q=80',
    includes: ['4 nights in Safari Family Suite','Daily breakfast for all guests','Kids activity programme','Nairobi National Park safari','Family dinner (1 evening)','Airport transfers'],
    tag: 'Family',
  },
  {
    id: 'business', badge: '💼 Business', badgeColor: 'bg-gray-100 text-gray-700',
    title: 'Executive Business Stay', subtitle: '2 nights · 1–2 guests',
    description: 'Stay productive and comfortable. Executive Business Room with high-speed WiFi, meeting room access, airport transfers, and a curated business amenity kit.',
    price: 52000, originalPrice: 65000, roomId: 'room-4',
    image: 'https://images.unsplash.com/photo-1591088398332-8a7791972843?w=800&q=80',
    includes: ['2 nights in Executive Business Room','Daily breakfast','Meeting room (4 hrs/day)','Airport transfers (both ways)','Business amenity kit','Express laundry service'],
    tag: 'Business',
  },
  {
    id: 'weekend', badge: '🌅 Weekend Deal', badgeColor: 'bg-amber-100 text-amber-700',
    title: 'Weekend Getaway', subtitle: '2 nights · 2 guests',
    description: 'Escape the city for a perfect weekend. Poolside Bungalow with direct pool access, sunset cocktails, a spa credit, and a romantic dinner for two.',
    price: 89000, originalPrice: 110000, roomId: 'room-5',
    image: 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800&q=80',
    includes: ['2 nights in Poolside Bungalow','Daily breakfast','Sunset cocktails (1 evening)','KES 5,000 spa credit','Romantic dinner for two','Late checkout (1 PM)'],
    tag: 'Leisure',
  },
  {
    id: 'spa', badge: '🧖 Wellness', badgeColor: 'bg-purple-100 text-purple-700',
    title: 'Spa & Wellness Retreat', subtitle: '3 nights · 1–2 guests',
    description: 'Completely disconnect and recharge. Three nights in our Deluxe Garden View room with daily spa treatments, yoga sessions, and healthy dining.',
    price: 145000, originalPrice: 175000, roomId: 'room-2',
    image: 'https://images.unsplash.com/photo-1595576508898-0ad5c879a061?w=800&q=80',
    includes: ['3 nights in Deluxe Garden View','Daily spa treatment (60 min)','Morning yoga sessions','Healthy breakfast & lunch','Meditation workshop','Wellness consultation'],
    tag: 'Wellness',
  },
  {
    id: 'longstay', badge: '📅 Long Stay', badgeColor: 'bg-green-100 text-green-700',
    title: 'Extended Stay Special', subtitle: '7+ nights · any room',
    description: 'Planning a longer visit? Enjoy 20% off our best available rate for stays of 7 nights or more, plus complimentary laundry and a dedicated concierge.',
    price: null, originalPrice: null, roomId: null,
    image: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800&q=80',
    includes: ['20% off best available rate','Complimentary laundry (weekly)','Welcome dinner on arrival','Dedicated personal concierge','Grocery delivery service','Flexible checkout'],
    tag: 'Value',
  },
];

export default function Offers() {
  const { data: pkgData } = useQuery({
    queryKey: ['packages'],
    queryFn: () => api.get('/packages').then(r => {
      const d = r.data;
      return Array.isArray(d) ? d : (d.packages || []);
    }).catch(() => []),
  });

  const offers = pkgData?.length > 0 ? pkgData : staticOffers;

  return (
    <div>
      <section className="hero-gradient py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="text-gold text-sm uppercase tracking-widest font-semibold">Exclusive Deals</span>
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-white mt-2 mb-4">Special Offers & Packages</h1>
          <p className="text-cream/60 max-w-lg mx-auto">Curated experiences designed to make your stay extraordinary — at exceptional value.</p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {offers.map(offer => {
            const savings = offer.originalPrice && offer.price ? offer.originalPrice - offer.price : null;
            const badgeColor = offer.badgeColor || 'bg-gold/20 text-gold-dark';
            const badge = offer.badge || `🎁 ${offer.tag || 'Special'}`;
            return (
              <div key={offer.id} className="bg-white rounded-2xl overflow-hidden shadow-lg border border-cream-dark hover:shadow-2xl transition-all duration-300 group">
                <div className="relative h-56 overflow-hidden">
                  <img src={offer.image || 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800'} alt={offer.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-navy/50 to-transparent" />
                  <div className="absolute top-4 left-4">
                    <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${badgeColor}`}>{badge}</span>
                  </div>
                  {savings > 0 && (
                    <div className="absolute top-4 right-4 bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-full">
                      Save KES {savings.toLocaleString()}
                    </div>
                  )}
                  {offer.subtitle && (
                    <div className="absolute bottom-4 left-4">
                      <span className="bg-navy/70 backdrop-blur text-cream text-xs px-3 py-1 rounded-full">{offer.subtitle}</span>
                    </div>
                  )}
                </div>
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-xl font-serif font-bold text-navy">{offer.title}</h3>
                      {offer.tag && <span className="text-xs text-gold font-medium uppercase tracking-widest">{offer.tag}</span>}
                    </div>
                    <div className="text-right">
                      {offer.price ? (
                        <>
                          <div className="text-2xl font-bold text-gold">KES {offer.price.toLocaleString()}</div>
                          {offer.originalPrice && <div className="text-xs text-muted line-through">KES {offer.originalPrice.toLocaleString()}</div>}
                        </>
                      ) : (
                        <div className="text-lg font-bold text-gold">From 20% off</div>
                      )}
                    </div>
                  </div>
                  <p className="text-muted text-sm leading-relaxed mb-4">{offer.description}</p>
                  {offer.includes?.length > 0 && (
                    <div className="bg-cream rounded-xl p-4 mb-5">
                      <div className="text-xs font-semibold text-navy uppercase tracking-widest mb-2">Package Includes</div>
                      <div className="grid grid-cols-2 gap-1">
                        {offer.includes.map((item, i) => (
                          <div key={i} className="flex items-start gap-1.5 text-xs text-muted">
                            <span className="text-gold mt-0.5 flex-shrink-0">✓</span>
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="flex gap-3">
                    {offer.roomId ? (
                      <Link to={`/booking/${offer.roomId}`}
                        className="flex-1 bg-gold hover:bg-gold-light text-navy font-bold py-3 rounded-xl text-sm uppercase tracking-widest transition-all text-center shadow-md shadow-gold/20">
                        Book This Package
                      </Link>
                    ) : (
                      <Link to="/contact"
                        className="flex-1 bg-gold hover:bg-gold-light text-navy font-bold py-3 rounded-xl text-sm uppercase tracking-widest transition-all text-center shadow-md shadow-gold/20">
                        Enquire Now
                      </Link>
                    )}
                    {offer.roomId && (
                      <Link to={`/rooms/${offer.roomId}`}
                        className="border-2 border-navy text-navy hover:bg-navy hover:text-cream font-semibold py-3 px-4 rounded-xl text-sm transition-all">
                        View Room
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="bg-navy py-16">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <div className="text-4xl mb-4">🎁</div>
          <h2 className="text-3xl font-serif font-bold text-white mb-4">Need a Custom Package?</h2>
          <p className="text-cream/60 mb-8">Planning a corporate retreat, anniversary, birthday, or group booking? Our events team will craft a bespoke package just for you.</p>
          <Link to="/contact" className="inline-block bg-gold hover:bg-gold-light text-navy font-bold px-8 py-4 rounded-lg text-sm uppercase tracking-widest transition-all shadow-lg shadow-gold/20">
            Talk to Our Team
          </Link>
        </div>
      </section>
    </div>
  );
}
