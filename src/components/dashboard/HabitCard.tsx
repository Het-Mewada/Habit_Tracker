'use client';

import React, { useState } from 'react';
import { Check, Flame, MessageSquare, Edit3, Trash2, X } from 'lucide-react';
import { clsx } from 'clsx';
import { HabitIconView } from '@/lib/icon-map';
import { Portal } from '@/components/ui/Portal';

export interface HabitItem {
  id: string;
  name: string;
  description?: string | null;
  icon: string;
  color: string;
  category: string;
  isTimeSpecific?: boolean;
  startTime?: string | null;
  endTime?: string | null;
  isCompletedToday: boolean;
  notesToday?: string;
  currentStreak: number;
  longestStreak: number;
  completionRate: number;
  occurrenceEvaluation?: {
    status: 'pending' | 'completed' | 'missed';
    canComplete: boolean;
    isTimeSpecific: boolean;
    isMidnightCrossing: boolean;
    startFormatted?: string;
    endFormatted?: string;
    completedAtFormatted?: string | null;
    statusMessage: string;
  };
}

interface HabitCardProps {
  habit: HabitItem;
  onToggle: (id: string, completed: boolean) => void;
  onUpdateNote?: (id: string, note: string) => void;
  onEdit?: (habit: HabitItem) => void;
  onArchive?: (id: string) => void;
}

