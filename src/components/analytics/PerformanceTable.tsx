'use client';

import React, { useState } from 'react';
import { ArrowUpDown, Flame, Trophy } from 'lucide-react';
import { HabitIconView } from '@/lib/icon-map';

export interface PerformanceItem {
  id: string;
  name: string;
  icon: string;
  color: string;
  category: string;
  completionRate: number;
  currentStreak: number;
  longestStreak: number;
  completedDays: number;
  missedDays: number;
}

interface PerformanceTableProps {
  data: PerformanceItem[];
}

type SortField = 'completionRate' | 'currentStreak' | 'longestStreak' | 'completedDays' | 'name';

export const PerformanceTable: React.FC<PerformanceTableProps> = ({ data }) => {
  const [sortField, setSortField] = useState<SortField>('completionRate');
  const [sortAsc, setSortAsc] = useState(false);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const sortedData = [...data].sort((a, b) => {
    let aVal = a[sortField];
    let bVal = b[sortField];

    if (typeof aVal === 'string') {
      return sortAsc
        ? (aVal as string).localeCompare(bVal as string)
        : (bVal as string).localeCompare(aVal as string);
    }

    return sortAsc ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
  });

  return (
    <div className="bg-white dark:bg-[#15181E] rounded-xl p-5 border border-slate-200/60 dark:border-slate-800/60 shadow-2xs space-y-3">
      <div>
        <h3 className="text-xs font-mono font-semibold text-slate-500 uppercase tracking-wider">
          Performance Index
        </h3>
        <p className="text-xs text-slate-600 dark:text-slate-400">
          Individual habit metric rankings and longitudinal records
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse font-mono text-xs">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-semibold text-slate-400 uppercase">
              <th className="py-2.5 px-3">
                <button
                  onClick={() => handleSort('name')}
                  className="flex items-center gap-1 hover:text-slate-700 dark:hover:text-slate-200 font-sans font-semibold"
                >
                  Habit <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="py-2.5 px-3">
                <button
                  onClick={() => handleSort('completionRate')}
                  className="flex items-center gap-1 hover:text-slate-700 dark:hover:text-slate-200"
                >
                  Rate <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="py-2.5 px-3">
                <button
                  onClick={() => handleSort('currentStreak')}
                  className="flex items-center gap-1 hover:text-slate-700 dark:hover:text-slate-200"
                >
                  Streak <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="py-2.5 px-3">
                <button
                  onClick={() => handleSort('longestStreak')}
                  className="flex items-center gap-1 hover:text-slate-700 dark:hover:text-slate-200"
                >
                  Best <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="py-2.5 px-3">
                <button
                  onClick={() => handleSort('completedDays')}
                  className="flex items-center gap-1 hover:text-slate-700 dark:hover:text-slate-200"
                >
                  Completed <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
            {sortedData.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2 font-sans">
                  <div className="p-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    <HabitIconView iconKey={item.icon} className="w-3.5 h-3.5 stroke-[1.5]" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold">{item.name}</p>
                    <span className="text-[9px] font-mono text-slate-400 font-normal">{item.category}</span>
                  </div>
                </td>

                <td className="py-2.5 px-3">
                  <div className="flex items-center gap-2">
                    <div className="w-12 bg-slate-100 dark:bg-slate-800 h-1 rounded-full overflow-hidden">
                      <div
                        className="bg-sage-600 dark:bg-sage-300 h-full rounded-full"
                        style={{ width: `${item.completionRate}%` }}
                      />
                    </div>
                    <span className="font-semibold text-slate-700 dark:text-slate-300 tabular-nums">
                      {item.completionRate}%
                    </span>
                  </div>
                </td>

                <td className="py-2.5 px-3">
                  <div className="flex items-center gap-1 text-slate-700 dark:text-slate-300 font-semibold tabular-nums">
                    <Flame className="w-3 h-3 text-amber-700 dark:text-sand-400" />
                    <span>{item.currentStreak}d</span>
                  </div>
                </td>

                <td className="py-2.5 px-3">
                  <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400 tabular-nums">
                    <Trophy className="w-3 h-3 text-slate-400" />
                    <span>{item.longestStreak}d</span>
                  </div>
                </td>

                <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400 tabular-nums">
                  {item.completedDays}d
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
