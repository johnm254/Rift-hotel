import { useState } from 'react';
import { Link } from 'react-router-dom';

const faqs = [
  {
    category: 'Check-in & Check-out',
    items: [
      { q: 'What are the check-in and check-out times?', a: 'Standard check-in is from 2:00 PM and check-out is by 11:00 AM. Early check-in and late check-out are available on request, subject to availability. Our Executive and Honeymoon packages include complimentary late checkout.' },
      { q: 'Can I check in early or check out late?', a: 'Yes. Early check-in (from 10 AM) and late check-out (until 2 PM) can be arranged for an additional fee of KES 3,000 each, subject to room availability. Guests on premium packages receive this complimentary.' },
      { q: 'Is there a 24-hour front desk?', a: 'Absolutely. Our front desk and concierge team are available around the clock, every day of the year. You can reach us by phone, WhatsApp, or in person at any time.' },
    ],
  },
  {
    category: 'Reservations & Cancellations',
    items: [
      { q: 'How do I make a reservation?', a: 'You can book directly through our website by browsing rooms and clicking "Book This Room". You can also call us at +254 700 000 000 or email reservations@azurahaven.com. Direct bookings always get the best rate.' },
      { q: 'What is your cancellation policy?', a: 'Cancellations made 48 hours or more before check-in receive a full refund. Cancellations within 48 hours are charged one night\'s stay. No-shows are charged the full booking amount. Special packages may have different terms — check your booking confirmation.' },
      { q: 'Can I modify my booking after confirmation?', a: 'Yes, date changes and room upgrades can be made up to 24 hours before check-in, subject to availability. Contact our reservations team and we\'ll do our best to accommodate your request.' },
      { q: 'Do you require a deposit?', a: 'For standard bookings, no deposit is required — you pay at check-in. For special packages, events, and bookings of 5+ nights, a 30% deposit is required to secure the reservation.' },
    ],
  },
  {
    category: 'Payments',
    items: [
      { q: 'What payment methods do you accept?', a: 'We accept M-Pesa (STK Push and Paybill), Visa, Mastercard, and cash (KES). All online payments are processed securely. We do not accept American Express or cryptocurrency.' },
      { q: 'Can I pay in foreign currency?', a: 'We accept USD and EUR at the front desk at the prevailing exchange rate. Card payments in foreign currencies are processed at your bank\'s exchange rate.' },
      { q: 'Is my card information secure?', a: 'Yes. All card transactions are processed through PCI-DSS compliant payment gateways. We never store your full card details on our servers.' },
    ],
  },
  {
    category: 'Amenities & Services',
    items: [
      { q: 'Is WiFi included?', a: 'Yes, high-speed WiFi is complimentary throughout the hotel — in all rooms, the lobby, restaurant, and pool area. Our Executive rooms feature dedicated high-bandwidth connections ideal for video calls and large file transfers.' },
      { q: 'Do you have a swimming pool?', a: 'Yes, we have a heated infinity pool open from 6 AM to 10 PM daily. Poolside Bungalow guests have direct private access. Towels and sunbeds are provided complimentary.' },
      { q: 'Is there a spa?', a: 'Our Azura Wellness Spa offers a full menu of treatments including massages, facials, body wraps, and couples treatments. The spa is open daily from 8 AM to 8 PM. Advance booking is recommended.' },
      { q: 'Do you offer airport transfers?', a: 'Yes, we offer private airport transfers to and from Jomo Kenyatta International Airport (JKIA) and Wilson Airport. The rate is KES 4,500 one way. Please book at least 24 hours in advance.' },
      { q: 'Is parking available?', a: 'Yes, complimentary secure parking is available for all guests in our underground car park. Valet parking is also available at no extra charge.' },
    ],
  },
  {
    category: 'Dining',
    items: [
      { q: 'What dining options are available?', a: 'We have three dining experiences: The Azura Restaurant (fine dining, open for breakfast, lunch, and dinner), The Terrace Bar (casual dining and cocktails, open until midnight), and In-Room Dining (available 24 hours).' },
      { q: 'Can you accommodate dietary requirements?', a: 'Absolutely. Our kitchen caters to vegetarian, vegan, gluten-free, halal, and other dietary needs. Please inform us at the time of booking or notify our restaurant team when you arrive.' },
      { q: 'Is breakfast included in the room rate?', a: 'Breakfast is included in most of our packages. Standard room bookings do not include breakfast by default, but it can be added for KES 2,500 per person per day. Check your specific package details.' },
    ],
  },
  {
    category: 'Policies',
    items: [
      { q: 'Are children welcome?', a: 'Yes, Azura Haven is family-friendly. Children under 5 stay free when sharing a room with parents. We offer a kids\' menu, a play area in the Family Suite, and babysitting services on request.' },
      { q: 'Are pets allowed?', a: 'We love animals, but unfortunately we do not accommodate pets at this time, with the exception of certified service animals. Please contact us in advance if you require assistance.' },
      { q: 'Is the hotel non-smoking?', a: 'Azura Haven is a non-smoking property. Smoking is permitted only in designated outdoor areas. A KES 15,000 deep-cleaning fee applies if smoking occurs in a room.' },
      { q: 'Do you host events and weddings?', a: 'Yes! Our events team specialises in weddings, corporate retreats, private dinners, and celebrations. We have indoor and outdoor venues accommodating 10 to 200 guests. Contact us for a bespoke quote.' },
    ],
  },
];

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-cream-dark last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-4 text-left gap-4 group"
      >
        <span className={`font-medium text-sm transition-colors ${open ? 'text-gold' : 'text-navy group-hover:text-gold'}`}>{q}</span>
        <span className={`text-gold text-xl flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-45' : ''}`}>+</span>
      </button>
      {open && (
        <div className="pb-4 text-sm text-muted leading-relaxed">
          {a}
        </div>
      )}
    </div>
  );
}

