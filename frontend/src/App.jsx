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

  return (
    <div className="relative min-h-screen bg-[#05060A] text-[#F3F4F6] selection:bg-red-600 selection:text-white">
      <div
        className="fixed inset-0 pointer-events-none z-0 bg-cover bg-center bg-no-repeat opacity-[0.22] filter brightness-90 contrast-125 transition-opacity duration-1000"
        style={{ backgroundImage: "url('/porsche-bg.jpg')" }}
      />
      <div className="fixed inset-0 pointer-events-none z-0 bg-gradient-to-b from-[#05060A]/80 via-[#05060A]/65 to-[#05060A]/95" />
      <div className="fixed inset-0 pointer-events-none z-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-red-950/20 via-transparent to-transparent" />

      <div className="relative z-10 min-h-screen">
        {loading ? (
          <div className="min-h-screen flex items-center justify-center text-slate-400 font-mono text-xs uppercase tracking-widest">
            <span className="w-2 h-2 rounded-full bg-red-600 animate-ping mr-3"></span>
            Initializing AutoTrack GT Telemetry...
          </div>
        ) : !user ? (
          <Auth onLoginSuccess={(userData) => setUser(userData)} />
        ) : (
          <Dashboard user={user} onLogout={handleLogout} />
        )}
      </div>
    </div>
  );
}
