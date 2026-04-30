import { createContext, useContext, useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword } from 'firebase/auth';
import api from '../lib/api';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

let app, auth;
try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
} catch (e) { console.warn('Firebase not configured'); }

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('authToken'));

  useEffect(() => {
    if (!auth) { setLoading(false); return; }
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const t = await firebaseUser.getIdToken();
        localStorage.setItem('authToken', t);
        setToken(t);

        // Fetch full profile from backend
        try {
          const { data } = await api.get('/auth/me', { headers: { Authorization: `Bearer ${t}` } });
          setUser(data);
        } catch {
          setUser({ uid: firebaseUser.uid, email: firebaseUser.email, name: firebaseUser.displayName, admin: false });
        }
      } else {
        localStorage.removeItem('authToken');
        setUser(null);
        setToken(null);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const login = async (email, password) => {
    if (!auth) throw new Error('Firebase not configured');
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const t = await cred.user.getIdToken();
    localStorage.setItem('authToken', t);
    setToken(t);
    const { data } = await api.get('/auth/me', { headers: { Authorization: `Bearer ${t}` } });
    setUser(data);
    return data;
  };

  const register = async (email, password, name) => {
    if (!auth) throw new Error('Firebase not configured');
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const t = await cred.user.getIdToken();
    localStorage.setItem('authToken', t);
    setToken(t);
    await api.post('/auth/register', { email, password, name });
    const { data } = await api.get('/auth/me', { headers: { Authorization: `Bearer ${t}` } });
    setUser(data);
    return data;
  };

  const logout = async () => {
    if (auth) await signOut(auth);
    localStorage.removeItem('authToken');
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, token, login, register, logout, isAdmin: user?.admin || user?.role === 'admin' }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
