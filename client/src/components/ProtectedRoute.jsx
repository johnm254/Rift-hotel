import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Loading from './Loading';

export default function ProtectedRoute({ children, admin = false }) {
  const { user, loading } = useAuth();

  if (loading) return <Loading full />;
  if (!user) return <Navigate to="/login" />;
  if (admin && !(user.admin || user.role === 'admin')) return <Navigate to="/" />;

  return children;
}
