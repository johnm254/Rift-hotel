import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-navy-dark border-t border-gold/10 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">🏨</span>
              <span className="font-serif text-xl text-gold font-bold">Azura Haven</span>
            </div>
            <p className="text-cream/50 text-sm leading-relaxed">
              Experience unparalleled luxury and comfort. Your perfect stay begins here.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-gold font-semibold mb-4 text-sm uppercase tracking-widest">Explore</h4>
            <div className="space-y-2">
              <FooterLink to="/rooms">Rooms & Suites</FooterLink>
              <FooterLink to="/meals">Dining</FooterLink>
              <FooterLink to="/login">Book Now</FooterLink>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-gold font-semibold mb-4 text-sm uppercase tracking-widest">Contact</h4>
            <div className="space-y-2 text-cream/50 text-sm">
              <p>📍 Nairobi, Kenya</p>
              <p>📞 +254 700 000 000</p>
              <p>✉️ reservations@azurahaven.com</p>
            </div>
          </div>

          {/* Payments */}
          <div>
            <h4 className="text-gold font-semibold mb-4 text-sm uppercase tracking-widest">Payments</h4>
            <div className="flex flex-wrap gap-2">
              <span className="bg-navy px-3 py-1.5 rounded text-xs text-cream/60 border border-cream/10">M-Pesa</span>
              <span className="bg-navy px-3 py-1.5 rounded text-xs text-cream/60 border border-cream/10">Visa</span>
              <span className="bg-navy px-3 py-1.5 rounded text-xs text-cream/60 border border-cream/10">Mastercard</span>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-cream/10 text-center text-cream/30 text-xs">
          © {new Date().getFullYear()} Azura Haven. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

function FooterLink({ to, children }) {
  return (
    <Link to={to} className="block text-cream/50 hover:text-gold text-sm transition-colors">
      {children}
    </Link>
  );
}
