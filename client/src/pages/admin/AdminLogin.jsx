import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function AdminLogin() {
  const { login, loginWithGoogle, user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Already logged in as admin — go straight to dashboard
  if (user && isAdmin) {
    navigate('/admin/dashboard', { replace: true });
    return null;
  }

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await login(email, password);
      if (data?.admin || data?.role === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      } else {
        setError('Access denied. This portal is for administrators only.');
      }
    } catch (err) {
      setError(err.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError('');
    setLoading(true);
    try {
      const data = await loginWithGoogle();
      if (data?.admin || data?.role === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      } else {
        setError('Access denied. This portal is for administrators only.');
      }
    } catch (err) {
      setError(err.message || 'Google sign-in failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: '#0f172a' }}>
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12"
        style={{ background: 'linear-gradient(135deg, #1B2A4A 0%, #0f172a 100%)' }}>
        <div className="flex items-center gap-3">
          <span className="text-3xl">🏨</span>
          <div>
            <div className="font-serif text-2xl font-bold" style={{ color: '#C9A96E' }}>Azura Haven</div>
            <div className="text-xs" style={{ color: 'rgba(245,241,235,0.4)' }}>Administration Portal</div>
          </div>
        </div>

        <div>
          <h1 className="font-serif text-4xl font-bold text-white mb-4 leading-tight">
            Hotel Management<br />
            <span style={{ color: '#C9A96E' }}>Command Centre</span>
          </h1>
          <p style={{ color: 'rgba(245,241,235,0.5)' }} className="text-sm leading-relaxed max-w-sm">
            Manage bookings, rooms, guests, pricing, housekeeping, and analytics — all from one secure dashboard.
          </p>

          <div className="grid grid-cols-2 gap-4 mt-10">
            {[
              { icon: '📅', label: 'Bookings', desc: 'Approve & manage' },
              { icon: '🛏', label: 'Rooms', desc: 'Add & configure' },
              { icon: '👥', label: 'Guests', desc: 'View history' },
              { icon: '📊', label: 'Analytics', desc: 'Revenue charts' },
            ].map(item => (
              <div key={item.label} className="rounded-xl p-4"
                style={{ background: 'rgba(201,169,110,0.08)', border: '1px solid rgba(201,169,110,0.15)' }}>
                <div className="text-2xl mb-1">{item.icon}</div>
                <div className="font-semibold text-white text-sm">{item.label}</div>
                <div className="text-xs" style={{ color: 'rgba(245,241,235,0.4)' }}>{item.desc}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ color: 'rgba(245,241,235,0.3)' }} className="text-xs">
          © {new Date().getFullYear()} Azura Haven · Restricted Access
        </div>
      </div>

      {/* Right panel — login form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <span className="text-2xl">🏨</span>
            <span className="font-serif text-xl font-bold" style={{ color: '#C9A96E' }}>Azura Haven Admin</span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-1">Administrator Sign In</h2>
            <p style={{ color: 'rgba(245,241,235,0.4)' }} className="text-sm">
              Restricted to authorised hotel staff only.
            </p>
          </div>

          {error && (
            <div className="mb-5 px-4 py-3 rounded-xl text-sm font-medium"
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'rgba(245,241,235,0.7)' }}>
                Email Address
              </label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                placeholder="admin@azurahaven.com"
                className="w-full px-4 py-3 rounded-xl text-white placeholder-gray-500 focus:outline-none transition-all"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                onFocus={e => e.target.style.borderColor = '#C9A96E'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'rgba(245,241,235,0.7)' }}>
                Password
              </label>
              <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl text-white placeholder-gray-500 focus:outline-none transition-all"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                onFocus={e => e.target.style.borderColor = '#C9A96E'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-3.5 rounded-xl font-bold text-sm uppercase tracking-widest transition-all"
              style={{ background: loading ? 'rgba(201,169,110,0.5)' : '#C9A96E', color: '#1B2A4A' }}>
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-navy/30 border-t-navy rounded-full animate-spin"></span>
                  Signing in...
                </span>
              ) : 'Sign In to Admin Portal'}
            </button>
          </form>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.1)' }} />
            <span className="text-xs" style={{ color: 'rgba(245,241,235,0.3)' }}>or</span>
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.1)' }} />
          </div>

          <button onClick={handleGoogle} disabled={loading}
            className="w-full py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-3 transition-all"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}>
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          <p className="text-center text-xs mt-6" style={{ color: 'rgba(245,241,235,0.25)' }}>
            🔒 Secure admin access · Unauthorised access is prohibited
          </p>

          <div className="text-center mt-4">
            <a href="/" className="text-xs transition-colors"
              style={{ color: 'rgba(201,169,110,0.6)' }}
              onMouseEnter={e => e.target.style.color = '#C9A96E'}
              onMouseLeave={e => e.target.style.color = 'rgba(201,169,110,0.6)'}>
              ← Back to Azura Haven website
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
