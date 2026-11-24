import React, { useState } from 'react';
import { api } from '../api';
import { Lock, Mail, User, Flame } from 'lucide-react';

export default function Auth({ onLoginSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let res;
      if (isLogin) {
        res = await api.login(email, password);
      } else {
        res = await api.register(name, email, password);
      }
      api.setToken(res.data.token);
      onLoginSuccess(res.data.user);
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-transparent px-4 selection:bg-red-600 selection:text-white">
      <div className="max-w-md w-full bg-[#090A10]/85 border border-white/[0.12] rounded-3xl p-8 sm:p-10 shadow-[0_25px_60px_rgba(0,0,0,0.9)] relative overflow-hidden backdrop-blur-2xl">
        <div className="flex justify-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-600 to-red-900 flex items-center justify-center text-white shadow-[0_0_25px_rgba(220,38,38,0.5)]">
            <Flame className="w-6 h-6 fill-white text-white" />
          </div>
        </div>

        <div className="text-center mb-8">
          <h2 className="text-2xl font-black uppercase tracking-wider text-white">
            AUTOTRACK <span className="text-red-500 font-mono text-sm">GT</span>
          </h2>
          <p className="text-xs font-mono text-slate-500 mt-1 uppercase tracking-widest">
            {isLogin ? 'Access Vehicle Telemetry Console' : 'Initialize Fleet Telemetry Access'}
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3.5 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-xl font-mono">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs">
          {!isLogin && (
            <div>
              <label className="block text-slate-400 uppercase tracking-wider mb-1.5">Operator Name</label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Utkarsh Shaning"
                  className="w-full bg-[#11131C] border border-white/[0.08] rounded-xl pl-10 pr-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-red-500 transition text-xs"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-slate-400 uppercase tracking-wider mb-1.5">Telemetry Credentials (Email)</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="operator@autotrack.io"
                className="w-full bg-[#11131C] border border-white/[0.08] rounded-xl pl-10 pr-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-red-500 transition text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-400 uppercase tracking-wider mb-1.5">Security Passkey</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-[#11131C] border border-white/[0.08] rounded-xl pl-10 pr-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-red-500 transition text-xs"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold py-3 rounded-xl transition duration-200 shadow-[0_0_20px_rgba(220,38,38,0.4)] disabled:opacity-50 uppercase tracking-wider text-xs"
          >
            {loading ? 'Authenticating...' : (isLogin ? 'Authenticate // Enter' : 'Initialize Account')}
          </button>
        </form>

        <div className="mt-8 text-center border-t border-white/[0.06] pt-4">
          <button
            onClick={() => { setIsLogin(!isLogin); setError(''); }}
            className="text-xs font-mono text-slate-400 hover:text-red-400 transition"
          >
            {isLogin ? "Need access? Request new operator pass" : "Existing operator? Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}
