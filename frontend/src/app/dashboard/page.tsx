'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ProtectedRoute } from '../../components/ProtectedRoute';
import { CreateFeedbackModal } from '../../components/CreateFeedbackModal';
import { fetchDashboardApi, DashboardData } from '../../lib/apiClient';
import { toast } from 'sonner';
import {
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  AlertTriangle,
  Clock,
  CheckCircle2,
  HelpCircle,
  Plus,
  AlertOctagon,
  ArrowRight,
} from 'lucide-react';

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchDashboardApi();
      if (result) {
        setData(result);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load dashboard metrics';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const metrics = data?.metrics || {
    totalFeedback: 0,
    positiveFeedback: 0,
    negativeFeedback: 0,
    highPriority: 0,
    openActions: 0,
    completedActions: 0,
    unresolvedFeedback: 0,
  };

  const metricCards = [
    { label: 'Total Feedback', value: metrics.totalFeedback, change: 'All items', color: 'text-indigo-600 dark:text-indigo-400', icon: MessageSquare },
    { label: 'Positive', value: metrics.positiveFeedback, change: 'Sentiment', color: 'text-emerald-600 dark:text-emerald-400', icon: ThumbsUp },
    { label: 'Negative', value: metrics.negativeFeedback, change: 'Requires triage', color: 'text-rose-600 dark:text-rose-400', icon: ThumbsDown },
    { label: 'High Priority', value: metrics.highPriority, change: 'High / Critical', color: 'text-amber-600 dark:text-amber-400', icon: AlertTriangle },
    { label: 'Open Actions', value: metrics.openActions, change: 'Pending tasks', color: 'text-cyan-600 dark:text-cyan-400', icon: Clock },
    { label: 'Completed Actions', value: metrics.completedActions, change: 'Resolved tasks', color: 'text-emerald-600 dark:text-emerald-400', icon: CheckCircle2 },
    { label: 'Unresolved', value: metrics.unresolvedFeedback, change: 'Open / Review', color: 'text-purple-600 dark:text-purple-400', icon: HelpCircle },
  ];

  return (
    <ProtectedRoute>
      <div className="space-y-8">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200/80 dark:border-white/10">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
              Executive Dashboard
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-sm mt-1.5 font-medium">
              Real-time customer feedback aggregation, priority tracking, and follow-up metrics.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsCreateModalOpen(true)}
              type="button"
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-sm font-semibold transition-all shadow-md shadow-indigo-500/20 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>New Feedback</span>
            </button>
          </div>
        </div>

        {/* Metrics Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
            {Array.from({ length: 7 }).map((_, idx) => (
              <div key={idx} className="h-28 rounded-2xl bg-slate-200 dark:bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
            {metricCards.map((card) => {
              const IconComp = card.icon;
              return (
                <div
                  key={card.label}
                  className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#101318] border border-slate-200/80 dark:border-white/10 space-y-2 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 truncate">
                      {card.label}
                    </span>
                    <IconComp className={`w-4 h-4 ${card.color}`} />
                  </div>
                  <span className={`block text-3xl font-extrabold font-mono ${card.color}`}>
                    {card.value}
                  </span>
                  <span className="block text-xs text-slate-400 font-mono">
                    {card.change}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Attention Area & Recent Feedback Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Feedback List (2 cols) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-indigo-500" />
                <span>Recently Logged Feedback</span>
              </h2>
              <Link href="/feedback" className="text-xs font-mono text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1">
                <span>View All</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, idx) => (
                  <div key={idx} className="h-20 rounded-2xl bg-slate-200 dark:bg-white/5 animate-pulse" />
                ))}
              </div>
            ) : data?.recentlyAddedFeedback && data.recentlyAddedFeedback.length > 0 ? (
              <div className="space-y-3">
                {data.recentlyAddedFeedback.map((item) => (
                  <Link
                    key={item.id}
                    href={`/feedback/${item.id}`}
                    className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#101318] hover:bg-slate-50 dark:hover:bg-white/5 border border-slate-200/80 dark:border-white/10 flex items-center justify-between gap-4 text-sm transition-all group block shadow-sm"
                  >
                    <div className="space-y-1.5 max-w-md">
                      <div className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors text-base">
                        {item.title}
                      </div>
                      <div className="text-xs text-slate-500 font-mono flex items-center gap-2">
                        <span>{item.customerName || 'Anonymous'}</span>
                        <span>•</span>
                        <span>{item.category}</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 shrink-0">
                      <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-medium border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#07080A]">
                        {item.status}
                      </span>
                      <span className="text-xs font-mono text-slate-400">
                        {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : ''}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="p-10 rounded-2xl bg-white dark:bg-[#101318] border border-slate-200/80 dark:border-white/10 text-center text-sm text-slate-500 space-y-3 shadow-sm">
                <p className="font-semibold text-slate-700 dark:text-slate-300">No feedback items recorded yet</p>
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="inline-block text-indigo-600 dark:text-indigo-400 underline font-mono text-xs font-semibold"
                >
                  Capture first customer feedback
                </button>
              </div>
            )}
          </div>

          {/* Attention Callout Workspace (1 col) */}
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-white dark:bg-[#101318] border border-slate-200/80 dark:border-white/10 space-y-5 shadow-sm">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <AlertOctagon className="w-4 h-4 text-rose-500 animate-pulse" />
                <span>Attention Required</span>
              </h2>

              <div className="space-y-4 text-sm">
                <div className="p-4 rounded-xl bg-rose-500/5 border border-rose-500/15 space-y-1.5">
                  <span className="text-xs font-mono uppercase text-rose-500 font-bold block">High Priority Items</span>
                  <div className="text-3xl font-extrabold font-mono text-slate-900 dark:text-slate-100">
                    {metrics.highPriority}
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Feedback categorized with High or Critical priority level.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/15 space-y-1.5">
                  <span className="text-xs font-mono uppercase text-amber-500 font-bold block">Open Action Tasks</span>
                  <div className="text-3xl font-extrabold font-mono text-slate-900 dark:text-slate-100">
                    {metrics.openActions}
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Follow-up actions currently assigned or in progress.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Global Create Feedback Modal Overlay */}
        <CreateFeedbackModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={loadDashboard}
        />
      </div>
    </ProtectedRoute>
  );
}
