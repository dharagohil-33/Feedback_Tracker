'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export function Navbar() {
  const pathname = usePathname();
  const { isAuthenticated, isLoading } = useAuth();
  const { theme, toggleTheme } = useTheme();

  // App workspace routes use the left Sidebar; never render top Navbar on app pages
  const isAppRoute =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/feedback') ||
    pathname.startsWith('/insights');

  if (isLoading || isAuthenticated || isAppRoute) {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 dark:border-white/10 bg-white/80 dark:bg-[#07080A]/80 backdrop-blur-xl transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
        {/* Brand & Logo */}
        <Link href="/" className="flex items-center space-x-2.5 group">
          <div className="w-6 h-6 rounded-md bg-indigo-600 dark:bg-indigo-500 flex items-center justify-center font-bold text-white text-xs tracking-wider">
            FT
          </div>
          <span className="font-semibold text-sm tracking-tight text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
            Feedback Tracker
          </span>
          <span className="text-[10px] font-mono uppercase tracking-widest px-1.5 py-0.5 rounded border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 bg-indigo-500/5">
            AI OS
          </span>
        </Link>

        {/* Utilities */}
        <div className="flex items-center space-x-3">
          {/* Theme Switcher */}
          <button
            onClick={toggleTheme}
            type="button"
            aria-label="Toggle dark/light mode"
            className="p-1.5 px-2.5 rounded-md border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-[#101318] transition-all text-xs flex items-center gap-1.5 font-mono"
          >
            Theme: <span className="capitalize">{theme}</span>
          </button>

          <div className="flex items-center space-x-2">
            <Link
              href="/login"
              className="px-3 py-1.5 rounded-md text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="px-3 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition-colors"
            >
              Register
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
