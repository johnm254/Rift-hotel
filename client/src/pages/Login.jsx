import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function GoogleIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}

// Bellhop SVG character
function Bellhop({ walking, direction = 'right', carrying = true }) {
  return (
    <div className={`transition-all duration-700 ${walking ? (direction === 'right' ? 'translate-x-2' : '-translate-x-2') : ''}`}
      style={{ animation: walking ? 'walk 0.4s ease-in-out infinite alternate' : 'none' }}>
      <svg width="80" height="100" viewBox="0 0 80 100" fill="none">
        {/* Hat */}
        <rect x="25" y="8" width="30" height="6" rx="2" fill="#1B2A4A"/>
        <rect x="20" y="13" width="40" height="4" rx="2" fill="#1B2A4A"/>
        {/* Head */}
        <circle cx="40" cy="28" r="12" fill="#F5CBA7"/>
        {/* Eyes */}
        <circle cx="36" cy="26" r="1.5" fill="#1B2A4A"/>
        <circle cx="44" cy="26" r="1.5" fill="#1B2A4A"/>
        {/* Smile */}
        <path d="M36 31 Q40 34 44 31" stroke="#1B2A4A" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
        {/* Body / Uniform */}
        <rect x="26" y="40" width="28" height="30" rx="4" fill="#1B2A4A"/>
        {/* Gold buttons */}
        <circle cx="40" cy="47" r="2" fill="#C9A96E"/>
        <circle cx="40" cy="55" r="2" fill="#C9A96E"/>
        <circle cx="40" cy="63" r="2" fill="#C9A96E"/>
        {/* Gold trim */}
        <rect x="26" y="40" width="28" height="4" rx="2" fill="#C9A96E"/>
        {/* Left arm */}
        <rect x="14" y="42" width="12" height="6" rx="3" fill="#1B2A4A"
          style={{ transformOrigin: '26px 45px', animation: walking ? 'armSwing 0.4s ease-in-out infinite alternate' : 'none' }}/>
        {/* Right arm — holding tray */}
        <rect x="54" y="38" width="12" height="6" rx="3" fill="#1B2A4A"/>
        {carrying && <>
          {/* Tray */}
          <rect x="52" y="32" width="22" height="4" rx="2" fill="#C9A96E"/>
          {/* Form on tray */}
          <rect x="54" y="24" width="18" height="14" rx="2" fill="white" stroke="#C9A96E" strokeWidth="1"/>
          <rect x="56" y="27" width="14" height="1.5" rx="1" fill="#EBE3D6"/>
          <rect x="56" y="30" width="10" height="1.5" rx="1" fill="#EBE3D6"/>
          <rect x="56" y="33" width="12" height="1.5" rx="1" fill="#EBE3D6"/>
        </>}
        {/* Legs */}
        <rect x="30" y="70" width="8" height="20" rx="4" fill="#1B2A4A"
          style={{ transformOrigin: '34px 70px', animation: walking ? 'legLeft 0.4s ease-in-out infinite alternate' : 'none' }}/>
        <rect x="42" y="70" width="8" height="20" rx="4" fill="#1B2A4A"
          style={{ transformOrigin: '46px 70px', animation: walking ? 'legRight 0.4s ease-in-out infinite alternate' : 'none' }}/>
        {/* Shoes */}
        <ellipse cx="34" cy="90" rx="7" ry="4" fill="#0f172a"/>
        <ellipse cx="46" cy="90" rx="7" ry="4" fill="#0f172a"/>
      </svg>
    </div>
  );
}

