import { Link, useNavigate } from 'react-router-dom';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="text-center max-w-lg w-full">
        {/* Big decorative number */}
        <div className="relative mb-6 sm:mb-8">
          <div className="text-[6rem] sm:text-[10rem] font-serif font-bold text-cream-dark leading-none select-none">
            404
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-6xl">🏨</span>
          </div>
        </div>

        <h1 className="text-3xl font-serif font-bold text-navy mb-3">
          Room Not Found
        </h1>
        <p className="text-muted mb-8 leading-relaxed">
          Looks like this page checked out. The page you're looking for doesn't exist or may have been moved.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => navigate(-1)}
            className="border-2 border-navy text-navy hover:bg-navy hover:text-cream font-semibold px-6 py-3 rounded-xl text-sm uppercase tracking-widest transition-all"
          >
            ← Go Back
          </button>
          <Link
            to="/"
            className="bg-gold hover:bg-gold-light text-navy font-bold px-6 py-3 rounded-xl text-sm uppercase tracking-widest transition-all shadow-lg shadow-gold/20"
          >
            Back to Home
          </Link>
          <Link
            to="/rooms"
            className="bg-navy hover:bg-navy-light text-cream font-semibold px-6 py-3 rounded-xl text-sm uppercase tracking-widest transition-all"
          >
            Browse Rooms
          </Link>
        </div>

        {/* Quick links */}
        <div className="mt-10 pt-8 border-t border-cream-dark">
          <p className="text-sm text-muted mb-4">You might be looking for:</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {[['/', 'Home'], ['/rooms', 'Rooms'], ['/meals', 'Dining'], ['/login', 'Sign In']].map(([to, label]) => (
              <Link key={to} to={to} className="text-gold hover:text-gold-dark text-sm font-medium transition-colors underline underline-offset-2">
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
