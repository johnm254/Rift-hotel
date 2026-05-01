import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useWishlist } from '../context/WishlistContext';

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const { dark, toggle: toggleDark } = useTheme();
  const { wishlist } = useWishlist();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 bg-navy/95 backdrop-blur border-b border-gold/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group flex-shrink-0">
            <span className="text-2xl">🏨</span>
            <span className="font-serif text-xl text-gold font-bold tracking-wide group-hover:text-gold-light transition-colors">
              Azura Haven
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-5">
            <NavLink to="/" active={isActive('/')}>Home</NavLink>
            <NavLink to="/rooms" active={isActive('/rooms')}>Rooms</NavLink>
            <NavLink to="/meals" active={isActive('/meals')}>Dining</NavLink>
            <NavLink to="/order" active={isActive('/order')}>Room Service</NavLink>
            <NavLink to="/offers" active={isActive('/offers')}>
              <span className="flex items-center gap-1">
                Offers
                <span className="bg-gold text-navy text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none">NEW</span>
              </span>
            </NavLink>
            <NavLink to="/about" active={isActive('/about')}>About</NavLink>
            <NavLink to="/contact" active={isActive('/contact')}>Contact</NavLink>

            {/* Wishlist */}
            <Link to="/wishlist" className="relative text-cream/60 hover:text-cream transition-colors">
              <svg className="w-5 h-5" fill={wishlist.length > 0 ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              {wishlist.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-gold text-navy text-[9px] font-bold rounded-full flex items-center justify-center">{wishlist.length}</span>
              )}
            </Link>

            {/* Dark mode toggle */}
            <button onClick={toggleDark} className="text-cream/60 hover:text-cream transition-colors" aria-label="Toggle dark mode">
              {dark ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>

            {user ? (
              <>
                <NavLink to="/profile" active={isActive('/profile')}>My Account</NavLink>
                {isAdmin && <NavLink to="/admin" admin active={location.pathname.startsWith('/admin')}>Admin</NavLink>}
                <button onClick={handleLogout} className="text-cream/60 hover:text-cream text-sm font-medium tracking-wide uppercase transition-colors">
                  Logout
                </button>
              </>
            ) : (
              <Link to="/login" className="bg-gold hover:bg-gold-light text-navy font-semibold px-5 py-2 rounded-lg text-sm tracking-wide uppercase transition-all">
                Sign In
              </Link>
            )}
          </div>

          {/* Mobile hamburger */}
          <button className="md:hidden text-cream p-2" onClick={() => setOpen(!open)} aria-label="Toggle menu">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {open
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-navy border-t border-gold/10 px-4 pb-5 pt-3 space-y-1">
          {[['/', 'Home'], ['/rooms', 'Rooms'], ['/meals', 'Dining'], ['/offers', 'Offers ✨'], ['/about', 'About'], ['/contact', 'Contact'], ['/faq', 'FAQ']].map(([to, label]) => (
            <MobileLink key={to} to={to} onClick={() => setOpen(false)} active={isActive(to)}>{label}</MobileLink>
          ))}
          <div className="border-t border-gold/10 pt-3 mt-3 space-y-1">
            {user ? (
              <>
                <MobileLink to="/profile" onClick={() => setOpen(false)} active={isActive('/profile')}>My Account</MobileLink>
                {isAdmin && <MobileLink to="/admin" onClick={() => setOpen(false)} active={location.pathname.startsWith('/admin')}>Admin Panel</MobileLink>}
                <button onClick={() => { handleLogout(); setOpen(false); }} className="block w-full text-left text-cream/60 hover:text-cream py-2.5 text-sm uppercase tracking-wide transition-colors">
                  Sign Out
                </button>
              </>
            ) : (
              <Link to="/login" onClick={() => setOpen(false)} className="block bg-gold text-navy font-semibold px-4 py-3 rounded-xl text-center text-sm uppercase tracking-widest mt-2">
                Sign In
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

function NavLink({ to, children, admin, active }) {
  return (
    <Link to={to} className={`text-sm font-medium tracking-wide uppercase transition-colors ${
      admin ? 'text-gold hover:text-gold-light' :
      active ? 'text-cream' : 'text-cream/60 hover:text-cream'
    }`}>
      {children}
    </Link>
  );
}

function MobileLink({ to, onClick, children, active }) {
  return (
    <Link to={to} onClick={onClick} className={`block py-2.5 text-sm uppercase tracking-wide transition-colors ${active ? 'text-gold' : 'text-cream/60 hover:text-cream'}`}>
      {children}
    </Link>
  );
}
