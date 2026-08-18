'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="space-y-6 w-full animate-pulse">
        {/* Skeleton Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-white/10">
          <div className="space-y-2">
            <div className="h-4 w-44 rounded bg-slate-200 dark:bg-white/5" />
            <div className="h-8 w-64 rounded bg-slate-200 dark:bg-white/5" />
            <div className="h-3 w-80 rounded bg-slate-200 dark:bg-white/5" />
          </div>
          <div className="h-9 w-36 rounded-lg bg-slate-200 dark:bg-white/5" />
        </div>

        {/* Skeleton Top Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {Array.from({ length: 7 }).map((_, idx) => (
            <div key={idx} className="h-24 rounded-xl bg-slate-200 dark:bg-white/5" />
          ))}
        </div>

        {/* Skeleton Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-3">
            <div className="h-16 rounded-xl bg-slate-200 dark:bg-white/5" />
            <div className="h-16 rounded-xl bg-slate-200 dark:bg-white/5" />
            <div className="h-16 rounded-xl bg-slate-200 dark:bg-white/5" />
          </div>
          <div className="h-56 rounded-xl bg-slate-200 dark:bg-white/5" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
