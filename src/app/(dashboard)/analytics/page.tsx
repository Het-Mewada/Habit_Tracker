'use client';

import React, { useState, useEffect } from 'react';
import { DailyChart } from '@/components/analytics/DailyChart';
import { CalendarHeatmap } from '@/components/analytics/CalendarHeatmap';
import { PerformanceTable } from '@/components/analytics/PerformanceTable';
import { BarChart3, Calendar, Trophy, Flame } from 'lucide-react';
import { clsx } from 'clsx';

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<'7' | '30' | '90' | 'all'>('30');
  const [analyticsData, setAnalyticsData] = useState<{
    dailyChart: any[];
    heatmap: any[];
    performanceTable: any[];
    currentTotalActiveHabits: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async (selectedPeriod: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/analytics?period=${selectedPeriod}`);
      const data = await res.json();
      if (res.ok) {
        setAnalyticsData(data);
      }
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics(period);
  }, [period]);

  return (
    <div className="space-y-8">
      {/* Header & Period Selectors */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Analytics & Heatmap
          </h1>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
            Visual metrics, completion trends, contribution heatmap, and habit rankings
          </p>
        </div>

        {/* Period Selector Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-200/60 dark:bg-slate-800 rounded-2xl">
          {[
            { id: '7', label: 'Last 7 Days' },
            { id: '30', label: 'Last 30 Days' },
            { id: '90', label: 'Last 90 Days' },
            { id: 'all', label: 'All Time' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setPeriod(tab.id as any)}
              className={clsx(
                'px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all',
                period === tab.id
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="p-16 text-center text-slate-400 animate-pulse font-medium">
          Computing habit performance metrics...
        </div>
      ) : !analyticsData ? (
        <div className="p-12 text-center text-slate-400">Failed to load analytics data.</div>
      ) : (
        <div className="space-y-8">
          {/* Daily Completion Chart */}
          <DailyChart data={analyticsData.dailyChart} />

          {/* GitHub-style Heatmap */}
          <CalendarHeatmap
            data={analyticsData.heatmap}
            currentTotalActiveHabits={analyticsData.currentTotalActiveHabits}
          />

          {/* Habit Performance Table */}
          <PerformanceTable data={analyticsData.performanceTable} />
        </div>
      )}
    </div>
  );
}
