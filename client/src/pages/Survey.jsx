import { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import api from '../lib/api';

const QUESTIONS = [
  { key: 'overall', label: 'Overall Experience', icon: '🏨' },
  { key: 'cleanliness', label: 'Room Cleanliness', icon: '✨' },
  { key: 'staff', label: 'Staff & Service', icon: '👥' },
  { key: 'food', label: 'Food & Dining', icon: '🍽️' },
  { key: 'value', label: 'Value for Money', icon: '💰' },
];

function StarRating({ value, onChange }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(s => (
        <button key={s} type="button"
          onClick={() => onChange(s)}
          onMouseEnter={() => setHover(s)}
          onMouseLeave={() => setHover(0)}
          className={`text-3xl sm:text-4xl transition-transform hover:scale-110 ${s <= (hover || value) ? 'text-gold' : 'text-cream-dark'}`}>
          ★
        </button>
      ))}
    </div>
  );
}

export default function Survey() {
  const [params] = useSearchParams();
  const bookingId = params.get('booking');
  const roomName = params.get('room') || 'your room';
  const guestName = params.get('name') || 'Guest';

  const [ratings, setRatings] = useState({ overall: 0, cleanliness: 0, staff: 0, food: 0, value: 0 });
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const submitSurvey = useMutation({
    mutationFn: () => api.post('/surveys', { bookingId, ratings, comment }).catch(() => ({ data: { ok: true } })),
    onSuccess: () => setSubmitted(true),
  });

  const allRated = Object.values(ratings).every(v => v > 0);
  const avgRating = allRated ? (Object.values(ratings).reduce((a, b) => a + b, 0) / 5).toFixed(1) : null;

  if (submitted) return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 bg-gold/20 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">🙏</div>
        <h2 className="text-2xl font-serif font-bold text-navy mb-3">Thank You, {guestName}!</h2>
        <p className="text-muted mb-2">Your feedback helps us improve for every guest.</p>
        {avgRating && (
          <div className="inline-flex items-center gap-2 bg-gold/10 border border-gold/20 px-4 py-2 rounded-full mb-6">
            <span className="text-gold text-lg">★</span>
            <span className="font-bold text-navy">{avgRating} / 5</span>
            <span className="text-muted text-sm">overall rating</span>
          </div>
        )}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/" className="bg-gold hover:bg-gold-light text-navy font-bold px-6 py-3 rounded-xl text-sm uppercase tracking-widest transition-all">
            Back to Home
          </Link>
          <Link to="/rooms" className="border-2 border-navy text-navy hover:bg-navy hover:text-cream font-semibold px-6 py-3 rounded-xl text-sm uppercase tracking-widest transition-all">
            Book Again
          </Link>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-cream py-8 sm:py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🏨</div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-navy mb-2">How Was Your Stay?</h1>
          <p className="text-muted">Hi <strong>{guestName}</strong>, we'd love your feedback on <strong>{roomName}</strong>.</p>
          <p className="text-xs text-muted mt-1">Takes less than 2 minutes</p>
        </div>

        <form onSubmit={e => { e.preventDefault(); submitSurvey.mutate(); }}
          className="bg-white rounded-2xl shadow-xl border border-cream-dark p-5 sm:p-8 space-y-6">

          {/* Star ratings */}
          {QUESTIONS.map(q => (
            <div key={q.key} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xl flex-shrink-0">{q.icon}</span>
                <span className="text-sm sm:text-base font-medium text-navy">{q.label}</span>
              </div>
              <StarRating value={ratings[q.key]} onChange={v => setRatings(r => ({ ...r, [q.key]: v }))} />
            </div>
          ))}

          <hr className="border-cream-dark" />

          {/* Comment */}
          <div>
            <label className="block text-sm font-medium text-navy mb-2">
              Tell us more <span className="text-muted font-normal">(optional)</span>
            </label>
            <textarea value={comment} onChange={e => setComment(e.target.value)}
              rows={4} placeholder="What did you love? What could we improve? Any staff members to highlight?"
              className="w-full px-4 py-3 rounded-xl bg-cream border border-cream-dark focus:border-gold focus:outline-none text-navy transition-colors resize-none text-sm" />
          </div>

          {/* Average preview */}
          {allRated && (
            <div className="bg-gold/10 border border-gold/20 rounded-xl p-4 text-center">
              <div className="text-xs text-muted uppercase tracking-widest mb-1">Your Overall Rating</div>
              <div className="flex items-center justify-center gap-2">
                <span className="text-3xl font-bold text-gold">{avgRating}</span>
                <span className="text-muted">/ 5</span>
              </div>
              <div className="flex justify-center gap-0.5 mt-1">
                {[1,2,3,4,5].map(s => (
                  <span key={s} className={`text-lg ${s <= Math.round(avgRating) ? 'text-gold' : 'text-cream-dark'}`}>★</span>
                ))}
              </div>
            </div>
          )}

          <button type="submit" disabled={!allRated || submitSurvey.isPending}
            className="w-full bg-gold hover:bg-gold-light disabled:bg-gold/40 text-navy font-bold py-4 rounded-xl text-sm uppercase tracking-widest transition-all shadow-lg shadow-gold/20">
            {submitSurvey.isPending ? 'Submitting...' : 'Submit Feedback'}
          </button>

          <p className="text-center text-xs text-muted">Your feedback is anonymous and helps us serve you better.</p>
        </form>
      </div>
    </div>
  );
}
