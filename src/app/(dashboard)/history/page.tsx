'use client';

import React, { useState, useEffect } from 'react';
import { CalendarView } from '@/components/history/CalendarView';
import { getTodayDateString, getFormattedDateLabel } from '@/lib/date-utils';
import { Check, X, MessageSquare, Sparkles } from 'lucide-react';
import { clsx } from 'clsx';
import { HabitIconView } from '@/lib/icon-map';

interface CreatedHabit {
  id: string;
  name: string;
  icon: string;
  color: string;
  category: string;
}

interface DayHabitStatus {
  habit: {
    id: string;
    name: string;
    icon: string;
    color: string;
    category: string;
  };
  completed: boolean;
  notes: string;
  completedAt: string | null;
}

export default function HistoryPage() {
  const [selectedDate, setSelectedDate] = useState(getTodayDateString());
  const [dayDetails, setDayDetails] = useState<{
    date: string;
    isToday: boolean;
    habits: DayHabitStatus[];
    createdHabitsOnDate?: CreatedHabit[];
  } | null>(null);

  const [logsByDate, setLogsByDate] = useState<Record<string, number>>({});
  const [totalActiveHabits, setTotalActiveHabits] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchLogsOverview = async () => {
    try {
      const res = await fetch('/api/analytics?period=all');
      const data = await res.json();
      if (res.ok) {
        const counts: Record<string, number> = {};
        (data.dailyChart || []).forEach((item: any) => {
          counts[item.date] = item.completed;
        });
        setLogsByDate(counts);
        setTotalActiveHabits(data.currentTotalActiveHabits || 0);
      }
    } catch (err) {
      console.error('Failed to load logs summary:', err);
    }
  };

  const fetchDayDetails = async (dateStr: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/logs?date=${dateStr}`);
      const data = await res.json();
      if (res.ok) {
        setDayDetails(data);
      }
    } catch (err) {
      console.error('Failed to load day details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogsOverview();
  }, []);

  useEffect(() => {
    fetchDayDetails(selectedDate);
  }, [selectedDate]);

  const completedCount = dayDetails?.habits.filter((h) => h.completed).length || 0;
  const totalCount = dayDetails?.habits.length || 0;
  const dayPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
          Calendar History
        </h1>
        <p className="text-xs font-mono font-medium text-slate-500 dark:text-slate-400 mt-0.5">
          Select any date on the calendar to view historical completion logs
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Calendar Column */}
        <div className="lg:col-span-7">
          <CalendarView
            selectedDate={selectedDate}
            onSelectDate={(d) => setSelectedDate(d)}
            logsByDate={logsByDate}
            totalActiveHabits={totalActiveHabits}
          />
        </div>

        {/* Selected Date Inspector */}
        <div className="lg:col-span-5 space-y-3">
          <div className="p-5 bg-white dark:bg-[#15181E] rounded-xl border border-slate-200/60 dark:border-slate-800/60 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
              <div>
                <span className="text-[10px] font-mono font-semibold text-slate-400 uppercase">
                  {dayDetails?.isToday ? "Today's Log" : 'Historical Log'}
                </span>
                <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {getFormattedDateLabel(selectedDate)}
                </h2>
              </div>
              <div className="text-right font-mono">
                <span className="text-xl font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                  {dayPercentage}%
                </span>
                <p className="text-[9px] text-slate-400 font-semibold uppercase">
                  {completedCount} / {totalCount} Done
                </p>
              </div>
            </div>

            {/* Created Habits Banner for selected date */}
            {dayDetails?.createdHabitsOnDate && dayDetails.createdHabitsOnDate.length > 0 && (
              <div className="p-3 bg-sage-50/80 dark:bg-sage-950/30 border border-sage-200/60 dark:border-sage-900/40 rounded-lg space-y-1.5 text-xs">
                {dayDetails.createdHabitsOnDate.map((h) => (
                  <div key={h.id} className="flex items-center gap-2 text-sage-800 dark:text-sage-300 font-medium">
                    <Sparkles className="w-3.5 h-3.5 text-sage-600 dark:text-sage-400 shrink-0" />
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span>New habit added on this day:</span>
                      <span className="font-semibold inline-flex items-center gap-1 bg-sage-100 dark:bg-sage-900/60 text-sage-900 dark:text-sage-200 px-2 py-0.5 rounded">
                        <HabitIconView iconKey={h.icon} className="w-3.5 h-3.5" />
                        {h.name}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {loading ? (
              <div className="p-6 text-center text-xs font-mono text-slate-400 animate-pulse">
                Fetching records...
              </div>
            ) : dayDetails?.habits.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 font-mono">
                No active habits recorded for this date.
              </div>
            ) : (
              <div className="space-y-2">
                {dayDetails?.habits.map((item) => (
                  <div
                    key={item.habit.id}
                    className={clsx(
                      'flex items-center justify-between p-3 rounded-lg border transition-all text-xs',
                      item.completed
                        ? 'bg-sage-50/50 dark:bg-[#131a15] border-sage-200/60 dark:border-sage-900/40'
                        : 'bg-slate-50 dark:bg-slate-800/20 border-slate-200/60 dark:border-slate-800/60'
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={clsx(
                          'flex items-center justify-center w-6 h-6 rounded border shrink-0',
                          item.completed
                            ? 'bg-sage-600 dark:bg-sage-500 text-white border-sage-600'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'
                        )}
                      >
                        {item.completed ? (
                          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                        ) : (
                          <X className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                        )}
                      </div>

                      <div>
                        <p
                          className={clsx(
                            'font-semibold',
                            item.completed
                              ? 'line-through text-slate-400 dark:text-slate-500'
                              : 'text-slate-900 dark:text-slate-100'
                          )}
                        >
                          {item.habit.name}
                        </p>
                        {item.notes && (
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1 font-mono">
                            <MessageSquare className="w-3 h-3 text-slate-400" /> "{item.notes}"
                          </p>
                        )}
                      </div>
                    </div>

                    <span className="text-[9px] font-mono font-medium px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                      {item.habit.category}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
