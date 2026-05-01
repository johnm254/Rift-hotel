import { useState } from 'react';

export default function LiveChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { from: 'bot', text: 'Hello! Welcome to Azura Haven 🏨 How can we help you today?' },
  ]);
  const [input, setInput] = useState('');

  const quickReplies = ['Room availability', 'Make a booking', 'Dining options', 'Speak to staff'];

  const botReply = (msg) => {
    const m = msg.toLowerCase();
    if (m.includes('room') || m.includes('availab')) return 'You can browse all available rooms at /rooms. Need help with specific dates?';
    if (m.includes('book')) return 'To book a room, browse our rooms and click "Book This Room". You\'ll need to sign in first.';
    if (m.includes('dining') || m.includes('food') || m.includes('meal')) return 'Our restaurant is open 6AM–11PM daily. View our full menu at /meals.';
    if (m.includes('price') || m.includes('cost') || m.includes('rate')) return 'Rooms start from KES 18,000/night. Check /rooms for current pricing.';
    if (m.includes('check') && m.includes('in')) return 'Standard check-in is 2:00 PM. Early check-in from 10 AM is available on request.';
    if (m.includes('check') && m.includes('out')) return 'Standard check-out is 11:00 AM. Late check-out until 2 PM can be arranged.';
    if (m.includes('wifi')) return 'Yes! High-speed WiFi is complimentary throughout the hotel.';
    if (m.includes('pool')) return 'Our heated infinity pool is open 6 AM – 10 PM daily.';
    if (m.includes('spa')) return 'The Azura Wellness Spa is open 8 AM – 8 PM. Advance booking recommended.';
    if (m.includes('cancel')) return 'Cancellations 48+ hours before check-in receive a full refund. See our FAQ for full policy.';
    if (m.includes('staff') || m.includes('human') || m.includes('agent')) return 'Connecting you to our team via WhatsApp! Click: https://wa.me/254700000000';
    return 'Thanks for your message! For immediate assistance, call us at +254 700 000 000 or WhatsApp us. Our team is available 24/7.';
  };

  const send = (text) => {
    const msg = text || input.trim();
    if (!msg) return;
    setMessages(prev => [...prev, { from: 'user', text: msg }]);
    setInput('');
    setTimeout(() => {
      setMessages(prev => [...prev, { from: 'bot', text: botReply(msg) }]);
    }, 600);
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-20 right-6 z-50 w-14 h-14 bg-gold hover:bg-gold-light text-navy rounded-full shadow-xl flex items-center justify-center transition-all hover:scale-110"
        aria-label="Live chat"
      >
        {open ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        )}
        {!open && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse" />
        )}
      </button>

      {/* Chat window */}
      {open && (
        <div className="fixed bottom-36 right-6 z-50 w-80 bg-white rounded-2xl shadow-2xl border border-cream-dark overflow-hidden flex flex-col" style={{ height: '420px' }}>
          {/* Header */}
          <div className="bg-navy px-4 py-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gold/20 flex items-center justify-center text-lg">🏨</div>
            <div>
              <div className="text-white font-semibold text-sm">Azura Haven</div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-cream/60 text-xs">Online · Typically replies instantly</span>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-cream/30">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                  m.from === 'user'
                    ? 'bg-navy text-cream rounded-br-sm'
                    : 'bg-white text-navy border border-cream-dark rounded-bl-sm shadow-sm'
                }`}>
                  {m.text.includes('https://') ? (
                    <span>
                      {m.text.split('https://')[0]}
                      <a href={`https://${m.text.split('https://')[1]}`} target="_blank" rel="noopener noreferrer" className="text-gold underline">
                        WhatsApp
                      </a>
                    </span>
                  ) : m.text}
                </div>
              </div>
            ))}
          </div>

          {/* Quick replies */}
          <div className="px-3 py-2 flex gap-1.5 overflow-x-auto border-t border-cream-dark bg-white">
            {quickReplies.map(q => (
              <button key={q} onClick={() => send(q)}
                className="flex-shrink-0 text-xs bg-cream hover:bg-cream-dark text-navy px-3 py-1.5 rounded-full border border-cream-dark transition-colors whitespace-nowrap">
                {q}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="p-3 border-t border-cream-dark bg-white flex gap-2">
            <input
              type="text" value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send()}
              placeholder="Type a message..."
              className="flex-1 px-3 py-2 rounded-xl bg-cream border border-cream-dark focus:border-gold focus:outline-none text-navy text-sm transition-colors"
            />
            <button onClick={() => send()}
              className="w-9 h-9 bg-gold hover:bg-gold-light text-navy rounded-xl flex items-center justify-center transition-all flex-shrink-0">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
