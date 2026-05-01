import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import Loading from '../components/Loading';

const mockBookings = [
  { id: 'b-1', roomName: 'Presidential Ocean Suite', checkIn: '2026-05-10', checkOut: '2026-05-13', guests: 2, totalPrice: 135000, status: 'approved', paymentStatus: 'paid' },
  { id: 'b-2', roomName: 'Deluxe Garden View', checkIn: '2026-06-01', checkOut: '2026-06-03', guests: 2, totalPrice: 50000, status: 'pending', paymentStatus: 'pending' },
  { id: 'b-3', roomName: 'Honeymoon Retreat', checkIn: '2026-04-01', checkOut: '2026-04-04', guests: 2, totalPrice: 165000, status: 'checked-out', paymentStatus: 'paid' },
];

function generateInvoiceHTML(booking, user) {
  const nights = Math.ceil((new Date(booking.checkOut) - new Date(booking.checkIn)) / (1000 * 60 * 60 * 24));
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Invoice #${booking.id}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Georgia, serif; max-width: 720px; margin: 40px auto; color: #1a2744; padding: 0 20px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #C9A96E; padding-bottom: 24px; margin-bottom: 32px; }
    .hotel-name { font-size: 26px; font-weight: bold; color: #C9A96E; }
    .hotel-sub { font-size: 13px; color: #888; margin-top: 4px; }
    .invoice-meta { text-align: right; }
    .invoice-meta h2 { font-size: 22px; color: #1a2744; }
    .invoice-meta p { font-size: 13px; color: #888; margin-top: 4px; }
    .section { margin-bottom: 28px; }
    .section-title { font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #C9A96E; margin-bottom: 12px; font-weight: bold; }
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .field label { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #999; }
    .field p { font-size: 15px; font-weight: bold; margin-top: 3px; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; }
    th { text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #999; padding: 8px 0; border-bottom: 1px solid #eee; }
    td { padding: 12px 0; border-bottom: 1px solid #f5f5f5; font-size: 14px; }
    .total-row { border-top: 2px solid #C9A96E; padding-top: 16px; margin-top: 8px; display: flex; justify-content: space-between; align-items: center; }
    .total-label { font-size: 14px; color: #888; text-transform: uppercase; letter-spacing: 1px; }
    .total-amount { font-size: 28px; color: #C9A96E; font-weight: bold; }
    .status-badge { display: inline-block; padding: 4px 14px; border-radius: 20px; font-size: 12px; font-weight: bold; background: #d1fae5; color: #065f46; text-transform: uppercase; letter-spacing: 1px; }
    .footer { margin-top: 48px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #bbb; text-align: center; line-height: 1.8; }
  </style></head><body>
  <div class="header">
    <div><div class="hotel-name">🏨 Azura Haven</div><div class="hotel-sub">Nairobi, Kenya · Luxury Hotel & Resort</div></div>
    <div class="invoice-meta"><h2>INVOICE</h2><p>#${booking.id.toUpperCase()}</p><p>${new Date().toLocaleDateString('en-KE', { year:'numeric', month:'long', day:'numeric' })}</p></div>
  </div>
  <div class="section">
    <div class="section-title">Billed To</div>
    <div class="grid-2">
      <div class="field"><label>Guest Name</label><p>${user?.name || 'Guest'}</p></div>
      <div class="field"><label>Email</label><p>${user?.email || ''}</p></div>
    </div>
  </div>
  <div class="section">
    <div class="section-title">Booking Details</div>
    <table>
      <thead><tr><th>Description</th><th>Check-in</th><th>Check-out</th><th>Nights</th><th style="text-align:right">Amount</th></tr></thead>
      <tbody>
        <tr>
          <td><strong>${booking.roomName}</strong><br><span style="font-size:12px;color:#888">${booking.guests} guest${booking.guests > 1 ? 's' : ''}</span></td>
          <td>${booking.checkIn}</td>
          <td>${booking.checkOut}</td>
          <td>${nights}</td>
          <td style="text-align:right;font-weight:bold">KES ${booking.totalPrice?.toLocaleString()}</td>
        </tr>
      </tbody>
    </table>
  </div>
  <div class="total-row"><div><div class="total-label">Total Amount</div><div style="font-size:12px;color:#888;margin-top:4px">Status: <span class="status-badge">${booking.paymentStatus || 'pending'}</span></div></div><div class="total-amount">KES ${booking.totalPrice?.toLocaleString()}</div></div>
  <div class="footer">Azura Haven Hotel &amp; Resort · P.O. Box 12345, Nairobi, Kenya<br>reservations@azurahaven.com · +254 700 000 000 · www.azurahaven.com<br><em>Thank you for choosing Azura Haven. We look forward to welcoming you again.</em></div>
  </body></html>`;
}

function downloadInvoice(booking, user) {
  const html = generateInvoiceHTML(booking, user);
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `azura-invoice-${booking.id}.html`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState('bookings');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');

  // Personal info fields
  const [personalForm, setPersonalForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    nationality: user?.nationality || '',
    dateOfBirth: user?.dateOfBirth || '',
    gender: user?.gender || '',
    idNumber: user?.idNumber || '',
  });
  const [personalEditing, setPersonalEditing] = useState(false);

  // Address fields
  const [addressForm, setAddressForm] = useState({
    address: user?.address || '',
    city: user?.city || '',
    country: user?.country || 'Kenya',
    postalCode: user?.postalCode || '',
  });
  const [addressEditing, setAddressEditing] = useState(false);

  // Emergency contact
  const [emergencyForm, setEmergencyForm] = useState({
    emergencyName: user?.emergencyName || '',
    emergencyPhone: user?.emergencyPhone || '',
    emergencyRelation: user?.emergencyRelation || '',
  });
  const [emergencyEditing, setEmergencyEditing] = useState(false);

  // Preferences
  const [prefs, setPrefs] = useState({
    emailBookingConfirm: true,
    emailOffers: false,
    emailReminders: true,
    smsReminders: false,
  });

  const showMessage = (msg, type = 'success') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(''), 3500);
  };

  const { data: bookingsData, isLoading: bookingsLoading } = useQuery({
    queryKey: ['myBookings'],
    queryFn: () => api.get('/bookings/mine').then(r => {
      const data = r.data;
      const arr = Array.isArray(data) ? data : (data.bookings || []);
      return arr.length > 0 ? arr : mockBookings;
    }).catch(() => mockBookings),
  });

  const bookings = bookingsData || [];

  const updateProfile = useMutation({
    mutationFn: (data) => api.put('/auth/me', data),
    onSuccess: () => {
      queryClient.invalidateQueries(['user']);
      showMessage('Profile updated successfully!');
    },
    onError: () => showMessage('Failed to update. Try again.', 'error'),
  });

  const cancelBooking = useMutation({
    mutationFn: (id) => api.delete(`/bookings/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['myBookings']);
      setMessage('Booking cancelled.');
      setMessageType('success');
      setTimeout(() => setMessage(''), 3000);
    },
  });

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const upcomingBookings = bookings.filter(b => ['pending', 'approved'].includes(b.status));
  const pastBookings = bookings.filter(b => ['checked-out', 'rejected'].includes(b.status));

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <h1 className="text-3xl font-serif font-bold text-navy">My Account</h1>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-sm text-muted hover:text-red-500 font-medium transition-colors border border-cream-dark hover:border-red-200 px-4 py-2 rounded-xl"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Sign Out
        </button>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-2xl shadow-lg border border-cream-dark p-6 mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gold/30 to-gold/10 flex items-center justify-center text-2xl font-bold text-gold border-2 border-gold/20">
            {user?.name?.[0]?.toUpperCase() || '?'}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-navy">{user?.name || 'Guest'}</h2>
            <p className="text-muted text-sm">{user?.email}</p>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${user?.admin || user?.role === 'admin' ? 'bg-gold/20 text-gold-dark' : 'bg-cream text-navy/60'}`}>
                {user?.admin || user?.role === 'admin' ? '👑 Admin' : '🏨 Guest'}
              </span>
              <span className="text-xs text-muted">{bookings.length} booking{bookings.length !== 1 ? 's' : ''}</span>
              {/* Loyalty points badge */}
              <span className="flex items-center gap-1 text-xs font-semibold bg-gold/10 text-gold-dark px-2.5 py-0.5 rounded-full border border-gold/20">
                ⭐ {user?.loyaltyPoints || 0} pts
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-cream rounded-xl p-1 mb-6 w-fit">
        {[['bookings', '📅 My Bookings'], ['settings', '⚙️ Settings']].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${tab === key ? 'bg-white text-navy shadow-sm' : 'text-muted hover:text-navy'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {message && (
        <div className={`mb-4 px-4 py-3 rounded-xl text-sm font-medium ${messageType === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {message}
        </div>
      )}

      {/* ── BOOKINGS TAB ── */}
      {tab === 'bookings' && (
        <div>
          {bookingsLoading ? <Loading /> : bookings.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg border border-cream-dark p-10 text-center">
              <div className="text-4xl mb-4">📅</div>
              <h3 className="text-lg font-bold text-navy mb-2">No bookings yet</h3>
              <p className="text-muted text-sm mb-4">Browse our rooms and book your first stay!</p>
              <a href="/rooms" className="inline-block bg-gold hover:bg-gold-light text-navy font-semibold px-6 py-3 rounded-xl text-sm uppercase tracking-widest transition-all">
                Browse Rooms
              </a>
            </div>
          ) : (
            <div className="space-y-6">
              {upcomingBookings.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-muted uppercase tracking-widest mb-3">Upcoming</h3>
                  <div className="space-y-3">
                    {upcomingBookings.map(b => <BookingCard key={b.id} b={b} user={user} onCancel={() => cancelBooking.mutate(b.id)} />)}
                  </div>
                </div>
              )}
              {pastBookings.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-muted uppercase tracking-widest mb-3">Past Stays</h3>
                  <div className="space-y-3">
                    {pastBookings.map(b => <BookingCard key={b.id} b={b} user={user} />)}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── SETTINGS TAB ── */}
      {tab === 'settings' && (
        <div className="space-y-6">

          {/* ── Personal Information ── */}
          <div className="bg-white rounded-2xl shadow-lg border border-cream-dark p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-lg font-bold text-navy">Personal Information</h3>
                <p className="text-xs text-muted mt-0.5">Your basic profile details</p>
              </div>
              {!personalEditing ? (
                <button onClick={() => setPersonalEditing(true)}
                  className="text-sm text-gold hover:text-gold-dark font-medium transition-colors flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => { updateProfile.mutate(personalForm); setPersonalEditing(false); }}
                    disabled={updateProfile.isPending}
                    className="bg-gold hover:bg-gold-light disabled:bg-gold/50 text-navy font-semibold px-4 py-2 rounded-xl text-sm transition-all">
                    {updateProfile.isPending ? 'Saving...' : 'Save'}
                  </button>
                  <button onClick={() => setPersonalEditing(false)}
                    className="text-muted hover:text-navy text-sm px-3 py-2 transition-colors">Cancel</button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Full Name" value={personalForm.name} editing={personalEditing}
                onChange={v => setPersonalForm(f => ({ ...f, name: v }))} placeholder="John Doe" />
              <div>
                <label className="block text-xs font-medium text-muted uppercase tracking-widest mb-1.5">Email Address</label>
                <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-cream border border-cream-dark">
                  <span className="text-navy text-sm">{user?.email}</span>
                  <span className="text-xs text-muted bg-cream-dark px-2 py-0.5 rounded-full">Via Firebase</span>
                </div>
              </div>
              <Field label="Phone Number" value={personalForm.phone} editing={personalEditing}
                onChange={v => setPersonalForm(f => ({ ...f, phone: v }))} placeholder="+254 700 000 000" type="tel" />
              <Field label="Date of Birth" value={personalForm.dateOfBirth} editing={personalEditing}
                onChange={v => setPersonalForm(f => ({ ...f, dateOfBirth: v }))} type="date" />
              <div>
                <label className="block text-xs font-medium text-muted uppercase tracking-widest mb-1.5">Gender</label>
                {personalEditing ? (
                  <select value={personalForm.gender} onChange={e => setPersonalForm(f => ({ ...f, gender: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl bg-cream border border-cream-dark focus:border-gold focus:outline-none text-navy text-sm transition-colors">
                    <option value="">Prefer not to say</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                ) : (
                  <div className="px-4 py-3 rounded-xl bg-cream border border-cream-dark text-navy text-sm capitalize">
                    {personalForm.gender || <span className="text-muted">Not set</span>}
                  </div>
                )}
              </div>
              <Field label="ID / Passport Number" value={personalForm.idNumber} editing={personalEditing}
                onChange={v => setPersonalForm(f => ({ ...f, idNumber: v }))} placeholder="A12345678" />
              <Field label="Nationality" value={personalForm.nationality} editing={personalEditing}
                onChange={v => setPersonalForm(f => ({ ...f, nationality: v }))} placeholder="Kenyan" />
              <div>
                <label className="block text-xs font-medium text-muted uppercase tracking-widest mb-1.5">Account Type</label>
                <div className="px-4 py-3 rounded-xl bg-cream border border-cream-dark">
                  <span className={`text-sm font-semibold ${user?.admin || user?.role === 'admin' ? 'text-gold-dark' : 'text-navy'}`}>
                    {user?.admin || user?.role === 'admin' ? '👑 Administrator' : '🏨 Guest Account'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Address ── */}
          <div className="bg-white rounded-2xl shadow-lg border border-cream-dark p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-lg font-bold text-navy">Address</h3>
                <p className="text-xs text-muted mt-0.5">Used for invoices and correspondence</p>
              </div>
              {!addressEditing ? (
                <button onClick={() => setAddressEditing(true)}
                  className="text-sm text-gold hover:text-gold-dark font-medium transition-colors flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit
                </button>
              ) : (
                <div className="flex gap-2">
                  <button onClick={() => { updateProfile.mutate(addressForm); setAddressEditing(false); }}
                    className="bg-gold hover:bg-gold-light text-navy font-semibold px-4 py-2 rounded-xl text-sm transition-all">Save</button>
                  <button onClick={() => setAddressEditing(false)}
                    className="text-muted hover:text-navy text-sm px-3 py-2 transition-colors">Cancel</button>
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Field label="Street Address" value={addressForm.address} editing={addressEditing}
                  onChange={v => setAddressForm(f => ({ ...f, address: v }))} placeholder="123 Westlands Road" />
              </div>
              <Field label="City" value={addressForm.city} editing={addressEditing}
                onChange={v => setAddressForm(f => ({ ...f, city: v }))} placeholder="Nairobi" />
              <Field label="Country" value={addressForm.country} editing={addressEditing}
                onChange={v => setAddressForm(f => ({ ...f, country: v }))} placeholder="Kenya" />
              <Field label="Postal Code" value={addressForm.postalCode} editing={addressEditing}
                onChange={v => setAddressForm(f => ({ ...f, postalCode: v }))} placeholder="00100" />
            </div>
          </div>

          {/* ── Emergency Contact ── */}
          <div className="bg-white rounded-2xl shadow-lg border border-cream-dark p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-lg font-bold text-navy">Emergency Contact</h3>
                <p className="text-xs text-muted mt-0.5">Who should we contact in an emergency?</p>
              </div>
              {!emergencyEditing ? (
                <button onClick={() => setEmergencyEditing(true)}
                  className="text-sm text-gold hover:text-gold-dark font-medium transition-colors flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit
                </button>
              ) : (
                <div className="flex gap-2">
                  <button onClick={() => { updateProfile.mutate(emergencyForm); setEmergencyEditing(false); }}
                    className="bg-gold hover:bg-gold-light text-navy font-semibold px-4 py-2 rounded-xl text-sm transition-all">Save</button>
                  <button onClick={() => setEmergencyEditing(false)}
                    className="text-muted hover:text-navy text-sm px-3 py-2 transition-colors">Cancel</button>
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field label="Contact Name" value={emergencyForm.emergencyName} editing={emergencyEditing}
                onChange={v => setEmergencyForm(f => ({ ...f, emergencyName: v }))} placeholder="Jane Doe" />
              <Field label="Phone Number" value={emergencyForm.emergencyPhone} editing={emergencyEditing}
                onChange={v => setEmergencyForm(f => ({ ...f, emergencyPhone: v }))} placeholder="+254 700 000 000" type="tel" />
              <div>
                <label className="block text-xs font-medium text-muted uppercase tracking-widest mb-1.5">Relationship</label>
                {emergencyEditing ? (
                  <select value={emergencyForm.emergencyRelation}
                    onChange={e => setEmergencyForm(f => ({ ...f, emergencyRelation: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl bg-cream border border-cream-dark focus:border-gold focus:outline-none text-navy text-sm transition-colors">
                    <option value="">Select</option>
                    <option>Spouse / Partner</option>
                    <option>Parent</option>
                    <option>Sibling</option>
                    <option>Child</option>
                    <option>Friend</option>
                    <option>Colleague</option>
                    <option>Other</option>
                  </select>
                ) : (
                  <div className="px-4 py-3 rounded-xl bg-cream border border-cream-dark text-navy text-sm">
                    {emergencyForm.emergencyRelation || <span className="text-muted">Not set</span>}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Stay Preferences ── */}
          <div className="bg-white rounded-2xl shadow-lg border border-cream-dark p-6">
            <h3 className="text-lg font-bold text-navy mb-1">Stay Preferences</h3>
            <p className="text-xs text-muted mb-5">Help us personalise your experience</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { key: 'pillow', label: 'Pillow Type', options: ['Soft', 'Medium', 'Firm'] },
                { key: 'floor', label: 'Floor Preference', options: ['Low floor', 'High floor', 'No preference'] },
                { key: 'bed', label: 'Bed Type', options: ['King', 'Queen', 'Twin', 'No preference'] },
                { key: 'dietary', label: 'Dietary Requirements', options: ['None', 'Vegetarian', 'Vegan', 'Halal', 'Gluten-free'] },
              ].map(pref => (
                <div key={pref.key}>
                  <label className="block text-xs font-medium text-muted uppercase tracking-widest mb-1.5">{pref.label}</label>
                  <select className="w-full px-4 py-3 rounded-xl bg-cream border border-cream-dark focus:border-gold focus:outline-none text-navy text-sm transition-colors">
                    {pref.options.map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
              ))}
            </div>
            <button className="mt-4 bg-gold hover:bg-gold-light text-navy font-semibold px-5 py-2.5 rounded-xl text-sm transition-all">
              Save Preferences
            </button>
          </div>

          {/* ── Notifications ── */}
          <div className="bg-white rounded-2xl shadow-lg border border-cream-dark p-6">
            <h3 className="text-lg font-bold text-navy mb-1">Notifications</h3>
            <p className="text-xs text-muted mb-5">Choose what you hear from us</p>
            <div className="space-y-1">
              {[
                { key: 'emailBookingConfirm', label: 'Booking confirmations', desc: 'Email when a booking is confirmed or updated', icon: '📧' },
                { key: 'emailReminders', label: 'Check-in reminders', desc: 'Email 24 hours before your arrival', icon: '⏰' },
                { key: 'emailOffers', label: 'Special offers & deals', desc: 'Exclusive packages and promotions', icon: '🎁' },
                { key: 'smsReminders', label: 'SMS reminders', desc: 'Text message 2 hours before check-in', icon: '📱' },
              ].map(n => (
                <div key={n.key} className="flex items-center justify-between py-3.5 border-b border-cream last:border-0">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{n.icon}</span>
                    <div>
                      <div className="text-sm font-medium text-navy">{n.label}</div>
                      <div className="text-xs text-muted mt-0.5">{n.desc}</div>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer flex-shrink-0 ml-4">
                    <input type="checkbox" checked={prefs[n.key]}
                      onChange={e => setPrefs(p => ({ ...p, [n.key]: e.target.checked }))}
                      className="sr-only peer" />
                    <div className="w-10 h-6 bg-cream-dark peer-checked:bg-gold rounded-full transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-4 after:shadow-sm"></div>
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* ── Security ── */}
          <div className="bg-white rounded-2xl shadow-lg border border-cream-dark p-6">
            <h3 className="text-lg font-bold text-navy mb-1">Security</h3>
            <p className="text-xs text-muted mb-5">Manage your account security</p>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 bg-cream rounded-xl border border-cream-dark">
                <div className="flex items-center gap-3">
                  <span className="text-xl">🔐</span>
                  <div>
                    <div className="text-sm font-medium text-navy">Password</div>
                    <div className="text-xs text-muted">Last changed: managed by Firebase</div>
                  </div>
                </div>
                <a href="https://accounts.google.com" target="_blank" rel="noopener noreferrer"
                  className="text-sm text-gold hover:text-gold-dark font-medium transition-colors">
                  Change →
                </a>
              </div>
              <div className="flex items-center justify-between p-4 bg-cream rounded-xl border border-cream-dark">
                <div className="flex items-center gap-3">
                  <span className="text-xl">🛡️</span>
                  <div>
                    <div className="text-sm font-medium text-navy">Two-Factor Authentication</div>
                    <div className="text-xs text-muted">Add an extra layer of security</div>
                  </div>
                </div>
                <span className="text-xs bg-yellow-100 text-yellow-700 px-2.5 py-1 rounded-full font-medium">Not enabled</span>
              </div>
            </div>
          </div>

          {/* ── Loyalty Points ── */}
          <div className="bg-white rounded-2xl shadow-lg border border-cream-dark p-6">
            <h3 className="text-lg font-bold text-navy mb-1">Loyalty Points</h3>
            <p className="text-xs text-muted mb-5">Earn 1 point for every KES 100 spent. Redeem for discounts.</p>
            <div className="bg-gradient-to-r from-navy to-navy-light rounded-2xl p-6 text-white mb-4">
              <div className="text-xs text-cream/60 uppercase tracking-widest mb-1">Your Balance</div>
              <div className="text-4xl font-bold text-gold">{user?.loyaltyPoints || 0}</div>
              <div className="text-cream/60 text-sm mt-1">points</div>
              <div className="mt-4 text-xs text-cream/50">
                {user?.loyaltyPoints >= 500 ? '🎉 You can redeem for a discount!' : `${500 - (user?.loyaltyPoints || 0)} more points to unlock your first reward`}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              {[['500 pts', 'KES 500 off', user?.loyaltyPoints >= 500], ['1000 pts', 'KES 1,200 off', user?.loyaltyPoints >= 1000], ['2000 pts', 'Free night', user?.loyaltyPoints >= 2000]].map(([pts, reward, unlocked]) => (
                <div key={pts} className={`rounded-xl p-3 border-2 ${unlocked ? 'border-gold bg-gold/5' : 'border-cream-dark opacity-50'}`}>
                  <div className="text-xs font-bold text-gold">{pts}</div>
                  <div className="text-xs text-navy mt-1">{reward}</div>
                  {unlocked && <div className="text-xs text-green-600 mt-1 font-medium">✓ Unlocked</div>}
                </div>
              ))}
            </div>
          </div>

          {/* ── Danger Zone ── */}
          <div className="bg-white rounded-2xl shadow-lg border border-red-100 p-6">
            <h3 className="text-lg font-bold text-red-600 mb-1">Account Actions</h3>
            <p className="text-muted text-sm mb-5">Irreversible actions — proceed with care.</p>
            <div className="flex flex-wrap gap-3">
              <button onClick={handleLogout}
                className="flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 font-semibold px-5 py-2.5 rounded-xl text-sm transition-all border border-red-200">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sign Out
              </button>
              <button
                onClick={() => { if (window.confirm('Are you sure you want to delete your account? This cannot be undone.')) alert('Please contact support to delete your account.'); }}
                className="flex items-center gap-2 bg-white hover:bg-red-50 text-red-400 hover:text-red-600 font-semibold px-5 py-2.5 rounded-xl text-sm transition-all border border-red-100 hover:border-red-200">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, value, editing, onChange, placeholder, type = 'text' }) {
  return (
    <div>
      <label className="block text-xs font-medium text-muted uppercase tracking-widest mb-1.5">{label}</label>
      {editing ? (
        <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
          className="w-full px-4 py-3 rounded-xl bg-cream border border-cream-dark focus:border-gold focus:outline-none text-navy text-sm transition-colors" />
      ) : (
        <div className="px-4 py-3 rounded-xl bg-cream border border-cream-dark text-navy text-sm">
          {value || <span className="text-muted">Not set</span>}
        </div>
      )}
    </div>
  );
}

function BookingCard({ b, user, onCancel }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-cream-dark p-5 hover:shadow-md transition-shadow">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center text-lg flex-shrink-0">🏨</div>
            <div>
              <h3 className="font-bold text-navy">{b.roomName}</h3>
              <div className="flex flex-wrap gap-3 mt-1 text-sm text-muted">
                <span>📅 {b.checkIn} → {b.checkOut}</span>
                <span>👥 {b.guests} guest{b.guests > 1 ? 's' : ''}</span>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                <StatusBadge status={b.status} />
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${b.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                  {b.paymentStatus === 'paid' ? '💰 Paid' : '⏳ Pending payment'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <span className="text-gold font-bold text-lg">KES {b.totalPrice?.toLocaleString()}</span>
          <div className="flex gap-2">
            {(b.status === 'approved' || b.paymentStatus === 'paid') && (
              <button
                onClick={() => downloadInvoice(b, user)}
                className="flex items-center gap-1.5 text-xs font-semibold text-navy bg-cream hover:bg-cream-dark px-3 py-2 rounded-lg transition-all border border-cream-dark"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Invoice
              </button>
            )}
            {b.status === 'pending' && onCancel && (
              <button onClick={onCancel} className="text-xs font-medium text-red-500 hover:text-red-700 px-3 py-2 rounded-lg border border-red-200 hover:bg-red-50 transition-all">
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    pending: ['bg-yellow-100 text-yellow-800', 'Pending'],
    approved: ['bg-green-100 text-green-800', 'Approved'],
    rejected: ['bg-red-100 text-red-800', 'Rejected'],
    'checked-out': ['bg-gray-100 text-gray-600', 'Checked Out'],
  };
  const [cls, label] = map[status] || ['bg-gray-100 text-gray-700', status];
  return <span className={`text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wide ${cls}`}>{label}</span>;
}
