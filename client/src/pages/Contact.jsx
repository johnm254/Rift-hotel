import { useState } from 'react';

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    // Simulate sending — in production wire to an email service
    await new Promise(r => setTimeout(r, 1200));
    setSent(true);
    setLoading(false);
  };

  return (
    <div>
      {/* Hero */}
      <section className="hero-gradient py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="text-gold text-sm uppercase tracking-widest font-semibold">Get in Touch</span>
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-white mt-2 mb-4">Contact Us</h1>
          <p className="text-cream/60 max-w-lg mx-auto">
            Our team is available 24/7 to assist with reservations, enquiries, and special requests.
          </p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">

          {/* Contact info */}
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-serif font-bold text-navy mb-6">Reach Us</h2>
              <div className="space-y-5">
                {[
                  { icon: '📍', label: 'Address', value: 'Azura Haven Hotel\nWestlands, Nairobi\nKenya' },
                  { icon: '📞', label: 'Phone', value: '+254 700 000 000\n+254 711 000 000' },
                  { icon: '✉️', label: 'Email', value: 'reservations@azurahaven.com\ninfo@azurahaven.com' },
                  { icon: '🕐', label: 'Front Desk', value: 'Open 24 hours, 7 days a week' },
                ].map(item => (
                  <div key={item.label} className="flex gap-4">
                    <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center text-lg flex-shrink-0">{item.icon}</div>
                    <div>
                      <div className="text-xs text-muted uppercase tracking-widest mb-1">{item.label}</div>
                      <div className="text-navy text-sm font-medium whitespace-pre-line">{item.value}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* WhatsApp */}
            <a
              href="https://wa.me/254700000000?text=Hello%20Azura%20Haven%2C%20I%20would%20like%20to%20make%20an%20enquiry."
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 bg-green-500 hover:bg-green-600 text-white font-semibold px-5 py-3 rounded-xl transition-all w-full justify-center"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Chat on WhatsApp
            </a>

            {/* Social */}
            <div>
              <div className="text-xs text-muted uppercase tracking-widest mb-3">Follow Us</div>
              <div className="flex gap-3">
                {[
                  { label: 'Instagram', icon: '📸', href: '#' },
                  { label: 'Facebook', icon: '👍', href: '#' },
                  { label: 'Twitter/X', icon: '🐦', href: '#' },
                ].map(s => (
                  <a key={s.label} href={s.href} className="w-10 h-10 rounded-xl bg-cream hover:bg-cream-dark border border-cream-dark flex items-center justify-center text-lg transition-all" title={s.label}>
                    {s.icon}
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Contact form */}
          <div className="lg:col-span-2">
            {sent ? (
              <div className="bg-white rounded-2xl shadow-xl border border-cream-dark p-12 text-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">✅</div>
                <h3 className="text-2xl font-serif font-bold text-navy mb-3">Message Sent!</h3>
                <p className="text-muted mb-6">Thank you for reaching out. Our team will get back to you within 2 hours.</p>
                <button onClick={() => { setSent(false); setForm({ name: '', email: '', phone: '', subject: '', message: '' }); }}
                  className="bg-gold hover:bg-gold-light text-navy font-semibold px-6 py-3 rounded-xl text-sm uppercase tracking-widest transition-all">
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl border border-cream-dark p-8 space-y-5">
                <h2 className="text-2xl font-serif font-bold text-navy mb-2">Send a Message</h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-navy mb-1.5">Full Name *</label>
                    <input type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                      placeholder="John Doe"
                      className="w-full px-4 py-3 rounded-xl bg-cream border border-cream-dark focus:border-gold focus:outline-none text-navy transition-colors" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-navy mb-1.5">Email Address *</label>
                    <input type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                      placeholder="you@email.com"
                      className="w-full px-4 py-3 rounded-xl bg-cream border border-cream-dark focus:border-gold focus:outline-none text-navy transition-colors" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-navy mb-1.5">Phone Number</label>
                    <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                      placeholder="+254 700 000 000"
                      className="w-full px-4 py-3 rounded-xl bg-cream border border-cream-dark focus:border-gold focus:outline-none text-navy transition-colors" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-navy mb-1.5">Subject *</label>
                    <select required value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-cream border border-cream-dark focus:border-gold focus:outline-none text-navy transition-colors">
                      <option value="">Select a subject</option>
                      <option>Room Reservation</option>
                      <option>Special Occasion</option>
                      <option>Dining Enquiry</option>
                      <option>Spa & Wellness</option>
                      <option>Corporate / Events</option>
                      <option>Feedback / Complaint</option>
                      <option>Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-navy mb-1.5">Message *</label>
                  <textarea required value={form.message} onChange={e => setForm({ ...form, message: e.target.value })}
                    rows={5} placeholder="Tell us how we can help you..."
                    className="w-full px-4 py-3 rounded-xl bg-cream border border-cream-dark focus:border-gold focus:outline-none text-navy transition-colors resize-none" />
                </div>

                <button type="submit" disabled={loading}
                  className="w-full bg-gold hover:bg-gold-light disabled:bg-gold/50 text-navy font-bold py-4 rounded-xl text-sm uppercase tracking-widest transition-all shadow-lg shadow-gold/20">
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-navy/30 border-t-navy rounded-full animate-spin"></span>
                      Sending...
                    </span>
                  ) : 'Send Message'}
                </button>
              </form>
            )}

            {/* Map embed placeholder */}
            <div className="mt-6 rounded-2xl overflow-hidden border border-cream-dark shadow-sm h-56 bg-cream flex items-center justify-center">
              <iframe
                title="Azura Haven Location"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3988.8176!2d36.8219!3d-1.2921!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMcKwMTcnMzEuNiJTIDM2wrA0OScxOC44IkU!5e0!3m2!1sen!2ske!4v1620000000000!5m2!1sen!2ske"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
