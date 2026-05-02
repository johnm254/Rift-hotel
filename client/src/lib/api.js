import axios from 'axios';

const api = axios.create({
  // In production (Vercel), use VITE_API_URL env var pointing to Render server
  // In development, Vite proxy handles /api → localhost:5000
  baseURL: import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach Firebase token to every request
api.interceptors.request.use(async (config) => {
  const { auth } = await import('../context/AuthContext');
  // We'll handle this differently — via a token getter
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
