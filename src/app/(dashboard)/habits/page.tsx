'use client';

import React, { useState, useEffect } from 'react';
import { HabitModal } from '@/components/habits/HabitModal';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { HabitItem } from '@/components/dashboard/HabitCard';
import { Plus, Edit3, Archive, RotateCcw, Trash2, Flame, Search } from 'lucide-react';
import { clsx } from 'clsx';
import { HabitIconView } from '@/lib/icon-map';

export default function HabitsPage() {
  const [habits, setHabits] = useState<HabitItem[]>([]);
  const [viewArchived, setViewArchived] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<HabitItem | null>(null);

  // Custom Confirm Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText: string;
    action: () => Promise<void>;
  }>({
    isOpen: false,
    title: '',
    message: '',
    confirmText: '',
    action: async () => {},
  });
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  const fetchHabits = async () => {
    try {
      const res = await fetch(`/api/habits?includeArchived=true`);
      const data = await res.json();
      if (res.ok) {
        setHabits(data.habits || []);
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

  const handleSaveHabit = async (habitData: any) => {
    if (habitData.id) {
      const res = await fetch(`/api/habits/${habitData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(habitData),
      });
      if (!res.ok) throw new Error('Failed to update habit');
    } else {
      const res = await fetch('/api/habits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(habitData),
      });
      if (!res.ok) throw new Error('Failed to create habit');
    }
    fetchHabits();
  };

  const promptArchiveHabit = (habit: HabitItem) => {
    setConfirmModal({
      isOpen: true,
      title: 'Archive Habit Target',
      message: `Are you sure you want to archive "${habit.name}"? It will be hidden from today's active dashboard, but historical completion records will remain preserved.`,
      confirmText: 'Archive Habit',
      action: async () => {
        await fetch(`/api/habits/${habit.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isArchived: true }),
        });
        fetchHabits();
      },
    });
  };

  const promptDeletePermanent = (habit: HabitItem) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Habit Permanently',
      message: `Are you sure you want to permanently delete "${habit.name}" and all its historical logs? This action cannot be undone.`,
      confirmText: 'Delete Permanently',
      action: async () => {
        await fetch(`/api/habits/${habit.id}`, {
          method: 'DELETE',
        });
        fetchHabits();
      },
    });
  };

  const handleExecuteAction = async () => {
    setIsProcessingAction(true);
    try {
      await confirmModal.action();
      setConfirmModal((prev) => ({ ...prev, isOpen: false }));
    } catch (err) {
      console.error('Action failed:', err);
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleToggleRestore = async (habitId: string) => {
    try {
      await fetch(`/api/habits/${habitId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isArchived: false }),
      });
      fetchHabits();
    } catch (err) {
      console.error('Failed to restore habit:', err);
    }
  };

  const filteredHabits = habits
    .filter((h) => (viewArchived ? (h as any).isArchived : !(h as any).isArchived))
    .filter((h) => h.name.toLowerCase().includes(searchQuery.toLowerCase()) || h.category.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Habit Management
          </h1>
          <p className="text-xs font-mono font-medium text-slate-500 dark:text-slate-400 mt-0.5">
            Create, edit, organize, or archive habit targets
          </p>
        </div>

        <button
          onClick={() => {
            setEditingHabit(null);
            setModalOpen(true);
          }}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 dark:bg-slate-100 dark:text-slate-900 rounded-lg shadow-2xs hover:bg-slate-800 transition-all"
        >
          <Plus className="w-4 h-4" /> Create Habit
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-white dark:bg-[#15181E] rounded-xl border border-slate-200/60 dark:border-slate-800/60 shadow-2xs">
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search habit targets..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0E1013] text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-400"
          />
        </div>

        <div className="flex items-center gap-1 p-0.5 bg-slate-100 dark:bg-slate-800/60 rounded-lg w-full sm:w-auto font-mono text-[11px]">
          <button
            onClick={() => setViewArchived(false)}
            className={clsx(
              'flex-1 sm:flex-none px-3 py-1 rounded font-medium transition-all',
              !viewArchived
                ? 'bg-white dark:bg-[#15181E] text-slate-900 dark:text-slate-100 shadow-2xs font-bold'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            )}
          >
            Active ({habits.filter((h) => !(h as any).isArchived).length})
          </button>
          <button
            onClick={() => setViewArchived(true)}
            className={clsx(
              'flex-1 sm:flex-none px-3 py-1 rounded font-medium transition-all',
              viewArchived
                ? 'bg-white dark:bg-[#15181E] text-slate-900 dark:text-slate-100 shadow-2xs font-bold'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            )}
          >
            Archived ({habits.filter((h) => (h as any).isArchived).length})
          </button>
        </div>
      </div>

      {/* Habit Cards Grid */}
      {loading ? (
        <div className="p-8 text-center text-xs font-mono text-slate-400 animate-pulse">Loading habits...</div>
      ) : filteredHabits.length === 0 ? (
        <div className="p-8 text-center bg-white dark:bg-[#15181E] rounded-xl border border-slate-200/60 dark:border-slate-800/60 space-y-1">
          <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
            {viewArchived ? 'No archived habits found' : 'No active habits found'}
          </p>
          <p className="text-[11px] text-slate-400 font-mono">
            {viewArchived
              ? 'Archived habits will appear here when archived.'
              : 'Click "Create Habit" above to add a habit target.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredHabits.map((habit) => (
            <div
              key={habit.id}
              className="flex flex-col justify-between p-4 bg-white dark:bg-[#15181E] rounded-xl border border-slate-200/60 dark:border-slate-800/60 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition-all space-y-3"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300">
                      <HabitIconView iconKey={habit.icon} className="w-4 h-4 stroke-[1.5]" />
                    </div>
                    <div>
                      <span className="text-[9px] font-mono font-medium px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                        {habit.category}
                      </span>
                      <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                        {habit.name}
                      </h3>
                    </div>
                  </div>
                </div>

                {habit.description && (
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 line-clamp-2">
                    {habit.description}
                  </p>
                )}

                <div className="flex items-center gap-2 text-[11px] font-mono pt-2 border-t border-slate-100 dark:border-slate-800/40 tabular-nums">
                  <div className="flex items-center gap-1 text-amber-700 dark:text-sand-400 font-medium">
                    <Flame className="w-3 h-3" />
                    <span>{habit.currentStreak}d streak</span>
                  </div>
                  <div className="text-slate-500">
                    • {habit.completionRate}% rate
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800/40 text-xs">
                {!viewArchived ? (
                  <>
                    <button
                      onClick={() => {
                        setEditingHabit(habit);
                        setModalOpen(true);
                      }}
                      className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                    >
                      <Edit3 className="w-3 h-3 text-slate-400" /> Edit
                    </button>
                    <button
                      onClick={() => promptArchiveHabit(habit)}
                      className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                    >
                      <Archive className="w-3 h-3 text-slate-400" /> Archive
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => handleToggleRestore(habit.id)}
                      className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                    >
                      <RotateCcw className="w-3 h-3 text-slate-400" /> Restore
                    </button>
                    <button
                      onClick={() => promptDeletePermanent(habit)}
                      className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 rounded transition-colors"
                    >
                      <Trash2 className="w-3 h-3" /> Delete
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Habit Create/Edit Modal */}
      <HabitModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveHabit}
        initialHabit={editingHabit}
      />

      {/* Custom UI Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        isLoading={isProcessingAction}
        onConfirm={handleExecuteAction}
        onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
