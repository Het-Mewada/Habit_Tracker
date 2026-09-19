'use client';

import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

export interface DailyChartItem {
  date: string;
  label: string;
  completed: number;
  total: number;
  rate: number;
}

interface DailyChartProps {
  data: DailyChartItem[];
}

export const DailyChart: React.FC<DailyChartProps> = ({ data }) => {
  return (
    <div className="bg-white dark:bg-[#15181E] rounded-xl p-5 border border-slate-200/60 dark:border-slate-800/60 shadow-2xs space-y-3">
      <div>
        <h3 className="text-xs font-mono font-semibold text-slate-500 uppercase tracking-wider">
          Daily Completion Velocity
        </h3>
        <p className="text-xs text-slate-600 dark:text-slate-400">
          Habits completed per day over the selected timeframe
        </p>
      </div>

      <div className="h-56 w-full pt-1">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorSage" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4a5d4e" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#4a5d4e" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e5e2" opacity={0.3} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: '#71717a' }}
              tickLine={false}
              axisLine={{ stroke: '#e5e5e2' }}
            />
            <YAxis
              tick={{ fontSize: 10, fill: '#71717a' }}
              tickLine={false}
              axisLine={false}
              domain={[0, 'dataMax + 1']}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload as DailyChartItem;
                  return (
                    <div className="p-2.5 bg-[#0E1013] text-white text-xs font-mono rounded-lg border border-slate-800 space-y-0.5">
                      <p className="text-slate-400">{item.label}</p>
                      <p className="font-semibold text-slate-200 tabular-nums">
                        {item.completed} of {item.total} completed ({item.rate}%)
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area
              type="monotone"
              dataKey="completed"
              stroke="#4a5d4e"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorSage)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
