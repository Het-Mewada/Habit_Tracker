'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  CheckSquare,
  Calendar,
  BarChart2,
  Sparkles,
  Settings,
} from 'lucide-react';
import { clsx } from 'clsx';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/habits', label: 'Manage Habits', icon: CheckSquare },
  { href: '/history', label: 'Calendar History', icon: Calendar },
  { href: '/analytics', label: 'Analytics & Heatmap', icon: BarChart2 },
  { href: '/insights', label: 'AI Insights', icon: Sparkles, badge: 'AI' },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export const Sidebar: React.FC<SidebarProps> = ({ isOpen = true, onClose }) => {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-sm md:hidden"
        />
      )}

      <aside
        className={clsx(
          'fixed md:relative inset-y-0 left-0 z-40 md:z-20 w-64 shrink-0 h-full bg-white dark:bg-[#0E1013] border-r border-slate-200/80 dark:border-slate-800/80 flex flex-col transition-transform duration-200 ease-in-out',
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
      >
        <div className="p-4 border-b border-slate-100 dark:border-slate-800/80 md:hidden flex items-center justify-between">
          <span className="text-xs font-mono font-semibold text-slate-400 uppercase tracking-wider">
            Navigation Menu
          </span>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
          >
            ✕
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={clsx(
                  'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150',
                  isActive
                    ? 'bg-slate-100 dark:bg-[#15181E] text-slate-900 dark:text-slate-100 border border-slate-200/80 dark:border-slate-700/60 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40 hover:text-slate-900 dark:hover:text-slate-200'
                )}
              >
                <Icon className={clsx('w-4 h-4 stroke-[2]', isActive ? 'text-slate-900 dark:text-slate-100' : 'text-slate-400')} />
                <span className="flex-1">{item.label}</span>
                {item.badge && (
                  <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
};
