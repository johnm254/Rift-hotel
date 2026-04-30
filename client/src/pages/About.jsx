import { Link } from 'react-router-dom';

const team = [
  { name: 'James Mwangi', role: 'General Manager', img: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=300&h=300&fit=crop&crop=face', bio: '20 years in luxury hospitality across East Africa.' },
  { name: 'Amina Hassan', role: 'Head Chef', img: 'https://images.unsplash.com/photo-1607631568010-a87245c0daf8?w=300&h=300&fit=crop&crop=face', bio: 'Trained in Paris, passionate about Swahili fusion cuisine.' },
  { name: 'David Ochieng', role: 'Guest Relations', img: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&h=300&fit=crop&crop=face', bio: 'Dedicated to making every guest feel at home.' },
  { name: 'Grace Wanjiku', role: 'Spa Director', img: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&h=300&fit=crop&crop=face', bio: 'Certified wellness expert with a holistic approach.' },
];

const awards = [
  { year: '2024', title: 'Best Luxury Hotel', org: 'Kenya Tourism Awards' },
  { year: '2023', title: 'Top 10 African Resorts', org: 'Condé Nast Traveller' },
  { year: '2023', title: 'Excellence in Hospitality', org: 'East Africa Business Awards' },
  { year: '2022', title: 'Best Dining Experience', org: 'Nairobi Food & Travel' },
];

export default function About() {
  return (
    <div>
      {/* Hero */}
      <section className="relative h-[50vh] overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1800&q=80"
          alt="Azura Haven"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-navy/85 via-navy/60 to-transparent" />
        <div className="absolute inset-0 flex items-center">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <span className="text-gold text-sm uppercase tracking-widest font-semibold">Our Story</span>
            <h1 className="text-4xl md:text-6xl font-serif font-bold text-white mt-2 mb-4">
              About Azura Haven
            </h1>
            <p className="text-cream/70 max-w-lg text-lg">
              Where Kenyan warmth meets world-class luxury.
            </p>
          </div>
        </div>
      </section>

      {/* Story */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <span className="text-gold text-sm uppercase tracking-widest font-semibold">Est. 2009</span>
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-navy mt-2 mb-6">
              A Legacy of Luxury
            </h2>
            <div className="space-y-4 text-muted leading-relaxed">
              <p>
                Azura Haven was founded in 2009 with a single vision: to create a sanctuary where the rich culture and natural beauty of Kenya could be experienced alongside the finest comforts in the world.
              </p>
              <p>
                Nestled in the heart of Nairobi, our hotel has grown from a boutique property of 12 rooms to a full luxury resort with 6 signature suites, a world-class spa, and multiple dining experiences — all while preserving the intimate, personal service that made us famous.
              </p>
              <p>
                Every detail at Azura Haven — from the hand-carved furniture sourced from local artisans to the farm-to-table ingredients in our kitchen — reflects our deep commitment to Kenya and to our guests.
              </p>
            </div>
            <div className="flex gap-8 mt-8">
              {[['15+', 'Years of Service'], ['6', 'Signature Suites'], ['4.9★', 'Guest Rating'], ['50K+', 'Happy Guests']].map(([val, label]) => (
                <div key={label}>
                  <div className="text-2xl font-bold text-gold">{val}</div>
                  <div className="text-xs text-muted uppercase tracking-wide mt-1">{label}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <img src="https://images.unsplash.com/photo-1582719508461-905c673771fd?w=600&q=80" alt="Hotel lobby" className="rounded-2xl object-cover h-64 w-full" />
            <img src="https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=600&q=80" alt="Pool" className="rounded-2xl object-cover h-64 w-full mt-8" />
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="bg-navy py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-gold text-sm uppercase tracking-widest font-semibold">What We Stand For</span>
            <h2 className="text-3xl font-serif font-bold text-white mt-2">Our Values</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: '🌿', title: 'Sustainability', desc: 'We source locally, reduce waste, and invest in the communities around us. Luxury should never come at the planet\'s expense.' },
              { icon: '🤝', title: 'Genuine Hospitality', desc: 'Every guest is family. We remember your name, your preferences, and we go beyond the expected to make you feel truly welcome.' },
              { icon: '✨', title: 'Uncompromising Quality', desc: 'From the thread count of our linens to the freshness of our ingredients — we obsess over every detail so you don\'t have to.' },
            ].map(v => (
              <div key={v.title} className="bg-navy-light rounded-2xl p-8 border border-gold/10">
                <div className="text-4xl mb-4">{v.icon}</div>
                <h3 className="text-xl font-serif font-bold text-gold mb-3">{v.title}</h3>
                <p className="text-cream/60 text-sm leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-12">
          <span className="text-gold text-sm uppercase tracking-widest font-semibold">The People Behind the Magic</span>
          <h2 className="text-3xl font-serif font-bold text-navy mt-2">Meet Our Team</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {team.map(member => (
            <div key={member.name} className="text-center group">
              <div className="w-32 h-32 rounded-full overflow-hidden mx-auto mb-4 ring-4 ring-cream-dark group-hover:ring-gold transition-all duration-300">
                <img src={member.img} alt={member.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              </div>
              <h3 className="font-serif font-bold text-navy text-lg">{member.name}</h3>
              <p className="text-gold text-sm font-medium mb-2">{member.role}</p>
              <p className="text-muted text-sm">{member.bio}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Awards */}
      <section className="bg-cream py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <span className="text-gold text-sm uppercase tracking-widest font-semibold">Recognition</span>
            <h2 className="text-3xl font-serif font-bold text-navy mt-2">Awards & Accolades</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {awards.map(a => (
              <div key={a.title} className="bg-white rounded-2xl p-6 border border-cream-dark shadow-sm text-center">
                <div className="text-3xl mb-3">🏆</div>
                <div className="text-xs text-muted uppercase tracking-widest mb-1">{a.year}</div>
                <div className="font-serif font-bold text-navy mb-1">{a.title}</div>
                <div className="text-xs text-gold">{a.org}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="hero-gradient py-16">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-serif font-bold text-white mb-4">Come Experience It Yourself</h2>
          <p className="text-cream/60 mb-8">Words can only say so much. Let us show you what Azura Haven truly means.</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link to="/rooms" className="bg-gold hover:bg-gold-light text-navy font-bold px-8 py-4 rounded-lg text-sm uppercase tracking-widest transition-all shadow-lg shadow-gold/20">
              Browse Rooms
            </Link>
            <Link to="/contact" className="border-2 border-cream/30 hover:border-gold text-cream hover:text-gold font-semibold px-8 py-4 rounded-lg text-sm uppercase tracking-widest transition-all">
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
