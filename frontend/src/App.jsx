import React, { useState, useEffect } from 'react';
import { api } from './api';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = api.getToken();
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const res = await api.getProfile();
      setUser(res.data);
    } catch (err) {
      api.clearToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    api.clearToken();
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        Initializing AutoTrack...
      </div>
    );
  }

  if (!user) {
    return <Auth onLoginSuccess={(userData) => setUser(userData)} />;
  }

  return <Dashboard user={user} onLogout={handleLogout} />;
}
