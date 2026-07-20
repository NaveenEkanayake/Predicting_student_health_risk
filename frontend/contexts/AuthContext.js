'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import BrandLoader from '../components/BrandLoader';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const start = Date.now();
    const storedToken = localStorage.getItem('health_token');
    const storedUser = localStorage.getItem('health_user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
    }
    const elapsed = Date.now() - start;
    const delay = Math.max(0, 1200 - elapsed);
    setTimeout(() => setLoading(false), delay);
  }, []);

  // ── Login ──────────────────────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    const { data } = await axios.post('/api/auth/login', { email, password });
    const { token: newToken, parent } = data;

    localStorage.setItem('health_token', newToken);
    localStorage.setItem('health_user', JSON.stringify(parent));

    setToken(newToken);
    setUser(parent);
    axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;

    return data;
  }, []);

  // ── Register ───────────────────────────────────────────────────────
  const register = useCallback(async (name, email, password) => {
    const { data } = await axios.post('/api/auth/register', { name, email, password });
    const { token: newToken, parent } = data;

    localStorage.setItem('health_token', newToken);
    localStorage.setItem('health_user', JSON.stringify(parent));

    setToken(newToken);
    setUser(parent);
    axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;

    return data;
  }, []);

  const logout = useCallback(() => {
    setLoading(true);
    localStorage.removeItem('health_token');
    localStorage.removeItem('health_user');
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
    setTimeout(() => {
      router.push('/');
      setTimeout(() => setLoading(false), 500);
    }, 1000);
  }, [router]);

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!token && !!user,
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {loading ? <BrandLoader text="Initializing Student Wellness Dashboard..." /> : children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
