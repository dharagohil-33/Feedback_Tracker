'use client';

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon, LogOut, User } from 'lucide-react';
import { ConfirmModal } from './ConfirmModal';

export function Header() {
  const { isAuthenticated, user, profile, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  if (!isAuthenticated) return null;

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'User';

  return (
    <>
      <header className="fixed top-0 right-0 left-0 md:left-64 z-30 h-20 px-6 md:px-8 flex items-center justify-end border-b border-slate-200/80 dark:border-white/10 bg-slate-50/90 dark:bg-[#07080A]/90 backdrop-blur-md transition-colors">
        <div className="flex items-center space-x-3">
          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            type="button"
            aria-label="Toggle dark and light mode"
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            className="p-2 rounded-xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#101318] text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-500/30 transition-all shadow-sm flex items-center gap-2 text-xs font-medium"
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-4 h-4 text-amber-400" />
                <span className="hidden sm:inline font-mono">Light</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-indigo-600" />
                <span className="hidden sm:inline font-mono">Dark</span>
              </>
            )}
          </button>

          {/* User Profile Badge & Logout Trigger */}
          <div className="flex items-center space-x-2.5 p-1 pl-3 pr-1.5 rounded-xl bg-white dark:bg-[#101318] border border-slate-200/80 dark:border-white/10 shadow-sm">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 rounded-lg bg-indigo-600/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400 flex items-center justify-center font-bold text-xs">
                <User className="w-3.5 h-3.5" />
              </div>
              <div className="hidden sm:flex flex-col">
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100 max-w-[130px] truncate leading-tight">
                  {displayName}
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono leading-tight truncate max-w-[130px]">
                  {user?.email}
                </span>
              </div>
            </div>

            <button
              onClick={() => setShowLogoutModal(true)}
              type="button"
              title="Sign Out"
              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-500/10 dark:text-slate-400 dark:hover:text-rose-400 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Logout Confirmation Modal */}
      <ConfirmModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={() => {
          setShowLogoutModal(false);
          logout();
        }}
        title="Sign Out of Workspace?"
        message="Are you sure you want to sign out of your account session? You will need to log back in to access customer intelligence records."
        confirmText="Sign Out"
        variant="indigo"
      />
    </>
  );
}