export default function FAQ() {
  const [activeCategory, setActiveCategory] = useState(null);

  const displayed = activeCategory
    ? faqs.filter(f => f.category === activeCategory)
    : faqs;

  return (
    <div>
      {/* Hero */}
      <section className="hero-gradient py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="text-gold text-sm uppercase tracking-widest font-semibold">Help Centre</span>
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-white mt-2 mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-cream/60 max-w-lg mx-auto">
            Everything you need to know before, during, and after your stay.
          </p>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Category filter */}
        <div className="flex flex-wrap gap-2 mb-10 justify-center">
          <button
            onClick={() => setActiveCategory(null)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${!activeCategory ? 'bg-navy text-cream' : 'bg-white text-navy/60 hover:bg-cream border border-cream-dark'}`}
          >
            All Topics
          </button>
          {faqs.map(f => (
            <button
              key={f.category}
              onClick={() => setActiveCategory(activeCategory === f.category ? null : f.category)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${activeCategory === f.category ? 'bg-navy text-cream' : 'bg-white text-navy/60 hover:bg-cream border border-cream-dark'}`}
            >
              {f.category}
            </button>
          ))}
        </div>

        {/* FAQ sections */}
        <div className="space-y-8">
          {displayed.map(section => (
            <div key={section.category} className="bg-white rounded-2xl shadow-sm border border-cream-dark p-6">
              <h2 className="text-lg font-serif font-bold text-navy mb-4 pb-3 border-b border-cream-dark">
                {section.category}
              </h2>
              <div>
                {section.items.map(item => (
                  <FAQItem key={item.q} q={item.q} a={item.a} />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Still have questions */}
        <div className="mt-12 bg-navy rounded-2xl p-8 text-center">
          <div className="text-3xl mb-3">💬</div>
          <h3 className="text-xl font-serif font-bold text-white mb-2">Still have questions?</h3>
          <p className="text-cream/60 text-sm mb-6">Our team is available 24/7 and happy to help with anything not covered here.</p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link to="/contact" className="bg-gold hover:bg-gold-light text-navy font-bold px-6 py-3 rounded-xl text-sm uppercase tracking-widest transition-all">
              Contact Us
            </Link>
            <a href="https://wa.me/254700000000" target="_blank" rel="noopener noreferrer"
              className="bg-green-500 hover:bg-green-600 text-white font-semibold px-6 py-3 rounded-xl text-sm uppercase tracking-widest transition-all">
              WhatsApp
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
