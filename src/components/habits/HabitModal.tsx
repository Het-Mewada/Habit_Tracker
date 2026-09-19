'use client';

import React, { useState, useEffect } from 'react';
import { X, Check, Clock } from 'lucide-react';
import { HabitItem } from '../dashboard/HabitCard';
import { AVAILABLE_ICONS, getHabitIcon } from '@/lib/icon-map';

interface HabitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (habitData: {
    id?: string;
    name: string;
    description?: string;
    icon: string;
    color: string;
    category: string;
    isTimeSpecific: boolean;
    startTime?: string;
    endTime?: string;
  }) => Promise<void>;
  initialHabit?: HabitItem | null;
}

const PRESET_COLORS = [
  '#4a5d4e', // Muted Sage
  '#785e3a', // Muted Sand
  '#3b82f6', // Soft Blue
  '#64748b', // Slate
  '#71717a', // Zinc
];

const PRESET_CATEGORIES = ['Health & Body', 'Mind & Focus', 'Growth & Study', 'Daily Rituals', 'Productivity', 'Finance', 'General'];

export const HabitModal: React.FC<HabitModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialHabit,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('code');
  const [color, setColor] = useState('#4a5d4e');
  const [category, setCategory] = useState('General');
  const [isTimeSpecific, setIsTimeSpecific] = useState(false);
  const [startTime, setStartTime] = useState('18:00');
  const [endTime, setEndTime] = useState('19:00');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialHabit) {
      setName(initialHabit.name || '');
      setDescription(initialHabit.description || '');
      setIcon(initialHabit.icon || 'code');
      setColor(initialHabit.color || '#4a5d4e');
      setCategory(initialHabit.category || 'General');
      setIsTimeSpecific(Boolean(initialHabit.isTimeSpecific));
      setStartTime(initialHabit.startTime || '18:00');
      setEndTime(initialHabit.endTime || '19:00');
    } else {
      setName('');
      setDescription('');
      setIcon('code');
      setColor('#4a5d4e');
      setCategory('General');
      setIsTimeSpecific(false);
      setStartTime('18:00');
      setEndTime('19:00');
    }
    setError('');
  }, [initialHabit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Habit name is required');
      return;
    }

    if (isTimeSpecific) {
      if (!startTime || !endTime) {
        setError('Start time and End time are required for time-specific tasks.');
        return;
      }
    }

    setIsSubmitting(true);
    setError('');
    try {
      await onSave({
        id: initialHabit?.id,
        name: name.trim(),
        description: description.trim(),
        icon,
        color,
        category,
        isTimeSpecific,
        startTime: isTimeSpecific ? startTime : undefined,
        endTime: isTimeSpecific ? endTime : undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to save habit');
    } finally {
      setIsSubmitting(false);
    }
  };

  const IconComponent = getHabitIcon(icon);
  const isMidnightCrossing = isTimeSpecific && startTime && endTime && (endTime < startTime || endTime === startTime);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-md p-5 my-8 bg-white dark:bg-[#15181E] rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              <IconComponent className="w-4 h-4 stroke-[1.5]" />
            </div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              {initialHabit ? 'Edit Habit' : 'Create Habit'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="p-2.5 text-xs text-red-600 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-900/40">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-[10px] font-mono font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Habit Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Code for 1 hour, DSA Practice..."
              className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0E1013] text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-1 focus:ring-slate-400 font-medium"
            />
          </div>

          <div>
            <label className="block text-[10px] font-mono font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Description (Optional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Goal description..."
              className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0E1013] text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-1 focus:ring-slate-400"
            />
          </div>

          {/* Time Specific Scheduling Block */}
          <div className="p-3 bg-slate-50 dark:bg-[#0E1013] rounded-lg border border-slate-200 dark:border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-xs font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  Time-specific task?
                </label>
                <p className="text-[10px] text-slate-500 font-mono">
                  {isTimeSpecific ? 'Must be completed within configured start & end window' : 'Can be completed at any time today'}
                </p>
              </div>
              <div className="flex items-center gap-1 bg-slate-200 dark:bg-slate-800 p-0.5 rounded-lg text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setIsTimeSpecific(false)}
                  className={`px-2.5 py-1 rounded-md transition-all ${
                    !isTimeSpecific
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-bold shadow-2xs'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                >
                  No
                </button>
                <button
                  type="button"
                  onClick={() => setIsTimeSpecific(true)}
                  className={`px-2.5 py-1 rounded-md transition-all ${
                    isTimeSpecific
                      ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold shadow-2xs'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                >
                  Yes
                </button>
              </div>
            </div>

            {isTimeSpecific && (
              <div className="space-y-2 pt-1 border-t border-slate-200/60 dark:border-slate-800/60">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-mono font-semibold text-slate-500 uppercase mb-1">
                      Start Time (IST)
                    </label>
                    <input
                      type="time"
                      required={isTimeSpecific}
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#15181E] text-slate-900 dark:text-slate-100 text-xs font-mono focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono font-semibold text-slate-500 uppercase mb-1">
                      End Time (IST)
                    </label>
                    <input
                      type="time"
                      required={isTimeSpecific}
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#15181E] text-slate-900 dark:text-slate-100 text-xs font-mono focus:outline-none"
                    />
                  </div>
                </div>

                {/* Midnight Crossing Indicator */}
                {isMidnightCrossing && (
                  <div className="p-2 bg-sage-50 dark:bg-sage-950/40 border border-sage-200 dark:border-sage-900/50 rounded-md text-[11px] text-sage-800 dark:text-sage-300 font-medium flex items-center gap-1.5">
                    <span>🌙</span>
                    <span><strong>Ends the next day</strong> (Midnight-crossing task: 1 task occurrence)</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Vector Icon Selector Grid */}
          <div>
            <label className="block text-[10px] font-mono font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Icon
            </label>
            <div className="grid grid-cols-7 gap-1.5 p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0E1013] max-h-32 overflow-y-auto">
              {AVAILABLE_ICONS.map((item) => {
                const ItemIcon = item.icon;
                const isSelected = icon === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setIcon(item.key)}
                    title={item.label}
                    className={`flex items-center justify-center p-1.5 rounded transition-all ${
                      isSelected
                        ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
                        : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800'
                    }`}
                  >
                    <ItemIcon className="w-3.5 h-3.5 stroke-[1.5]" />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-mono font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0E1013] text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-1 focus:ring-slate-400"
              >
                {PRESET_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-mono font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Color
              </label>
              <div className="flex items-center gap-1.5 py-1">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className="w-4 h-4 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: c }}
                  >
                    {color === c && <Check className="w-2.5 h-2.5 text-white" />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 dark:bg-slate-100 dark:text-slate-900 rounded-lg disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : initialHabit ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
