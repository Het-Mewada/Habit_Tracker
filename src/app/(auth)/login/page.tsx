'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Lock, Mail, AlertCircle, Activity } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to sign in');
      }

      router.push('/dashboard');
      router.refresh();
    } catch (err: any) {
      setError(err?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#0E1013] text-white font-sans">
      <div className="w-full max-w-sm p-7 bg-[#15181E] border border-slate-800 rounded-xl shadow-xl space-y-5">
        <div className="text-center space-y-1">
          <div className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-slate-100 text-slate-900 font-bold text-lg mb-1">
            <Activity className="w-5 h-5 stroke-[2]" />
          </div>
          <h1 className="text-lg font-bold">Welcome Back</h1>
          <p className="text-xs text-slate-400">Sign in to track your habits and view AI insights</p>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-2.5 text-xs text-red-400 bg-red-950/30 border border-red-900/40 rounded-lg">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-9 pr-3 py-2 bg-[#0E1013] border border-slate-800 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-slate-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 bg-[#0E1013] border border-slate-800 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-slate-400"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-1.5 py-2 px-4 text-xs font-semibold text-slate-900 bg-slate-100 hover:bg-white rounded-lg disabled:opacity-50 transition-all mt-1"
          >
            {loading ? 'Signing In...' : 'Sign In'} <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        <div className="text-center text-xs text-slate-400 pt-2 border-t border-slate-800/80 font-mono">
          Don't have an account?{' '}
          <Link href="/signup" className="font-bold text-slate-200 hover:underline">
            Register
          </Link>
        </div>
      </div>
    </div>
  );
}
