import { Toaster } from 'sonner';
import { Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { WishlistProvider } from './context/WishlistContext';
import { PropertyProvider } from './context/PropertyContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Loading from './components/Loading';
import ProtectedRoute from './components/ProtectedRoute';
import ScrollToTop from './components/ScrollToTop';
import LiveChat from './components/LiveChat';
import PageWrapper from './components/PageWrapper';

import Home from './pages/Home';
import Rooms from './pages/Rooms';
import RoomDetail from './pages/RoomDetail';
import Meals from './pages/Meals';
import MealOrder from './pages/MealOrder';
import Wishlist from './pages/Wishlist';
import Login from './pages/Login';
import Register from './pages/Register';
import Booking from './pages/Booking';
import Profile from './pages/Profile';
import About from './pages/About';
import Contact from './pages/Contact';
import Offers from './pages/Offers';
import FAQ from './pages/FAQ';
import NotFound from './pages/NotFound';

import AirportTransfer from './pages/AirportTransfer';
import Survey from './pages/Survey';
import AdminDashboard from './pages/admin/Dashboard';
import AdminRooms from './pages/admin/Rooms';
import AdminMeals from './pages/admin/Meals';
import AdminBookings from './pages/admin/Bookings';
import AdminGuests from './pages/admin/Guests';
import OccupancyCalendar from './pages/admin/OccupancyCalendar';
import Housekeeping from './pages/admin/Housekeeping';
import AdminPackages from './pages/admin/Packages';
import AdminPricing from './pages/admin/Pricing';
import AdminProperties from './pages/admin/Properties';
import AdminLayout from './components/AdminLayout';

// Push notification setup
function usePushNotifications(user, isAdmin) {
  useEffect(() => {
    if (!user || !isAdmin) return;
    if (!('Notification' in window)) return;
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, [user, isAdmin]);
}

function AppContent() {
  const { loading, user, isAdmin } = useAuth();
  const location = useLocation();
  usePushNotifications(user, isAdmin);

  const isAdminRoute = location.pathname.startsWith('/admin');

  if (loading) return <Loading full />;

  if (isAdminRoute) {
    return (
      <>
        <Toaster position="top-right" richColors closeButton />
        <PageWrapper>
          <Routes>
            <Route path="/admin" element={<ProtectedRoute admin><AdminLayout><AdminDashboard /></AdminLayout></ProtectedRoute>} />
            <Route path="/admin/rooms" element={<ProtectedRoute admin><AdminLayout><AdminRooms /></AdminLayout></ProtectedRoute>} />
            <Route path="/admin/meals" element={<ProtectedRoute admin><AdminLayout><AdminMeals /></AdminLayout></ProtectedRoute>} />
            <Route path="/admin/bookings" element={<ProtectedRoute admin><AdminLayout><AdminBookings /></AdminLayout></ProtectedRoute>} />
            <Route path="/admin/guests" element={<ProtectedRoute admin><AdminLayout><AdminGuests /></AdminLayout></ProtectedRoute>} />
            <Route path="/admin/calendar" element={<ProtectedRoute admin><AdminLayout><OccupancyCalendar /></AdminLayout></ProtectedRoute>} />
            <Route path="/admin/housekeeping" element={<ProtectedRoute admin><AdminLayout><Housekeeping /></AdminLayout></ProtectedRoute>} />
            <Route path="/admin/packages" element={<ProtectedRoute admin><AdminLayout><AdminPackages /></AdminLayout></ProtectedRoute>} />
            <Route path="/admin/pricing" element={<ProtectedRoute admin><AdminLayout><AdminPricing /></AdminLayout></ProtectedRoute>} />
            <Route path="/admin/properties" element={<ProtectedRoute admin><AdminLayout><AdminProperties /></AdminLayout></ProtectedRoute>} />
          </Routes>
        </PageWrapper>
      </>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-cream">
      <Toaster position="top-right" richColors closeButton />
      <Navbar />
      <main className="flex-1">
        <PageWrapper>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/rooms" element={<Rooms />} />
            <Route path="/rooms/:id" element={<RoomDetail />} />
            <Route path="/meals" element={<Meals />} />
            <Route path="/order" element={<MealOrder />} />
            <Route path="/wishlist" element={<Wishlist />} />
            <Route path="/transfer" element={<ProtectedRoute><AirportTransfer /></ProtectedRoute>} />
            <Route path="/offers" element={<Offers />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/booking/:roomId" element={<ProtectedRoute><Booking /></ProtectedRoute>} />
            <Route path="/survey" element={<Survey />} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </PageWrapper>
      </main>
      <Footer />
      <ScrollToTop />
      <LiveChat />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <WishlistProvider>
        <PropertyProvider>
          <AppContent />
        </PropertyProvider>
      </WishlistProvider>
    </ThemeProvider>
  );
}
