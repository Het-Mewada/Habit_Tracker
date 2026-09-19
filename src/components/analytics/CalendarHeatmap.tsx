'use client';

import React, { useState } from 'react';
import { clsx } from 'clsx';
import { Activity } from 'lucide-react';

export interface HeatmapCell {
  date: string;
  formattedDate: string;
  completedCount: number;
  totalActive: number;
  percentage: number;
  tier: number; // 0..5
  tooltipText: string;
}

interface CalendarHeatmapProps {
  data: HeatmapCell[];
  currentTotalActiveHabits: number;
}

export const CalendarHeatmap: React.FC<CalendarHeatmapProps> = ({
  data,
  currentTotalActiveHabits,
}) => {
  const [hoveredCell, setHoveredCell] = useState<HeatmapCell | null>(null);

  const weeks: HeatmapCell[][] = [];
  let currentWeek: HeatmapCell[] = [];

  data.forEach((cell, idx) => {
    currentWeek.push(cell);
    if (currentWeek.length === 7 || idx === data.length - 1) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  });

  return (
    <div className="bg-white dark:bg-[#15181E] rounded-xl p-5 border border-slate-200/60 dark:border-slate-800/60 shadow-2xs space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-xs font-mono font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 stroke-[1.5]" />
            Habit Consistency Matrix
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Intensity = Completed Habits ÷ {currentTotalActiveHabits} Current Active Habits
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-1 text-[10px] font-mono text-slate-500">
          <span>0%</span>
          <div className="w-3 h-3 rounded-xs heatmap-tier-0 border border-slate-200 dark:border-slate-800" title="0%" />
          <div className="w-3 h-3 rounded-xs heatmap-tier-1" title="1-24%" />
          <div className="w-3 h-3 rounded-xs heatmap-tier-2" title="25-49%" />
          <div className="w-3 h-3 rounded-xs heatmap-tier-3" title="50-74%" />
          <div className="w-3 h-3 rounded-xs heatmap-tier-4" title="75-99%" />
          <div className="w-3 h-3 rounded-xs heatmap-tier-5" title="100%" />
          <span>100%</span>
        </div>
      </div>

      {currentTotalActiveHabits === 0 ? (
        <div className="p-6 text-center text-xs font-mono text-slate-400 bg-slate-50 dark:bg-slate-800/20 rounded-lg border border-dashed border-slate-200 dark:border-slate-800">
          No active habits created yet. Add active habits to activate heatmap tracking.
        </div>
      ) : (
        <div className="relative overflow-x-auto pb-1">
          <div className="inline-flex gap-1">
            {weeks.map((week, wIdx) => (
              <div key={`week-${wIdx}`} className="flex flex-col gap-1">
                {week.map((cell) => (
                  <div
                    key={cell.date}
                    onMouseEnter={() => setHoveredCell(cell)}
                    onMouseLeave={() => setHoveredCell(null)}
                    className={clsx(
                      'w-3 h-3 rounded-xs transition-transform hover:scale-125 cursor-pointer',
                      `heatmap-tier-${cell.tier}`
                    )}
                  />
                ))}
              </div>
            ))}
          </div>

          {/* Hover Tooltip Box */}
          {hoveredCell && (
            <div className="mt-2.5 p-2 bg-[#0E1013] text-white text-[11px] font-mono rounded-md border border-slate-800 inline-block">
              {hoveredCell.tooltipText}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
