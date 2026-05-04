
// MealOrder.jsx — redirects to the right place based on context
// Walk-in guests → /meals (restaurant page with cart + checkout)
// Hotel guests with active booking → /my-room (room portal)
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import Loading from '../components/Loading';
import api from '../lib/api';

export default function MealOrder() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const { data: bookingsData, isLoading: bookingsLoading } = useQuery({
    queryKey: ['myBookings'],
    queryFn: () => api.get('/bookings/mine').then(r => {
      const d = r.data;
      return Array.isArray(d) ? d : (d.bookings || []);
    }).catch(() => []),
    enabled: !!user,
  });

  useEffect(() => {
    if (loading || bookingsLoading) return;

    if (!user) {
      // Not signed in → go to restaurant page
      navigate('/meals', { replace: true });
      return;
    }

    // Check for active booking (checked in today)
    const today = new Date().toISOString().split('T')[0];
    const activeBooking = bookingsData?.find(b =>
      b.status === 'approved' && b.checkIn <= today && b.checkOut >= today
    );

    if (activeBooking) {
      // Hotel guest with active stay → room portal food tab
      navigate('/my-room', { replace: true });
    } else {
      // Signed in but no active stay → restaurant page
      navigate('/meals', { replace: true });
    }
  }, [user, loading, bookingsData, bookingsLoading, navigate]);

  return <Loading full />;
}
