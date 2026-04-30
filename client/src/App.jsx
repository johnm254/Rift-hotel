import { Toaster } from 'sonner';
import { Routes, Route } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Loading from './components/Loading';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Rooms from './pages/Rooms';
import RoomDetail from './pages/RoomDetail';
import Meals from './pages/Meals';
import Login from './pages/Login';
import Register from './pages/Register';
import Booking from './pages/Booking';
import Profile from './pages/Profile';
import AdminDashboard from './pages/admin/Dashboard';
import AdminRooms from './pages/admin/Rooms';
import AdminMeals from './pages/admin/Meals';
import AdminBookings from './pages/admin/Bookings';

export default function App() {
  const { loading } = useAuth();

  if (loading) return <Loading full />;

  return (
    <div className="min-h-screen flex flex-col bg-cream">
      <Toaster position="top-right" richColors closeButton />
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/rooms" element={<Rooms />} />
          <Route path="/rooms/:id" element={<RoomDetail />} />
          <Route path="/meals" element={<Meals />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/booking/:roomId" element={<ProtectedRoute><Booking /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute admin><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/rooms" element={<ProtectedRoute admin><AdminRooms /></ProtectedRoute>} />
          <Route path="/admin/meals" element={<ProtectedRoute admin><AdminMeals /></ProtectedRoute>} />
          <Route path="/admin/bookings" element={<ProtectedRoute admin><AdminBookings /></ProtectedRoute>} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
