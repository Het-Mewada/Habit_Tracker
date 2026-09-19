'use client';

import React from 'react';
import {
  Sparkles,
  RefreshCw,
  Flame,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Brain,
  Lightbulb,
  CheckCircle2,
  Activity,
} from 'lucide-react';
import { StructuredAiInsight } from '@/lib/ai/heuristic';
import { HabitIconView } from '@/lib/icon-map';
import Link from 'next/link';

interface InsightsViewProps {
  insight: StructuredAiInsight | null;
  isCached: boolean;
  onRefresh: () => Promise<void>;
  isLoading: boolean;
}

export const InsightsView: React.FC<InsightsViewProps> = ({
  insight,
  isCached,
  onRefresh,
  isLoading,
}) => {
  if (!insight) {
    return (
      <div className="p-10 text-center bg-white dark:bg-[#15181E] rounded-xl border border-slate-200/60 dark:border-slate-800/60 shadow-2xs space-y-3">
        <Sparkles className="w-8 h-8 text-slate-400 mx-auto" />
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
          No Insights Generated Yet
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
          Analyze historical habit data and generate structured Groq / Gemini AI insights.
        </p>
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 dark:bg-slate-100 dark:text-slate-900 rounded-lg shadow-2xs disabled:opacity-50"
        >
          {isLoading ? 'Analyzing...' : 'Generate AI Insights'}
        </button>
      </div>
    );
  }

  if (insight.provider === 'insufficient_data') {
    return (
      <div className="p-6 sm:p-8 bg-white dark:bg-[#15181E] rounded-xl border border-slate-200/60 dark:border-slate-800/60 shadow-2xs space-y-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-lg border border-amber-200/60 dark:border-amber-900/40 shrink-0 mt-0.5">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                7-Day Data Requirement Active
              </h2>
              <span className="px-2 py-0.2 text-[9px] font-mono font-bold rounded bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
                AI API Call Skipped
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {insight.overallPerformance.summaryText}
            </p>
          </div>
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-800/30 rounded-lg space-y-2 border border-slate-100 dark:border-slate-800/60">
          <h3 className="text-xs font-mono font-semibold text-slate-500 uppercase tracking-wider">
            Status Breakdown
          </h3>
          <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1 list-disc list-inside font-sans">
            {insight.behavioralPatterns.map((pat, i) => (
              <li key={i}>{pat}</li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800/60">
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
            Want to run AI analysis now? You can turn off this requirement in Settings.
          </p>
          <Link
            href="/settings"
            className="inline-flex items-center justify-center px-4 py-2 text-xs font-semibold text-white bg-slate-900 dark:bg-slate-100 dark:text-slate-900 rounded-lg shadow-2xs whitespace-nowrap hover:bg-slate-800 transition-all self-start sm:self-auto"
          >
            Manage AI Settings →
          </Link>
        </div>
      </div>
    );
  }

  const {
    provider,
    generatedAt,
    overallPerformance,
    strongestHabits,
    strugglingHabits,
    improvingTrends,
    decliningTrends,
    behavioralPatterns,
    recommendations,
  } = insight;

  const providerLabel =
    insight.modelUsed
      ? provider === 'groq'
        ? `⚡ Groq (${insight.modelUsed})`
        : provider === 'gemini'
        ? `✨ Gemini (${insight.modelUsed})`
        : `🧠 ${insight.modelUsed}`
      : provider === 'groq'
      ? '⚡ Groq AI'
      : provider === 'gemini'
      ? '✨ Gemini 1.5 Flash'
      : '🧠 Behavioral Heuristic Engine';

  return (
    <div className="space-y-5">
      {/* Minimal Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 bg-[#15181E] text-white rounded-xl border border-slate-800 shadow-2xs">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2 flex-wrap">
            <Sparkles className="w-4 h-4 text-slate-300" />
            <h1 className="text-base font-bold tracking-tight">AI Behavioral Intelligence</h1>
            <span className="px-2 py-0.2 text-[9px] font-mono font-bold rounded bg-slate-800 text-slate-300 border border-slate-700">
              {providerLabel}
            </span>
          </div>
          <p className="text-[10px] font-mono text-slate-400">
            {isCached ? 'Saved in DB cache • ' : 'Freshly generated • '}
            Timestamp: {new Date(generatedAt).toLocaleString()}
          </p>
        </div>

        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-900 bg-slate-100 hover:bg-white rounded-lg shadow-2xs disabled:opacity-50 transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          {isLoading ? 'Analyzing...' : 'Refresh Insights'}
        </button>
      </div>

      {/* 📊 Overall Performance Card */}
      <div className="p-5 bg-white dark:bg-[#15181E] rounded-xl border border-slate-200/60 dark:border-slate-800/60 shadow-2xs space-y-2.5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-slate-500" /> Performance Overview
          </h2>
          <span className="px-2 py-0.5 text-[10px] font-mono font-semibold rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            {overallPerformance.statusLabel} ({overallPerformance.score}%)
          </span>
        </div>
        <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-sans">
          {overallPerformance.summaryText}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 🔥 Strongest Habits */}
        <div className="p-4 bg-white dark:bg-[#15181E] rounded-xl border border-slate-200/60 dark:border-slate-800/60 shadow-2xs space-y-2.5">
          <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-amber-700 dark:text-sand-400" />
            Strongest Habits
          </h3>
          {strongestHabits.length === 0 ? (
            <p className="text-xs text-slate-400">No habit logs available.</p>
          ) : (
            <div className="space-y-2">
              {strongestHabits.map((h, i) => (
                <div key={i} className="p-2.5 bg-slate-50 dark:bg-slate-800/20 rounded-lg space-y-0.5">
                  <div className="flex items-center justify-between font-semibold text-xs text-slate-900 dark:text-slate-100">
                    <span className="flex items-center gap-1.5">
                      <HabitIconView iconKey={h.icon} className="w-3.5 h-3.5 text-slate-600" />
                      {h.name}
                    </span>
                    <span className="font-mono text-[10px] text-slate-600 dark:text-slate-400">
                      {h.completionRate}%
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{h.insight}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ⚠️ Struggling Habits */}
        <div className="p-4 bg-white dark:bg-[#15181E] rounded-xl border border-slate-200/60 dark:border-slate-800/60 shadow-2xs space-y-2.5">
          <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-slate-500" />
            Habits Needing Focus
          </h3>
          {strugglingHabits.length === 0 ? (
            <p className="text-xs text-slate-400">All habit targets maintained.</p>
          ) : (
            <div className="space-y-2">
              {strugglingHabits.map((h, i) => (
                <div key={i} className="p-2.5 bg-slate-50 dark:bg-slate-800/20 rounded-lg space-y-0.5">
                  <div className="flex items-center justify-between font-semibold text-xs text-slate-900 dark:text-slate-100">
                    <span className="flex items-center gap-1.5">
                      <HabitIconView iconKey={h.icon} className="w-3.5 h-3.5 text-slate-500" />
                      {h.name}
                    </span>
                    <span className="font-mono text-[10px] text-slate-500">
                      {h.completionRate}%
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{h.insight}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 📈 Improving Trends */}
        <div className="p-4 bg-white dark:bg-[#15181E] rounded-xl border border-slate-200/60 dark:border-slate-800/60 shadow-2xs space-y-2.5">
          <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-sage-600 dark:text-sage-300" />
            Positive Momentum
          </h3>
          {improvingTrends.length === 0 ? (
            <p className="text-xs text-slate-400">Steady momentum across recent window.</p>
          ) : (
            <div className="space-y-2">
              {improvingTrends.map((h, i) => (
                <div key={i} className="p-2.5 bg-slate-50 dark:bg-slate-800/20 rounded-lg space-y-0.5">
                  <span className="font-semibold text-xs text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <HabitIconView iconKey={h.icon} className="w-3.5 h-3.5 text-slate-500" />
                    {h.name}
                  </span>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{h.insight}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 📉 Declining Trends */}
        <div className="p-4 bg-white dark:bg-[#15181E] rounded-xl border border-slate-200/60 dark:border-slate-800/60 shadow-2xs space-y-2.5">
          <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
            <TrendingDown className="w-3.5 h-3.5 text-slate-500" />
            Declining Trends
          </h3>
          {decliningTrends.length === 0 ? (
            <p className="text-xs text-slate-400">No declining habit velocity detected.</p>
          ) : (
            <div className="space-y-2">
              {decliningTrends.map((h, i) => (
                <div key={i} className="p-2.5 bg-slate-50 dark:bg-slate-800/20 rounded-lg space-y-0.5">
                  <span className="font-semibold text-xs text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <HabitIconView iconKey={h.icon} className="w-3.5 h-3.5 text-slate-500" />
                    {h.name}
                  </span>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{h.insight}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 🧠 Behavioral Patterns */}
      <div className="p-5 bg-white dark:bg-[#15181E] rounded-xl border border-slate-200/60 dark:border-slate-800/60 shadow-2xs space-y-2.5">
        <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
          <Brain className="w-3.5 h-3.5 text-slate-500" />
          Behavioral Observations
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {behavioralPatterns.map((pattern, i) => (
            <div key={i} className="flex items-start gap-2 p-2.5 bg-slate-50 dark:bg-slate-800/20 rounded-lg">
              <CheckCircle2 className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
              <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">{pattern}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 💡 Recommendations */}
      <div className="p-5 bg-[#15181E] text-white rounded-xl shadow-2xs space-y-2.5 border border-slate-800">
        <h3 className="text-xs font-bold flex items-center gap-1.5 text-slate-200">
          <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
          Recommendations
        </h3>
        <div className="space-y-1.5">
          {recommendations.map((rec, i) => (
            <div key={i} className="flex items-start gap-2.5 p-2.5 bg-slate-800/40 rounded-lg">
              <span className="flex items-center justify-center w-4 h-4 rounded bg-slate-700 text-white font-mono font-bold text-[10px] shrink-0">
                {i + 1}
              </span>
              <p className="text-xs text-slate-300 font-medium">{rec}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
