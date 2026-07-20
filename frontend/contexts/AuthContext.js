'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // ── Hydrate from localStorage on mount ──────────────────────────────
  useEffect(() => {
    const storedToken = localStorage.getItem('health_token');
    const storedUser = localStorage.getItem('health_user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
    }
    setLoading(false);
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

  // ── Logout ─────────────────────────────────────────────────────────
  const logout = useCallback(() => {
    localStorage.removeItem('health_token');
    localStorage.removeItem('health_user');
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
    router.push('/');
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

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
