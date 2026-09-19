'use client';

import React, { useState } from 'react';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';

interface AppShellProps {
  userName: string;
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ userName, children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <Navbar userName={userName} onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex-1 flex min-h-0 overflow-hidden relative">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 w-full">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
