import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Sparkles, Activity, CheckSquare, BarChart2, ArrowRight, Flame } from 'lucide-react';

export default async function LandingPage() {
  const user = await getCurrentUser();
  if (user) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-[#0B0F17] text-white flex flex-col justify-between selection:bg-emerald-500 selection:text-white font-sans">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto w-full border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-500 text-slate-950 font-bold text-sm shadow-sm">
            <Activity className="w-5 h-5 stroke-[2.5]" />
          </div>
          <span className="text-lg font-extrabold tracking-tight text-white">
            HabitIQ
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-xs font-semibold text-slate-300 hover:text-white transition-colors px-3 py-1.5"
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="px-4 py-2 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl shadow-md transition-all"
          >
            Get Started
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 py-16 max-w-4xl mx-auto space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-800/60 text-emerald-400 text-xs font-mono font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          Clinical Precision & Multi-Tier AI Insights Engine
        </div>

        <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-tight">
          Master Daily Habits.{' '}
          <span className="text-emerald-400">
            Scientifically.
          </span>
        </h1>

        <p className="text-sm sm:text-base text-slate-400 max-w-xl leading-relaxed font-sans">
          Track daily completions with local timezone boundary protection, calculate longest streaks, analyze contribution heatmaps, and unlock deep Groq & Gemini AI insights into your behavioral momentum.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <Link
            href="/signup"
            className="flex items-center justify-center gap-2 px-6 py-3 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl shadow-lg transition-all"
          >
            Start Tracking Free <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/login"
            className="px-6 py-3 text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 border border-slate-800 rounded-xl transition-all"
          >
            Sign In to Account
          </Link>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-12 text-left w-full">
          <div className="p-5 bg-slate-900/60 border border-slate-800/80 rounded-2xl space-y-2">
            <CheckSquare className="w-6 h-6 text-emerald-400" />
            <h3 className="font-bold text-sm text-white">Midnight Reset</h3>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              Local timezone boundary reset without overwriting historical records.
            </p>
          </div>

          <div className="p-5 bg-slate-900/60 border border-slate-800/80 rounded-2xl space-y-2">
            <BarChart2 className="w-6 h-6 text-sky-400" />
            <h3 className="font-bold text-sm text-white">Contribution Heatmap</h3>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              GitHub-style matrix calculated relative to active habit denominator.
            </p>
          </div>

          <div className="p-5 bg-slate-900/60 border border-slate-800/80 rounded-2xl space-y-2">
            <Sparkles className="w-6 h-6 text-amber-400" />
            <h3 className="font-bold text-sm text-white">Groq & Gemini AI</h3>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              Structured behavioral momentum analysis with offline heuristic backup.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-4 text-xs font-mono text-slate-600 border-t border-slate-900">
        HabitIQ Engine © {new Date().getFullYear()}
      </footer>
    </div>
  );
}
