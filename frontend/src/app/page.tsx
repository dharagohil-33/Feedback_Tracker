'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 max-w-3xl mx-auto w-full animate-pulse">
        <div className="h-6 w-48 rounded-full bg-slate-200 dark:bg-white/5" />
        <div className="h-12 w-3/4 rounded bg-slate-200 dark:bg-white/5" />
        <div className="h-16 w-2/3 rounded bg-slate-200 dark:bg-white/5" />
        <div className="flex justify-center gap-3 pt-2">
          <div className="h-10 w-32 rounded-lg bg-slate-200 dark:bg-white/5" />
          <div className="h-10 w-32 rounded-lg bg-slate-200 dark:bg-white/5" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center space-y-8 max-w-3xl mx-auto py-12">
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 bg-indigo-500/5 text-xs font-mono">
        <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
        AI Customer Intelligence OS
      </div>

      <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 leading-[1.1]">
        Understand customer feedback. Decide what to build next.
      </h1>

      <p className="text-slate-600 dark:text-slate-400 max-w-xl text-sm md:text-base leading-relaxed">
        A futuristic product intelligence platform. Capture customer feedback, generate AI sentiment summaries, extract feature requests, and track follow-up action items.
      </p>

      <div className="flex items-center justify-center gap-3 pt-2">
        <Link
          href="/register"
          className="px-6 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-medium text-xs transition-all"
        >
          Create Account
        </Link>
        <Link
          href="/login"
          className="px-6 py-3 rounded-lg bg-slate-100 dark:bg-[#101318] hover:bg-slate-200 dark:hover:bg-[#151920] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-100 font-medium text-xs transition-all"
        >
          Sign In
        </Link>
      </div>
    </div>
  );
}
