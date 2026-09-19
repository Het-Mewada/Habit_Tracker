'use client';

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { clsx } from 'clsx';

interface CalendarViewProps {
  onSelectDate: (dateStr: string) => void;
  selectedDate: string;
  logsByDate: Record<string, number>;
  totalActiveHabits: number;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  onSelectDate,
  selectedDate,
  logsByDate,
  totalActiveHabits,
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const prevMonth = () => setCurrentMonth(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(year, month + 1, 1));

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const daysGrid: (string | null)[] = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    daysGrid.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const formattedMonth = String(month + 1).padStart(2, '0');
    const formattedDay = String(day).padStart(2, '0');
    daysGrid.push(`${year}-${formattedMonth}-${formattedDay}`);
  }

  return (
    <div className="bg-white dark:bg-[#15181E] rounded-xl p-5 border border-slate-200/60 dark:border-slate-800/60 shadow-2xs space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-4 h-4 text-slate-500" />
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">{monthName}</h2>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={prevMonth}
            className="p-1 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded"
            aria-label="Previous Month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={nextMonth}
            className="p-1 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded"
            aria-label="Next Month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-mono font-semibold text-slate-400 uppercase">
        <span>Sun</span>
        <span>Mon</span>
        <span>Tue</span>
        <span>Wed</span>
        <span>Thu</span>
        <span>Fri</span>
        <span>Sat</span>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {daysGrid.map((dateStr, idx) => {
          if (!dateStr) {
            return <div key={`empty-${idx}`} className="h-9" />;
          }

          const dayNum = parseInt(dateStr.split('-')[2], 10);
          const isSelected = dateStr === selectedDate;
          const completedCount = logsByDate[dateStr] || 0;
          const isFullyCompleted = totalActiveHabits > 0 && completedCount >= totalActiveHabits;
          const isPartiallyCompleted = completedCount > 0 && !isFullyCompleted;

          return (
            <button
              key={dateStr}
              onClick={() => onSelectDate(dateStr)}
              className={clsx(
                'flex flex-col items-center justify-center h-9 rounded transition-all font-mono text-xs tabular-nums',
                isSelected
                  ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold shadow-2xs'
                  : isFullyCompleted
                  ? 'bg-sage-100/60 dark:bg-sage-950/60 text-sage-700 dark:text-sage-300 hover:bg-sage-200/50'
                  : isPartiallyCompleted
                  ? 'bg-slate-100 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300'
                  : 'bg-slate-50 dark:bg-slate-800/20 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              )}
            >
              <span>{dayNum}</span>
              {completedCount > 0 && (
                <div
                  className={clsx(
                    'w-1 h-1 rounded-full mt-0.5',
                    isSelected ? 'bg-white dark:bg-slate-900' : 'bg-sage-600 dark:bg-sage-300'
                  )}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
