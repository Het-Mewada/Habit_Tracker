'use client';

import React from 'react';

interface ProgressRingProps {
  completed: number;
  total: number;
  percentage: number;
}

export const ProgressRing: React.FC<ProgressRingProps> = ({ completed, total, percentage }) => {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="p-5 sm:p-6 bg-white dark:bg-[#15181E] rounded-xl border border-slate-200/60 dark:border-slate-800/60 shadow-2xs space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        
        {/* Balanced Hero Score Anchor */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-semibold text-slate-500 uppercase tracking-wider">
              Today's Execution
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium">
              {percentage}%
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-semibold text-slate-900 dark:text-slate-100 tabular-nums tracking-tight font-sans">
              {completed}<span className="text-slate-400 font-normal text-2xl sm:text-3xl">/</span>{total}
            </span>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              habits completed today
            </span>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md">
            {percentage === 100
              ? 'All daily targets successfully completed.'
              : total === 0
              ? 'No active habits. Create a habit to begin tracking.'
              : `${total - completed} habit target${total - completed === 1 ? '' : 's'} remaining for today.`}
          </p>
        </div>

        {/* Muted Sage Circular Indicator */}
        <div className="relative flex items-center justify-center w-20 h-20 self-center sm:self-auto">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="40"
              cy="40"
              r={radius}
              className="text-slate-100 dark:text-slate-800/60"
              strokeWidth="5"
              stroke="currentColor"
              fill="transparent"
            />
            <circle
              cx="40"
              cy="40"
              r={radius}
              className="text-sage-600 dark:text-sage-300 transition-all duration-500 ease-out"
              strokeWidth="5"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              stroke="currentColor"
              fill="transparent"
            />
          </svg>
          <div className="absolute flex flex-col items-center justify-center text-center">
            <span className="text-xs font-mono font-semibold text-slate-700 dark:text-slate-300 tabular-nums">
              {completed}/{total}
            </span>
          </div>
        </div>
      </div>

      {/* Subtle Progress Bar */}
      <div className="w-full bg-slate-100 dark:bg-slate-800/40 h-1 rounded-full overflow-hidden">
        <div
          className="bg-sage-600 dark:bg-sage-300 h-full transition-all duration-500 rounded-full"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
