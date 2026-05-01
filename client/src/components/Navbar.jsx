import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useWishlist } from '../context/WishlistContext';
import LanguageToggle from './LanguageToggle';

const NAV_LINKS = [
  { to: '/', label: 'home', exact: true },
  { to: '/rooms', label: 'rooms' },
  { to: '/meals', label: 'dining' },
  { to: '/offers', label: 'offers', badge: 'NEW' },
  { to: '/about', label: 'about' },
  { to: '/contact', label: 'contact' },
];

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const { dark, toggle: toggleDark } = useTheme();
  const { wishlist } = useWishlist();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Detect scroll to switch between transparent and glass
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => { setOpen(false); }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const isActive = (to, exact) =>
    exact ? location.pathname === to : location.pathname.startsWith(to);

  const isHeroPage = ['/', '/rooms', '/meals', '/offers', '/about', '/contact'].includes(location.pathname);

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled || !isHeroPage
          ? 'bg-navy/80 backdrop-blur-xl border-b border-white/10 shadow-lg shadow-navy/20'
          : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-18">

            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 group flex-shrink-0">
              <div className="w-8 h-8 rounded-lg bg-gold/20 border border-gold/30 flex items-center justify-center text-lg group-hover:bg-gold/30 transition-all">
                🏨
              </div>
              <span className="font-serif text-lg text-gold font-bold tracking-wide group-hover:text-gold-light transition-colors hidden sm:block">
                Azura Haven
              </span>
            </Link>

            {/* Desktop nav links — centered */}
            <div className="hidden lg:flex items-center gap-1">
              {NAV_LINKS.map(({ to, label, exact, badge }) => {
                const active = isActive(to, exact);
                return (
                  <Link key={to} to={to}
                    className={`relative px-3 py-2 text-sm font-medium tracking-wide rounded-lg transition-all duration-200 flex items-center gap-1.5 ${
                      active
                        ? 'text-gold bg-gold/10'
                        : 'text-cream/70 hover:text-cream hover:bg-white/5'
                    }`}>
                    {t(label)}
                    {badge && (
                      <span className="bg-gold text-navy text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                        {badge}
                      </span>
                    )}
                    {active && (
                      <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-gold rounded-full" />
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Right side actions */}
            <div className="flex items-center gap-2">

              {/* Wishlist */}
              <Link to="/wishlist"
                className="relative w-9 h-9 rounded-lg flex items-center justify-center text-cream/60 hover:text-cream hover:bg-white/10 transition-all">
                <svg className="w-5 h-5" fill={wishlist.length > 0 ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                {wishlist.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-gold text-navy text-[9px] font-bold rounded-full flex items-center justify-center">
                    {wishlist.length}
                  </span>
                )}
              </Link>

              {/* Dark mode */}
              <button onClick={toggleDark}
                className="w-9 h-9 rounded-lg flex items-center justify-center text-cream/60 hover:text-cream hover:bg-white/10 transition-all"
                aria-label="Toggle dark mode">
                {dark ? (
                  <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </button>

              {/* Language */}
              <div className="hidden sm:block">
                <LanguageToggle />
              </div>

              {/* Auth — desktop */}
              <div className="hidden lg:flex items-center gap-2 ml-1">
                {user ? (
                  <>
                    <Link to="/profile"
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        isActive('/profile') ? 'text-gold bg-gold/10' : 'text-cream/70 hover:text-cream hover:bg-white/5'
                      }`}>
                      <div className="w-6 h-6 rounded-full bg-gold/20 flex items-center justify-center text-gold text-xs font-bold">
                        {user.name?.[0]?.toUpperCase() || '?'}
                      </div>
                      <span className="hidden xl:block">{user.name?.split(' ')[0] || t('myAccount')}</span>
                    </Link>
                    {isAdmin && (
                      <Link to="/admin"
                        className="px-3 py-1.5 rounded-lg text-xs font-bold text-gold bg-gold/10 hover:bg-gold/20 border border-gold/20 transition-all uppercase tracking-widest">
                        Admin
                      </Link>
                    )}
                    <button onClick={handleLogout}
                      className="px-3 py-1.5 rounded-lg text-sm text-cream/50 hover:text-cream hover:bg-white/5 transition-all">
                      {t('signOut')}
                    </button>
                  </>
                ) : (
                  <Link to="/login"
                    className="bg-gold hover:bg-gold-light text-navy font-bold px-5 py-2 rounded-xl text-sm tracking-wide uppercase transition-all shadow-lg shadow-gold/20">
                    {t('signIn')}
                  </Link>
                )}
              </div>

              {/* Mobile hamburger */}
              <button
                onClick={() => setOpen(!open)}
                className="lg:hidden w-9 h-9 rounded-lg flex items-center justify-center text-cream hover:bg-white/10 transition-all"
                aria-label="Toggle menu">
                <div className="w-5 flex flex-col gap-1.5">
                  <span className={`block h-0.5 bg-current rounded-full transition-all duration-300 ${open ? 'rotate-45 translate-y-2' : ''}`} />
                  <span className={`block h-0.5 bg-current rounded-full transition-all duration-300 ${open ? 'opacity-0' : ''}`} />
                  <span className={`block h-0.5 bg-current rounded-full transition-all duration-300 ${open ? '-rotate-45 -translate-y-2' : ''}`} />
                </div>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Spacer to prevent content from hiding under fixed nav */}
      <div className="h-16" />

      {/* Mobile drawer overlay */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-navy/60 backdrop-blur-sm" />
        </div>
      )}

      {/* Mobile drawer */}
      <div className={`fixed top-0 right-0 h-full w-72 z-50 lg:hidden transition-transform duration-300 ease-out ${open ? 'translate-x-0' : 'translate-x-full'}`}
        style={{ background: 'rgba(18, 30, 54, 0.97)', backdropFilter: 'blur(20px)', borderLeft: '1px solid rgba(201,169,110,0.15)' }}>

        {/* Drawer header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gold/10">
          <div className="flex items-center gap-2">
            <span className="text-xl">🏨</span>
            <span className="font-serif text-gold font-bold">Azura Haven</span>
          </div>
          <button onClick={() => setOpen(false)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-cream/60 hover:text-cream hover:bg-white/10 transition-all">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Drawer nav */}
        <div className="px-3 py-4 space-y-1 overflow-y-auto">
          {NAV_LINKS.map(({ to, label, exact, badge }) => {
            const active = isActive(to, exact);
            return (
              <Link key={to} to={to}
                className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  active ? 'bg-gold/15 text-gold' : 'text-cream/70 hover:text-cream hover:bg-white/5'
                }`}>
                <span>{t(label)}</span>
                {badge && <span className="bg-gold text-navy text-[9px] font-bold px-1.5 py-0.5 rounded-full">{badge}</span>}
                {active && <span className="w-1.5 h-1.5 rounded-full bg-gold ml-auto" />}
              </Link>
            );
          })}

          {/* Extra links */}
          {[
            ['/order', t('roomService')],
            ['/transfer', 'Airport Transfer'],
            ['/wishlist', `Wishlist${wishlist.length > 0 ? ` (${wishlist.length})` : ''}`],
            ['/faq', 'FAQ'],
          ].map(([to, label]) => (
            <Link key={to} to={to}
              className={`flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                isActive(to) ? 'bg-gold/15 text-gold' : 'text-cream/60 hover:text-cream hover:bg-white/5'
              }`}>
              {label}
            </Link>
          ))}
        </div>

        {/* Drawer footer */}
        <div className="absolute bottom-0 left-0 right-0 px-3 py-4 border-t border-gold/10 space-y-2">
          {/* Toggles row */}
          <div className="flex items-center gap-2 px-2 mb-3">
            <button onClick={toggleDark}
              className="flex items-center gap-2 text-cream/60 hover:text-cream text-xs transition-colors">
              {dark ? '☀️ Light' : '🌙 Dark'}
            </button>
            <span className="text-cream/20">·</span>
            <LanguageToggle className="border-cream/20 text-cream/60 hover:text-cream hover:border-cream/40" />
          </div>

          {user ? (
            <>
              <Link to="/profile"
                className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all">
                <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center text-gold font-bold text-sm">
                  {user.name?.[0]?.toUpperCase() || '?'}
                </div>
                <div>
                  <div className="text-cream text-sm font-medium">{user.name || 'Guest'}</div>
                  <div className="text-cream/40 text-xs truncate">{user.email}</div>
                </div>
              </Link>
              {isAdmin && (
                <Link to="/admin"
                  className="block text-center py-2.5 rounded-xl text-xs font-bold text-gold bg-gold/10 border border-gold/20 uppercase tracking-widest transition-all hover:bg-gold/20">
                  Admin Panel
                </Link>
              )}
              <button onClick={handleLogout}
                className="w-full py-2.5 rounded-xl text-sm text-cream/50 hover:text-red-400 hover:bg-red-500/10 transition-all border border-transparent hover:border-red-500/20">
                Sign Out
              </button>
            </>
          ) : (
            <Link to="/login"
              className="block text-center bg-gold hover:bg-gold-light text-navy font-bold py-3 rounded-xl text-sm uppercase tracking-widest transition-all shadow-lg shadow-gold/20">
              {t('signIn')}
            </Link>
          )}
        </div>
      </div>
    </>
  );
}
