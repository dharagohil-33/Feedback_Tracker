'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  MessageSquare,
  BarChart3,
  Sparkles,
  Menu,
  X,
  User,
  LogOut,
  ChevronUp,
} from 'lucide-react';
import { ConfirmModal } from './ConfirmModal';

export function Sidebar() {
  const pathname = usePathname();
  const { isAuthenticated, isLoading, profile, user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Profile Popover Dropdown state
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Hide sidebar only when auth check has completed and user is NOT logged in (e.g., login/register)
  if (!isLoading && !isAuthenticated) return null;

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'User';

  const navItems = [
    { label: 'Overview', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Feedback Workspace', href: '/feedback', icon: MessageSquare },
    { label: 'Product Insights', href: '/insights', icon: BarChart3 },
  ];

  return (
    <>
      {/* Mobile Sidebar Toggle Header */}
      <div className="md:hidden sticky top-0 z-40 flex items-center justify-between px-4 h-14 border-b border-slate-200/80 dark:border-white/10 bg-slate-50/90 dark:bg-[#0b0d12]/90 backdrop-blur-xl">
        <Link href="/dashboard" className="flex items-center space-x-2.5">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 dark:bg-indigo-500 flex items-center justify-center font-bold text-white text-xs">
            FT
          </div>
          <span className="font-bold text-sm tracking-tight text-slate-900 dark:text-slate-100">
            Feedback Tracker
          </span>
        </Link>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          type="button"
          aria-label="Toggle Navigation Menu"
          className="p-2 rounded-lg border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-white/5 transition-colors"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Backdrop for Mobile */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="md:hidden fixed inset-0 z-40 bg-black/60"
        />
      )}

      {/* Main Sidebar Container */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-50 h-screen w-64 shrink-0 border-r border-slate-200/80 dark:border-white/10 bg-slate-100/90 dark:bg-[#0b0d12] flex flex-col justify-between transition-transform duration-200 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="space-y-6">
          {/* Brand Header aligned with top navbar horizontal border line */}
          <div className="h-20 flex items-center px-5 border-b border-slate-200/80 dark:border-white/10">
            <Link href="/dashboard" className="flex items-center space-x-3 group">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 dark:bg-indigo-500 flex items-center justify-center font-extrabold text-white text-xs tracking-wider shadow-md shadow-indigo-500/20">
                FT
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  Feedback Tracker
                </span>
                <span className="text-[10px] font-mono uppercase tracking-widest text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" />
                  AI OS v2.0
                </span>
              </div>
            </Link>
          </div>

          {/* Sidebar Routes Section */}
          <div className="px-5 space-y-2">
            <nav className="space-y-1.5">
              {navItems.map((item) => {
                const IconComponent = item.icon;
                const isActive =
                  pathname === item.href || (item.href === '/feedback' && pathname.startsWith('/feedback'));
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center space-x-3 px-3.5 py-3 rounded-xl text-sm transition-colors duration-75 ${
                      isActive
                        ? 'text-slate-900 dark:text-slate-100 bg-white dark:bg-[#101318] border border-slate-200/80 dark:border-white/10 font-bold shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-white/60 dark:hover:bg-[#101318]/50 font-medium'
                    }`}
                  >
                    <IconComponent className={`w-4 h-4 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'}`} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Sidebar Footer: Profile Dropdown */}
        <div className="relative p-5 border-t border-slate-200/80 dark:border-white/10">
          {/* Profile Menu Popover (Opens when user clicks Profile Card) */}
          {profileMenuOpen && (
            <div className="absolute bottom-full mb-2 left-5 right-5 p-2 rounded-2xl bg-white dark:bg-[#101318] border border-slate-200/80 dark:border-white/10 shadow-xl space-y-1 z-50">
              <div className="px-3 py-2 border-b border-slate-200/60 dark:border-white/5 space-y-0.5">
                <span className="block text-xs font-bold text-slate-900 dark:text-slate-100 truncate">{displayName}</span>
                <span className="block text-[10px] text-slate-500 font-mono truncate">{user?.email}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setProfileMenuOpen(false);
                  setShowLogoutModal(true);
                }}
                className="w-full px-3 py-2 rounded-xl text-left text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-colors flex items-center justify-between"
              >
                <span>Sign Out</span>
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* User Profile Trigger Card */}
          <button
            type="button"
            onClick={() => setProfileMenuOpen(!profileMenuOpen)}
            className="w-full p-3 rounded-2xl bg-white dark:bg-[#101318] border border-slate-200/80 dark:border-white/10 flex items-center justify-between text-xs shadow-sm hover:border-indigo-500/30 transition-all text-left group"
          >
            <div className="flex items-center space-x-2.5 truncate">
              <div className="w-8 h-8 rounded-xl bg-indigo-600/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0">
                <User className="w-4 h-4" />
              </div>
              <div className="flex flex-col truncate">
                <span className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate leading-tight">
                  {displayName}
                </span>
                <span className="text-[10px] text-slate-500 font-mono truncate leading-tight">
                  {user?.email}
                </span>
              </div>
            </div>
            <ChevronUp className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${profileMenuOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </aside>

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
