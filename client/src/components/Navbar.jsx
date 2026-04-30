import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <nav className="sticky top-0 z-50 bg-navy/95 backdrop-blur border-b border-gold/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <span className="text-2xl">🏨</span>
            <span className="font-serif text-xl text-gold font-bold tracking-wide group-hover:text-gold-light">
              Azura Haven
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            <NavLink to="/">Home</NavLink>
            <NavLink to="/rooms">Rooms</NavLink>
            <NavLink to="/meals">Dining</NavLink>
            {user ? (
              <>
                <NavLink to="/profile">My Account</NavLink>
                {isAdmin && <NavLink to="/admin" admin>Admin</NavLink>}
                <button onClick={handleLogout} className="text-cream/70 hover:text-cream text-sm font-medium tracking-wide uppercase transition-colors">
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
          <button className="md:hidden text-cream p-2" onClick={() => setOpen(!open)}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {open ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-navy border-t border-gold/10 px-4 pb-4 pt-2 space-y-2">
          <MobileLink to="/" onClick={() => setOpen(false)}>Home</MobileLink>
          <MobileLink to="/rooms" onClick={() => setOpen(false)}>Rooms</MobileLink>
          <MobileLink to="/meals" onClick={() => setOpen(false)}>Dining</MobileLink>
          {user ? (
            <>
              <MobileLink to="/profile" onClick={() => setOpen(false)}>My Account</MobileLink>
              {isAdmin && <MobileLink to="/admin" onClick={() => setOpen(false)}>Admin Panel</MobileLink>}
              <button onClick={() => { handleLogout(); setOpen(false); }} className="block w-full text-left text-cream/70 hover:text-cream py-2 text-sm uppercase tracking-wide">
                Logout
              </button>
            </>
          ) : (
            <Link to="/login" onClick={() => setOpen(false)} className="block bg-gold text-navy font-semibold px-4 py-2 rounded-lg text-center text-sm uppercase">
              Sign In
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}

function NavLink({ to, children, admin }) {
  return (
    <Link to={to} className={`text-sm font-medium tracking-wide uppercase transition-colors ${admin ? 'text-gold hover:text-gold-light' : 'text-cream/70 hover:text-cream'}`}>
      {children}
    </Link>
  );
}

function MobileLink({ to, onClick, children }) {
  return (
    <Link to={to} onClick={onClick} className="block text-cream/70 hover:text-cream py-2 text-sm uppercase tracking-wide">
      {children}
    </Link>
  );
}
