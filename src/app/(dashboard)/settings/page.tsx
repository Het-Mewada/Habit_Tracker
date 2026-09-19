'use client';

import React, { useState, useEffect } from 'react';
import { User, Key, Globe, Check, AlertCircle, Save, Sparkles } from 'lucide-react';

export default function SettingsPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [timezone, setTimezone] = useState('');
  const [groqApiKey, setGroqApiKey] = useState('');
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [requireMin7DaysAi, setRequireMin7DaysAi] = useState(true);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setName(data.user.name || '');
          setEmail(data.user.email || '');
          setTimezone(data.user.timezone || 'UTC');
          setGroqApiKey(data.user.groqApiKey || '');
          setGeminiApiKey(data.user.geminiApiKey || '');
          setRequireMin7DaysAi(data.user.requireMin7DaysAi !== false);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');

    try {
      const res = await fetch('/api/auth/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          timezone,
          groqApiKey,
          geminiApiKey,
          requireMin7DaysAi,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to save settings');
      }

      setMessage('Settings updated successfully');
    } catch (err: any) {
      setError(err?.message || 'Update failed');
    }
    setSaving(false);
  };

  if (loading) {
    return <div className="p-8 text-center text-xs font-mono text-slate-400">Loading settings...</div>;
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
          Account & AI Settings
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Manage your personal profile, local timezone, and Groq / Gemini AI keys
        </p>
      </div>

      {message && (
        <div className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center gap-2 text-xs">
          <Check className="w-4 h-4 text-slate-600 dark:text-slate-300" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 rounded-lg border border-red-200 dark:border-red-900/40 flex items-center gap-2 text-xs">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-4">
        {/* Profile Card */}
        <div className="p-5 bg-white dark:bg-[#15181E] rounded-xl border border-slate-200/60 dark:border-slate-800/60 shadow-2xs space-y-3">
          <h2 className="text-xs font-mono font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-slate-500" /> Profile Information
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0E1013] text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-1 focus:ring-slate-400 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Email Address (Read-only)
              </label>
              <input
                type="email"
                disabled
                value={email}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/40 text-slate-500 text-xs cursor-not-allowed font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Timezone (for Midnight Daily Reset)
            </label>
            <div className="relative">
              <Globe className="w-4 h-4 absolute left-3 top-2 text-slate-400" />
              <input
                type="text"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                placeholder="e.g. UTC, Asia/Kolkata, America/New_York"
                className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0E1013] text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-1 focus:ring-slate-400 font-mono"
              />
            </div>
          </div>
        </div>

        {/* AI Keys Card */}
        <div className="p-5 bg-white dark:bg-[#15181E] rounded-xl border border-slate-200/60 dark:border-slate-800/60 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-mono font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-slate-500" /> AI Provider API Keys
            </h2>
            <span className="px-2 py-0.2 text-[9px] font-mono font-semibold rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              Multi-Tier Fallback
            </span>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal">
            HabitPulse uses a 3-tier strategy: <b>Groq API</b> is queried first, followed by <b>Google Gemini API</b> as backup, and an offline <b>Heuristic Engine</b> fallback.
          </p>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Groq API Key (Primary Provider)
              </label>
              <div className="relative">
                <Key className="w-4 h-4 absolute left-3 top-2 text-slate-400" />
                <input
                  type="password"
                  value={groqApiKey}
                  onChange={(e) => setGroqApiKey(e.target.value)}
                  placeholder="gsk_..."
                  className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0E1013] text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-1 focus:ring-slate-400 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Google Gemini API Key (Secondary Backup)
              </label>
              <div className="relative">
                <Key className="w-4 h-4 absolute left-3 top-2 text-slate-400" />
                <input
                  type="password"
                  value={geminiApiKey}
                  onChange={(e) => setGeminiApiKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0E1013] text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-1 focus:ring-slate-400 font-mono"
                />
              </div>
            </div>

            {/* 7-Day Gatekeeper Toggle */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800/60">
              <div className="flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <label className="text-xs font-semibold text-slate-900 dark:text-slate-100 block cursor-pointer" onClick={() => setRequireMin7DaysAi(!requireMin7DaysAi)}>
                    Require 7+ Days Data for AI Analysis
                  </label>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                    When ON (default), AI API calls (Groq & Gemini) are skipped if you have less than 7 days of habit tracking history. Turn OFF to analyze data sooner.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setRequireMin7DaysAi(!requireMin7DaysAi)}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    requireMin7DaysAi ? 'bg-slate-900 dark:bg-slate-100' : 'bg-slate-200 dark:bg-slate-800'
                  }`}
                  aria-label="Toggle 7-day data requirement for AI analysis"
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white dark:bg-slate-900 shadow-lg ring-0 transition duration-200 ease-in-out ${
                      requireMin7DaysAi ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 dark:bg-slate-100 dark:text-slate-900 rounded-lg shadow-2xs hover:bg-slate-800 disabled:opacity-50 transition-all"
          >
            <Save className="w-3.5 h-3.5" />
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}