export default function Login() {
  const { login, loginWithGoogle, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isRegister = location.pathname === '/register';
  const [mode, setMode] = useState(isRegister ? 'register' : 'login');

  // Animation states
  const [phase, setPhase] = useState('entering'); // entering | idle | submitting | leaving
  const [formVisible, setFormVisible] = useState(false);

  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Entrance animation on mount
  useEffect(() => {
    setPhase('entering');
    setFormVisible(false);
    const t1 = setTimeout(() => setFormVisible(true), 600);
    const t2 = setTimeout(() => setPhase('idle'), 800);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [mode]);

  const switchMode = (newMode) => {
    setError('');
    setPhase('leaving');
    setFormVisible(false);
    setTimeout(() => {
      setMode(newMode);
      navigate(newMode === 'login' ? '/login' : '/register', { replace: true });
    }, 500);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (mode === 'register' && password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    setPhase('submitting');
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register(email, password, name);
      }
      // Walk away with the form
      setFormVisible(false);
      setTimeout(() => navigate('/'), 600);
    } catch (err) {
      setError(err.message?.replace('Firebase: ', '').replace(/\(auth\/.*\)/, '').trim() || 'Something went wrong.');
      setPhase('idle');
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError('');
    setGoogleLoading(true);
    setPhase('submitting');
    try {
      await loginWithGoogle();
      setFormVisible(false);
      setTimeout(() => navigate('/'), 600);
    } catch (err) {
      setError(err.message || 'Google sign-in failed.');
      setPhase('idle');
      setGoogleLoading(false);
    }
  };

  const bellhopDirection = phase === 'leaving' || phase === 'submitting' ? 'left' : 'right';
  const bellhopWalking = phase === 'entering' || phase === 'leaving' || phase === 'submitting';

  return (
    <>
      <style>{`
        @keyframes walk {
          from { transform: translateY(0px); }
          to   { transform: translateY(-3px); }
        }
        @keyframes legLeft {
          from { transform: rotate(-15deg); }
          to   { transform: rotate(15deg); }
        }
        @keyframes legRight {
          from { transform: rotate(15deg); }
          to   { transform: rotate(-15deg); }
        }
        @keyframes armSwing {
          from { transform: rotate(-20deg); }
          to   { transform: rotate(20deg); }
        }
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(60px) rotate(3deg); }
          to   { opacity: 1; transform: translateX(0) rotate(0deg); }
        }
        @keyframes slideOutLeft {
          from { opacity: 1; transform: translateX(0) rotate(0deg); }
          to   { opacity: 0; transform: translateX(-60px) rotate(-3deg); }
        }
        .form-enter { animation: slideInRight 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards; }
        .form-leave { animation: slideOutLeft 0.4s ease-in forwards; }
        @keyframes bellhopEnter {
          from { transform: translateX(120px); opacity: 0; }
          to   { transform: translateX(0); opacity: 1; }
        }
        @keyframes bellhopLeave {
          from { transform: translateX(0); opacity: 1; }
          to   { transform: translateX(-140px); opacity: 0; }
        }
        .bellhop-enter { animation: bellhopEnter 0.6s cubic-bezier(0.34,1.56,0.64,1) forwards; }
        .bellhop-leave { animation: bellhopLeave 0.5s ease-in forwards; }
      `}</style>

      <div className="min-h-[90vh] flex flex-col items-center justify-center px-4 py-8 overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #F5F1EB 0%, #EBE3D6 100%)' }}>

        {/* Hotel branding */}
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">🏨</div>
          <h1 className="text-2xl font-serif font-bold text-navy">Azura Haven</h1>
          <p className="text-muted text-sm mt-1">
            {mode === 'login' ? 'Welcome back, valued guest' : 'Join us for an unforgettable stay'}
          </p>
        </div>

        {/* Bellhop + Form scene */}
        <div className="flex items-end justify-center gap-4 w-full max-w-md mb-2">
          {/* Bellhop character */}
          <div className={phase === 'entering' ? 'bellhop-enter' : phase === 'leaving' || phase === 'submitting' ? 'bellhop-leave' : ''}>
            <Bellhop
              walking={bellhopWalking}
              direction={bellhopDirection}
              carrying={phase !== 'idle'}
            />
          </div>

          {/* Speech bubble when idle */}
          {phase === 'idle' && (
            <div className="mb-16 bg-white rounded-2xl rounded-bl-none px-4 py-2 shadow-md border border-cream-dark text-sm text-navy font-medium animate-pulse">
              {mode === 'login' ? 'Your form, sir! 🎩' : 'Please fill this out! ✍️'}
            </div>
          )}
        </div>

        {/* The form — slides in/out */}
        <div className="w-full max-w-md">
          {formVisible && (
            <div className={phase === 'entering' ? 'form-enter' : phase === 'leaving' || phase === 'submitting' ? 'form-leave' : ''}>
              <div className="bg-white rounded-2xl shadow-2xl border border-cream-dark overflow-hidden">
                {/* Form header tabs */}
                <div className="flex border-b border-cream-dark">
                  <button onClick={() => switchMode('login')}
                    className={`flex-1 py-4 text-sm font-bold uppercase tracking-widest transition-all ${mode === 'login' ? 'bg-navy text-gold' : 'text-muted hover:text-navy'}`}>
                    Sign In
                  </button>
                  <button onClick={() => switchMode('register')}
                    className={`flex-1 py-4 text-sm font-bold uppercase tracking-widest transition-all ${mode === 'register' ? 'bg-navy text-gold' : 'text-muted hover:text-navy'}`}>
                    Register
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-4">
                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                      {error}
                    </div>
                  )}

                  {mode === 'register' && (
                    <div>
                      <label className="block text-xs font-semibold text-muted uppercase tracking-widest mb-1.5">Full Name</label>
                      <input type="text" required value={name} onChange={e => setName(e.target.value)}
                        placeholder="John Doe"
                        className="w-full px-4 py-3 rounded-xl bg-cream border border-cream-dark focus:border-gold focus:outline-none text-navy transition-colors" />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-muted uppercase tracking-widest mb-1.5">Email</label>
                    <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                      placeholder="you@email.com"
                      className="w-full px-4 py-3 rounded-xl bg-cream border border-cream-dark focus:border-gold focus:outline-none text-navy transition-colors" />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-muted uppercase tracking-widest mb-1.5">Password</label>
                    <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
                      placeholder={mode === 'register' ? 'Min. 6 characters' : '••••••••'}
                      className="w-full px-4 py-3 rounded-xl bg-cream border border-cream-dark focus:border-gold focus:outline-none text-navy transition-colors" />
                  </div>

                  <button type="submit" disabled={loading || googleLoading}
                    className="w-full bg-gold hover:bg-gold-light disabled:bg-gold/50 text-navy font-bold py-4 rounded-xl text-sm uppercase tracking-widest transition-all shadow-lg shadow-gold/20">
                    {loading
                      ? (mode === 'login' ? 'Signing in...' : 'Creating account...')
                      : (mode === 'login' ? 'Sign In' : 'Create Account')}
                  </button>

                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-px bg-cream-dark" />
                    <span className="text-xs text-muted">or</span>
                    <div className="flex-1 h-px bg-cream-dark" />
                  </div>

                  <button type="button" onClick={handleGoogle} disabled={loading || googleLoading}
                    className="w-full flex items-center justify-center gap-3 bg-white hover:bg-cream disabled:opacity-50 text-navy font-semibold py-3.5 rounded-xl text-sm border border-cream-dark transition-all shadow-sm">
                    <GoogleIcon />
                    {googleLoading ? 'Signing in...' : 'Continue with Google'}
                  </button>
                </form>

                {/* Footer */}
                <div className="px-8 pb-6 text-center">
                  <p className="text-muted text-sm">
                    {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
                    <button onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}
                      className="text-gold-dark hover:text-gold font-semibold transition-colors">
                      {mode === 'login' ? 'Create one' : 'Sign in'}
                    </button>
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Back to site */}
        <Link to="/" className="mt-6 text-sm text-muted hover:text-gold transition-colors flex items-center gap-1.5">
          ← Back to Azura Haven
        </Link>
      </div>
    </>
  );
}
