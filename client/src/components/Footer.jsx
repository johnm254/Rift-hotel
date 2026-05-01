import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer style={{ backgroundColor: '#0f172a', borderTop: '1px solid rgba(201,169,110,0.1)' }} className="mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">🏨</span>
              <span className="font-serif text-xl font-bold" style={{ color: '#C9A96E' }}>Azura Haven</span>
            </div>
            <p className="text-sm leading-relaxed mb-5 max-w-xs" style={{ color: 'rgba(245,241,235,0.6)' }}>
              Kenya's premier luxury hotel. Where world-class hospitality meets the warmth of home.
            </p>
            <div className="space-y-2 text-sm" style={{ color: 'rgba(245,241,235,0.6)' }}>
              <p>📍 Westlands, Nairobi, Kenya</p>
              <p>📞 +254 700 000 000</p>
              <p>✉️ reservations@azurahaven.com</p>
            </div>
            <a href="https://wa.me/254700000000" target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-4 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-all">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              WhatsApp Us
            </a>
          </div>

          {/* Explore */}
          <div>
            <h4 className="font-semibold mb-4 text-sm uppercase tracking-widest" style={{ color: '#C9A96E' }}>Explore</h4>
            <div className="space-y-2.5">
              <FooterLink to="/rooms">Rooms & Suites</FooterLink>
              <FooterLink to="/meals">Dining</FooterLink>
              <FooterLink to="/offers">Special Offers</FooterLink>
              <FooterLink to="/about">About Us</FooterLink>
              <FooterLink to="/transfer">Airport Transfer</FooterLink>
            </div>
          </div>

          {/* Help */}
          <div>
            <h4 className="font-semibold mb-4 text-sm uppercase tracking-widest" style={{ color: '#C9A96E' }}>Help</h4>
            <div className="space-y-2.5">
              <FooterLink to="/faq">FAQ</FooterLink>
              <FooterLink to="/contact">Contact Us</FooterLink>
              <FooterLink to="/login">Book Now</FooterLink>
              <FooterLink to="/profile">My Bookings</FooterLink>
            </div>
          </div>

          {/* Payments & Social */}
          <div>
            <h4 className="font-semibold mb-4 text-sm uppercase tracking-widest" style={{ color: '#C9A96E' }}>Payments</h4>
            <div className="flex flex-wrap gap-2 mb-6">
              {['M-Pesa', 'Visa', 'Mastercard', 'Cash'].map(p => (
                <span key={p} className="px-3 py-1.5 rounded text-xs font-medium"
                  style={{ backgroundColor: '#1B2A4A', color: 'rgba(245,241,235,0.7)', border: '1px solid rgba(245,241,235,0.1)' }}>
                  {p}
                </span>
              ))}
            </div>
            <h4 className="font-semibold mb-3 text-sm uppercase tracking-widest" style={{ color: '#C9A96E' }}>Follow Us</h4>
            <div className="flex gap-2">
              {[['📸', 'Instagram', '#'], ['👍', 'Facebook', '#'], ['🐦', 'Twitter', '#']].map(([icon, label, href]) => (
                <a key={label} href={href} title={label}
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-base transition-all hover:opacity-80"
                  style={{ backgroundColor: '#1B2A4A', border: '1px solid rgba(245,241,235,0.1)' }}>
                  {icon}
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-12 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs"
          style={{ borderTop: '1px solid rgba(245,241,235,0.1)', color: 'rgba(245,241,235,0.4)' }}>
          <span>© {new Date().getFullYear()} Azura Haven Hotel & Resort. All rights reserved.</span>
          <div className="flex gap-4">
            <Link to="/faq" className="hover:opacity-80 transition-opacity">Privacy Policy</Link>
            <Link to="/faq" className="hover:opacity-80 transition-opacity">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterLink({ to, children }) {
  return (
    <Link to={to} className="block text-sm transition-colors hover:opacity-100"
      style={{ color: 'rgba(245,241,235,0.55)' }}
      onMouseEnter={e => e.target.style.color = '#C9A96E'}
      onMouseLeave={e => e.target.style.color = 'rgba(245,241,235,0.55)'}>
      {children}
    </Link>
  );
}
