import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';
import Loading from '../../components/Loading';

const COLORS = [
  'bg-blue-400', 'bg-purple-400', 'bg-pink-400', 'bg-orange-400',
  'bg-teal-400', 'bg-indigo-400', 'bg-rose-400', 'bg-amber-400',
];

export default function OccupancyCalendar() {
  const today = new Date();
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const monthName = viewDate.toLocaleDateString('en-KE', { month: 'long', year: 'numeric' });

  const { data: roomsData } = useQuery({
    queryKey: ['adminRooms'],
    queryFn: () => api.get('/rooms').then(r => {
      const d = r.data;
      return Array.isArray(d) ? d : (d.rooms || []);
    }).catch(() => []),
  });

  const { data: bookingsData, isLoading } = useQuery({
    queryKey: ['adminBookings'],
    queryFn: () => api.get('/bookings').then(r => {
      const d = r.data;
      return Array.isArray(d) ? d : (d.bookings || []);
    }).catch(() => []),
  });

  const rooms = roomsData || [];
  const bookings = (bookingsData || []).filter(b => b.status === 'approved' || b.status === 'checked-out');

  const getBookingsForRoomDay = (roomId, day) => {
    const d = new Date(year, month, day);
    return bookings.filter(b => {
      if (b.roomId !== roomId) return false;
      const start = new Date(b.checkIn);
      const end = new Date(b.checkOut);
      return d >= start && d < end;
    });
  };

  const totalOccupied = rooms.reduce((count, room) => {
    for (let d = 1; d <= daysInMonth; d++) {
      if (getBookingsForRoomDay(room.id, d).length > 0) count++;
    }
    return count;
  }, 0);
  const totalSlots = rooms.length * daysInMonth;
  const occupancyRate = totalSlots > 0 ? Math.round((totalOccupied / totalSlots) * 100) : 0;

  if (isLoading) return <Loading />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
        <div>
          <h1 className="text-3xl font-serif font-bold text-navy">Occupancy Calendar</h1>
          <p className="text-muted text-sm mt-1">{rooms.length} rooms · {occupancyRate}% occupancy this month</p>
        </div>
        <div className="flex items-center gap-3 mt-4 sm:mt-0">
          <button onClick={() => setViewDate(new Date(year, month - 1, 1))}
            className="w-10 h-10 rounded-xl bg-white border border-cream-dark hover:bg-cream flex items-center justify-center text-navy transition-colors">‹</button>
          <span className="font-semibold text-navy min-w-[160px] text-center">{monthName}</span>
          <button onClick={() => setViewDate(new Date(year, month + 1, 1))}
            className="w-10 h-10 rounded-xl bg-white border border-cream-dark hover:bg-cream flex items-center justify-center text-navy transition-colors">›</button>
        </div>
      </div>

      {/* Occupancy rate bar */}
      <div className="bg-white rounded-2xl border border-cream-dark p-5 mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-navy">Monthly Occupancy Rate</span>
          <span className="text-lg font-bold text-gold">{occupancyRate}%</span>
        </div>
        <div className="h-3 bg-cream-dark rounded-full overflow-hidden">
          <div className="h-full bg-gold rounded-full transition-all duration-500" style={{ width: `${occupancyRate}%` }} />
        </div>
        <div className="flex justify-between text-xs text-muted mt-1">
          <span>{totalOccupied} room-nights booked</span>
          <span>{totalSlots - totalOccupied} available</span>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="bg-white rounded-2xl border border-cream-dark overflow-hidden shadow-sm">
        {/* Day headers */}
        <div className="grid border-b border-cream-dark" style={{ gridTemplateColumns: `200px repeat(${daysInMonth}, minmax(32px, 1fr))` }}>
          <div className="px-4 py-3 text-xs font-semibold text-muted uppercase tracking-widest bg-cream">Room</div>
          {Array(daysInMonth).fill(null).map((_, i) => {
            const d = i + 1;
            const isToday = year === today.getFullYear() && month === today.getMonth() && d === today.getDate();
            return (
              <div key={d} className={`py-3 text-center text-xs font-semibold border-l border-cream-dark ${isToday ? 'bg-gold/20 text-gold-dark' : 'bg-cream text-muted'}`}>
                {d}
              </div>
            );
          })}
        </div>

        {/* Room rows */}
        {rooms.length === 0 ? (
          <div className="text-center py-16 text-muted">
            <div className="text-4xl mb-3">📅</div>
            <p>No rooms found. Add rooms first.</p>
          </div>
        ) : rooms.map((room, ri) => (
          <div key={room.id} className="grid border-b border-cream-dark last:border-0 hover:bg-cream/30 transition-colors"
            style={{ gridTemplateColumns: `200px repeat(${daysInMonth}, minmax(32px, 1fr))` }}>
            {/* Room name */}
            <div className="px-4 py-3 flex items-center gap-2 border-r border-cream-dark">
              <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${COLORS[ri % COLORS.length]}`} />
              <span className="text-sm font-medium text-navy truncate">{room.name}</span>
            </div>
            {/* Day cells */}
            {Array(daysInMonth).fill(null).map((_, i) => {
              const day = i + 1;
              const dayBookings = getBookingsForRoomDay(room.id, day);
              const isBooked = dayBookings.length > 0;
              const isToday = year === today.getFullYear() && month === today.getMonth() && day === today.getDate();
              const isPast = new Date(year, month, day) < new Date(today.getFullYear(), today.getMonth(), today.getDate());

              return (
                <div key={day} title={isBooked ? `${dayBookings[0].userName} · ${dayBookings[0].checkIn} → ${dayBookings[0].checkOut}` : ''}
                  className={`border-l border-cream-dark py-3 flex items-center justify-center transition-colors ${
                    isBooked ? `${COLORS[ri % COLORS.length]} opacity-80` :
                    isToday ? 'bg-gold/10' :
                    isPast ? 'bg-cream/50' : ''
                  }`}>
                  {isBooked && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mt-4 text-xs text-muted">
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-blue-400" /> Booked</div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-gold/20 border border-gold/30" /> Today</div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-cream-dark" /> Available</div>
      </div>
    </div>
  );
}
