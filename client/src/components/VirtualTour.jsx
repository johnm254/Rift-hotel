import { useState } from 'react';

/**
 * VirtualTour — embeds a 360° tour or YouTube walkthrough video.
 * Accepts any YouTube URL, Matterport URL, or generic iframe-embeddable URL.
 * Falls back to a demo tour if no URL provided.
 */

function getEmbedUrl(url) {
  if (!url) return null;
  // YouTube
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=0&rel=0&modestbranding=1`;
  // Matterport
  if (url.includes('matterport.com')) {
    const mId = url.match(/\/show\/\?m=([^&\s]+)/)?.[1];
    if (mId) return `https://my.matterport.com/show/?m=${mId}&play=1`;
  }
  // Already an embed URL or other iframe-compatible URL
  return url;
}

export default function VirtualTour({ tourUrl, roomName }) {
  const [open, setOpen] = useState(false);
  const embedUrl = getEmbedUrl(tourUrl);

  // Demo tour using a real hotel YouTube walkthrough
  const demoUrl = 'https://www.youtube.com/embed/dQw4w9WgXcQ'; // replace with real demo
  const finalUrl = embedUrl || demoUrl;
  const isDemo = !embedUrl;

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2.5 bg-navy hover:bg-navy-light text-cream font-semibold px-5 py-3 rounded-xl text-sm transition-all group"
      >
        <span className="text-xl">🎥</span>
        <span>Virtual Tour</span>
        {isDemo && <span className="text-xs bg-gold/20 text-gold px-2 py-0.5 rounded-full">Demo</span>}
        <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setOpen(false)}>
          <div className="w-full max-w-4xl" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-white font-serif font-bold text-lg">{roomName} — Virtual Tour</h3>
                {isDemo && <p className="text-white/50 text-xs mt-0.5">Demo tour · Add a real tour URL in admin → Rooms</p>}
              </div>
              <button onClick={() => setOpen(false)}
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all">
                ✕
              </button>
            </div>

            {/* Video/Tour embed */}
            <div className="relative w-full rounded-2xl overflow-hidden bg-black" style={{ paddingBottom: '56.25%' }}>
              <iframe
                src={finalUrl}
                title={`${roomName} Virtual Tour`}
                className="absolute inset-0 w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                allowFullScreen
              />
            </div>

            {/* Tips */}
            <div className="flex gap-4 mt-3 text-white/50 text-xs justify-center">
              <span>🖱️ Click and drag to look around</span>
              <span>🔍 Scroll to zoom</span>
              <span>⛶ Click fullscreen for best experience</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
