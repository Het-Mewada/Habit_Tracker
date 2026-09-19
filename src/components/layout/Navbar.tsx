'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Sparkles, LogOut, Settings, Moon, Sun, Menu, Activity } from 'lucide-react';

interface NavbarProps {
  userName?: string;
  onToggleSidebar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ userName = 'User', onToggleSidebar }) => {
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const toggleDarkMode = () => {
    if (typeof window !== 'undefined') {
      const isDark = document.documentElement.classList.toggle('dark');
      setIsDarkMode(isDark);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  return (
    <header className="shrink-0 z-30 relative flex items-center justify-between h-16 px-4 md:px-6 bg-white dark:bg-[#15181E] border-b border-slate-200/80 dark:border-slate-800/80 shadow-2xs">
      <div className="flex items-center gap-3">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="p-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded-lg md:hidden"
            aria-label="Toggle Navigation"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <Link href="/dashboard" className="flex items-center gap-2.5 group">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold text-sm shadow-2xs">
            <Activity className="w-4 h-4 stroke-[2.5]" />
          </div>
          <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">
            HabitPulse
          </span>
        </Link>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={toggleDarkMode}
          className="p-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded-lg transition-colors"
          title="Toggle Theme"
        >
          {isDarkMode ? <Sun className="w-5 h-5 text-amber-300" /> : <Moon className="w-5 h-5 text-slate-600" />}
        </button>

        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
          >
            <div className="flex items-center justify-center w-7 h-7 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-mono font-bold text-xs">
              {userName.charAt(0).toUpperCase()}
            </div>
            <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 hidden sm:inline">
              {userName}
            </span>
          </button>

          {dropdownOpen && (
            <div
              className="absolute right-0 mt-2 w-48 py-1.5 bg-white dark:bg-[#15181E] rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 text-xs z-50 animate-in fade-in zoom-in-95"
              onMouseLeave={() => setDropdownOpen(false)}
            >
              <div className="px-3.5 py-2 border-b border-slate-100 dark:border-slate-800">
                <p className="font-bold text-slate-900 dark:text-slate-100 text-xs">{userName}</p>
                <p className="text-[10px] font-mono text-slate-400">Account Active</p>
              </div>
              <Link
                href="/settings"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-2 px-3.5 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 font-medium"
              >
                <Settings className="w-4 h-4 text-slate-400" /> Settings
              </Link>
              <Link
                href="/insights"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-2 px-3.5 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 font-medium"
              >
                <Sparkles className="w-4 h-4 text-slate-400" /> AI Insights
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 w-full text-left px-3.5 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 font-medium"
              >
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
