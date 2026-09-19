'use client';

import React, { useState, useEffect } from 'react';
import { ProgressRing } from '@/components/dashboard/ProgressRing';
import { HabitCard, HabitItem } from '@/components/dashboard/HabitCard';
import { HabitModal } from '@/components/habits/HabitModal';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { Plus, Flame, Trophy, CheckSquare, Sparkles } from 'lucide-react';
import { clsx } from 'clsx';
import Link from 'next/link';

export default function DashboardPage() {
  const [habits, setHabits] = useState<HabitItem[]>([]);
  const [todayDate, setTodayDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed' | 'missed'>('all');

  // Custom Confirm Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText: string;
    habitId: string;
  }>({
    isOpen: false,
    title: '',
    message: '',
    confirmText: '',
    habitId: '',
  });
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  const fetchHabits = async () => {
    try {
      const res = await fetch('/api/habits');
      const data = await res.json();
      if (res.ok) {
        setHabits(data.habits || []);
        setTodayDate(data.todayDate || '');
      }
    } catch (err) {
      console.error('Failed to load habits:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHabits();
  }, []);

  const handleToggleHabit = async (habitId: string, targetState: boolean) => {
    // Optimistic UI Update
    setHabits((prev) =>
      prev.map((h) => {
        if (h.id === habitId) {
          const newCompleted = targetState;
          const streakDelta = newCompleted ? 1 : -1;
          return {
            ...h,
            isCompletedToday: newCompleted,
            currentStreak: Math.max(0, h.currentStreak + streakDelta),
          };
        }
        return h;
      })
    );

    try {
      await fetch('/api/logs/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ habitId, completed: targetState }),
      });
      fetchHabits();
    } catch (err) {
      console.error('Failed to toggle habit:', err);
      fetchHabits();
    }
  };

  const handleUpdateNote = async (habitId: string, note: string) => {
    try {
      await fetch('/api/logs/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ habitId, notes: note }),
      });
      fetchHabits();
    } catch (err) {
      console.error('Failed to save note:', err);
    }
  };

  const handleCreateHabit = async (habitData: any) => {
    const res = await fetch('/api/habits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(habitData),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to create habit');
    }
    fetchHabits();
  };

  const promptArchiveHabit = (habitId: string) => {
    const targetHabit = habits.find((h) => h.id === habitId);
    setConfirmModal({
      isOpen: true,
      title: 'Archive Habit Target',
      message: `Are you sure you want to archive "${targetHabit?.name || 'this habit'}"? It will be hidden from today's active list, but historical completion logs remain saved.`,
      confirmText: 'Archive Habit',
      habitId,
    });
  };

  const handleExecuteArchive = async () => {
    setIsProcessingAction(true);
    try {
      await fetch(`/api/habits/${confirmModal.habitId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isArchived: true }),
      });
      setConfirmModal((prev) => ({ ...prev, isOpen: false }));
      fetchHabits();
    } catch (err) {
      console.error('Failed to archive habit:', err);
    } finally {
      setIsProcessingAction(false);
    }
  };

  const completedTodayCount = habits.filter((h) => h.isCompletedToday).length;
  const totalHabitsCount = habits.length;
  const percentage =
    totalHabitsCount > 0 ? Math.round((completedTodayCount / totalHabitsCount) * 100) : 0;

  const maxStreak = habits.length > 0 ? Math.max(...habits.map((h) => h.currentStreak)) : 0;
  const bestEverStreak = habits.length > 0 ? Math.max(...habits.map((h) => h.longestStreak)) : 0;

  const counts = {
    all: habits.length,
    pending: habits.filter((h) => !h.isCompletedToday && h.occurrenceEvaluation?.status !== 'missed').length,
    completed: habits.filter((h) => h.isCompletedToday).length,
    missed: habits.filter((h) => !h.isCompletedToday && h.occurrenceEvaluation?.status === 'missed').length,
  };

  const filteredHabits = habits.filter((h) => {
    if (statusFilter === 'pending') return !h.isCompletedToday && h.occurrenceEvaluation?.status !== 'missed';
    if (statusFilter === 'completed') return h.isCompletedToday;
    if (statusFilter === 'missed') return !h.isCompletedToday && h.occurrenceEvaluation?.status === 'missed';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Today's Dashboard
          </h1>
          <p className="text-xs font-mono font-medium text-slate-500 dark:text-slate-400 mt-0.5">
            {todayDate
              ? new Date(`${todayDate}T12:00:00`).toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })
              : 'Loading date...'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/insights"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/60 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg border border-slate-200/60 dark:border-slate-700/60 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-slate-400" />
            AI Insights
          </Link>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-slate-900 dark:bg-slate-100 dark:text-slate-900 rounded-lg shadow-2xs hover:bg-slate-800 transition-all"
          >
            <Plus className="w-4 h-4" /> New Habit
          </button>
        </div>
      </div>

      {/* Progress Ring Card */}
      <ProgressRing
        completed={completedTodayCount}
        total={totalHabitsCount}
        percentage={percentage}
      />

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 bg-white dark:bg-[#15181E] rounded-xl border border-slate-200/60 dark:border-slate-800/60 shadow-2xs flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            <CheckSquare className="w-4 h-4 stroke-[1.75]" />
          </div>
          <div>
            <p className="text-[10px] font-mono font-semibold text-slate-400 uppercase">Completed Today</p>
            <p className="text-base font-bold text-slate-900 dark:text-slate-100 font-mono tabular-nums">{completedTodayCount} / {totalHabitsCount}</p>
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-[#15181E] rounded-xl border border-slate-200/60 dark:border-slate-800/60 shadow-2xs flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 text-amber-700 dark:text-sand-400">
            <Flame className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] font-mono font-semibold text-slate-400 uppercase">Active Streak</p>
            <p className="text-base font-bold text-slate-900 dark:text-slate-100 font-mono tabular-nums">{maxStreak} Days</p>
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-[#15181E] rounded-xl border border-slate-200/60 dark:border-slate-800/60 shadow-2xs flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            <Trophy className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] font-mono font-semibold text-slate-400 uppercase">Best Record</p>
            <p className="text-base font-bold text-slate-900 dark:text-slate-100 font-mono tabular-nums">{bestEverStreak} Days</p>
          </div>
        </div>
      </div>

      {/* Habit List Section */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Today's Habit Targets ({completedTodayCount}/{totalHabitsCount})
          </h2>

          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/60 p-1 rounded-lg border border-slate-200/60 dark:border-slate-700/60 text-[11px] font-mono self-start sm:self-auto overflow-x-auto">
            <button
              onClick={() => setStatusFilter('all')}
              className={clsx(
                'px-2.5 py-1 rounded-md font-medium transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer',
                statusFilter === 'all'
                  ? 'bg-white dark:bg-[#15181E] text-slate-900 dark:text-slate-100 shadow-2xs font-semibold'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              )}
            >
              All
              <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-slate-200/70 dark:bg-slate-700/70 text-slate-600 dark:text-slate-300">
                {counts.all}
              </span>
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={clsx(
                'px-2.5 py-1 rounded-md font-medium transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer',
                statusFilter === 'pending'
                  ? 'bg-white dark:bg-[#15181E] text-slate-900 dark:text-slate-100 shadow-2xs font-semibold'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              )}
            >
              Pending
              <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
                {counts.pending}
              </span>
            </button>
            <button
              onClick={() => setStatusFilter('completed')}
              className={clsx(
                'px-2.5 py-1 rounded-md font-medium transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer',
                statusFilter === 'completed'
                  ? 'bg-white dark:bg-[#15181E] text-slate-900 dark:text-slate-100 shadow-2xs font-semibold'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              )}
            >
              Completed
              <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                {counts.completed}
              </span>
            </button>
            <button
              onClick={() => setStatusFilter('missed')}
              className={clsx(
                'px-2.5 py-1 rounded-md font-medium transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer',
                statusFilter === 'missed'
                  ? 'bg-white dark:bg-[#15181E] text-slate-900 dark:text-slate-100 shadow-2xs font-semibold'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              )}
            >
              Missed
              <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300">
                {counts.missed}
              </span>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs font-mono text-slate-400 animate-pulse">Loading habit targets...</div>
        ) : habits.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-[#15181E] rounded-xl border border-slate-200/60 dark:border-slate-800/60 space-y-3">
            <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-lg flex items-center justify-center mx-auto">
              <CheckSquare className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold">No Active Habits</h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              Create your first habit target to begin tracking daily completions.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 dark:bg-slate-100 dark:text-slate-900 rounded-lg shadow-2xs"
            >
              Create Habit
            </button>
          </div>
        ) : filteredHabits.length === 0 ? (
          <div className="p-6 text-center bg-white dark:bg-[#15181E] rounded-xl border border-slate-200/60 dark:border-slate-800/60 space-y-2">
            <p className="text-xs font-mono text-slate-500">No habits matching filter "{statusFilter}".</p>
            <button
              onClick={() => setStatusFilter('all')}
              className="text-xs font-semibold text-slate-900 dark:text-slate-100 underline underline-offset-2"
            >
              Show all habits ({habits.length})
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2">
            {filteredHabits.map((habit) => (
              <HabitCard
                key={habit.id}
                habit={habit}
                onToggle={handleToggleHabit}
                onUpdateNote={handleUpdateNote}
                onArchive={promptArchiveHabit}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create Habit Modal */}
      <HabitModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleCreateHabit}
      />

      {/* Custom Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        isLoading={isProcessingAction}
        onConfirm={handleExecuteArchive}
        onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