export const HabitCard: React.FC<HabitCardProps> = ({
  habit,
  onToggle,
  onUpdateNote,
  onEdit,
  onArchive,
}) => {
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteText, setNoteText] = useState(habit.notesToday || '');
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);

  const handleSaveNote = async () => {
    setIsSubmittingNote(true);
    if (onUpdateNote) {
      await onUpdateNote(habit.id, noteText);
    }
    setIsSubmittingNote(false);
    setShowNoteModal(false);
  };

  const evalInfo = habit.occurrenceEvaluation;
  const isMissed = evalInfo?.status === 'missed';
  const canComplete = evalInfo ? evalInfo.canComplete : true;

  const getButtonTooltip = () => {
    if (habit.isCompletedToday) return 'Completed today';
    if (isMissed) return evalInfo?.statusMessage || "This task's completion window has ended.";
    if (!canComplete) return evalInfo?.statusMessage || 'Task window is not active yet.';
    return `Mark "${habit.name}" completed`;
  };

  return (
    <div
      className={clsx(
        'group flex flex-col sm:flex-row items-start sm:items-center justify-between p-3.5 rounded-lg border transition-all duration-150',
        habit.isCompletedToday
          ? 'bg-sage-50/50 dark:bg-[#131a15] border-sage-200/80 dark:border-sage-900/40'
          : isMissed
          ? 'bg-red-50/20 dark:bg-red-950/10 border-red-200/50 dark:border-red-900/30'
          : 'bg-white dark:bg-[#15181E] border-slate-200/60 dark:border-slate-800/60 hover:border-slate-300 dark:hover:border-slate-700'
      )}
    >
      <div className="flex items-center gap-3 w-full sm:w-auto">
        {/* Tactile Spring Check Button with Window Authorization */}
        <button
          onClick={() => {
            if (canComplete || habit.isCompletedToday) {
              onToggle(habit.id, !habit.isCompletedToday);
            }
          }}
          disabled={!canComplete && !habit.isCompletedToday}
          title={getButtonTooltip()}
          className={clsx(
            'flex items-center justify-center w-8 h-8 rounded-md transition-all active:scale-95 border shrink-0',
            habit.isCompletedToday
              ? 'bg-sage-600 dark:bg-sage-500 text-white border-sage-600 cursor-pointer'
              : isMissed
              ? 'bg-red-50 dark:bg-red-950/30 text-red-400 border-red-200 dark:border-red-900/40 cursor-not-allowed opacity-75'
              : !canComplete
              ? 'bg-slate-100 dark:bg-slate-800/40 text-slate-400 border-slate-200 dark:border-slate-700 cursor-not-allowed opacity-60'
              : 'bg-slate-50 dark:bg-slate-800/40 text-slate-400 border-slate-200 dark:border-slate-700 hover:border-sage-500 hover:text-sage-600 cursor-pointer'
          )}
          aria-label={`Toggle ${habit.name}`}
        >
          {habit.isCompletedToday ? (
            <Check className="w-4 h-4 stroke-[2.5]" />
          ) : isMissed ? (
            <X className="w-4 h-4 text-red-500" />
          ) : (
            <HabitIconView iconKey={habit.icon} className="w-4 h-4" />
          )}
        </button>

        {/* Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-mono font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              {habit.category}
            </span>
            {habit.description && (
              <span className="text-[11px] text-slate-400 dark:text-slate-500 truncate max-w-xs">
                • {habit.description}
              </span>
            )}
          </div>

          <h3
            className={clsx(
              'text-xs font-semibold transition-colors mt-0.5',
              habit.isCompletedToday
                ? 'line-through text-slate-400 dark:text-slate-500'
                : 'text-slate-900 dark:text-slate-100'
            )}
          >
            {habit.name}
          </h3>

          {/* Time Window Status Badge */}
          {evalInfo && (
            <div className="flex items-center gap-1.5 flex-wrap mt-1">
              <span
                className={clsx(
                  'text-[10px] font-mono font-medium px-1.5 py-0.2 rounded border',
                  evalInfo.status === 'completed'
                    ? 'bg-sage-50 dark:bg-sage-950/40 text-sage-700 dark:text-sage-300 border-sage-200 dark:border-sage-900/50'
                    : evalInfo.status === 'missed'
                    ? 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-900/40 font-semibold'
                    : evalInfo.canComplete
                    ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/40 font-semibold'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                )}
              >
                {evalInfo.statusMessage}
              </span>
              {evalInfo.isMidnightCrossing && (
                <span
                  className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-sage-100/70 dark:bg-sage-900/50 text-sage-800 dark:text-sage-200 font-medium"
                  title="Midnight-crossing task: 1 task occurrence"
                >
                  🌙 Ends next day
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Streaks & Quiet Actions */}
      <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto mt-2 sm:mt-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800/40">
        <div className="flex items-center gap-2 font-mono text-[11px] tabular-nums">
          {/* Muted Sand Streak Badge */}
          <div
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 font-medium"
            title={`Current streak: ${habit.currentStreak}d | Best: ${habit.longestStreak}d`}
          >
            <Flame className="w-3 h-3 text-amber-700 dark:text-sand-400" />
            <span>{habit.currentStreak}d</span>
          </div>

          <div className="px-2 py-0.5 rounded text-slate-500 dark:text-slate-400">
            {habit.completionRate}%
          </div>
        </div>

        <div className="flex items-center gap-0.5">
          <button
            onClick={() => setShowNoteModal(true)}
            className={clsx(
              'p-1.5 rounded text-xs transition-colors',
              habit.notesToday
                ? 'text-sage-600 dark:text-sage-300 bg-sage-50 dark:bg-sage-950/40'
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
            )}
            title={habit.notesToday ? `Notes: "${habit.notesToday}"` : 'Add note'}
          >
            <MessageSquare className="w-3.5 h-3.5" />
          </button>

          {onEdit && (
            <button
              onClick={() => onEdit(habit)}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              title="Edit Habit"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
          )}

          {onArchive && (
            <button
              onClick={() => onArchive(habit.id)}
              className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
              title="Archive Habit"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Note Modal */}
      {showNoteModal && (
        <Portal>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm">
            <div className="w-full max-w-sm p-5 bg-white dark:bg-[#15181E] rounded-xl shadow-md border border-slate-200 dark:border-slate-800 space-y-3">
              <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
                Notes for {habit.name}
              </h3>
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Reflection notes..."
                rows={3}
                className="w-full p-2.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0E1013] text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-400 font-sans"
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => setShowNoteModal(false)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveNote}
                  disabled={isSubmittingNote}
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 dark:bg-slate-100 dark:text-slate-900 rounded-lg disabled:opacity-50"
                >
                  {isSubmittingNote ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
};
