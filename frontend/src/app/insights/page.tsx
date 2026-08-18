'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ProtectedRoute } from '../../components/ProtectedRoute';
import { CreateFeedbackModal } from '../../components/CreateFeedbackModal';
import { fetchInsightsApi, InsightsData } from '../../lib/apiClient';
import { toast } from 'sonner';
import {
  BarChart3,
  PieChart,
  Share2,
  FolderKanban,
  AlertCircle,
  Lightbulb,
  Plus,
  ArrowRight,
} from 'lucide-react';

export default function InsightsPage() {
  const [data, setData] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const loadInsights = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchInsightsApi();
      if (result) {
        setData(result);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load product insights analytics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInsights();
  }, [loadInsights]);

  const totalFeedbackCount = data?.feedbackBySentiment.reduce((acc, curr) => acc + curr.count, 0) || 1;

  const getSentimentBarColor = (sentiment: string) => {
    switch (sentiment.toLowerCase()) {
      case 'positive':
        return 'bg-emerald-500';
      case 'negative':
        return 'bg-rose-500';
      default:
        return 'bg-slate-400 dark:bg-slate-600';
    }
  };

  return (
    <ProtectedRoute>
      <div className="space-y-8">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200/80 dark:border-white/10">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-3">
              <BarChart3 className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
              <span>Product Feedback Insights</span>
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-sm mt-1.5 font-medium">
              Aggregated categories, customer sentiment distribution, recurring issues, and top feature requests.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsCreateModalOpen(true)}
              type="button"
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-all shadow-md shadow-indigo-500/20 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>New Feedback</span>
            </button>
            <Link
              href="/feedback"
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 text-sm font-semibold transition-all flex items-center gap-1.5"
            >
              <span>Directory</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-64 rounded-2xl bg-slate-200 dark:bg-white/5 animate-pulse" />
            <div className="h-64 rounded-2xl bg-slate-200 dark:bg-white/5 animate-pulse" />
          </div>
        ) : (
          <div className="space-y-8">
            {/* Analytics Breakdown Grid (Category, Sentiment, Source) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Category Breakdown */}
              <div className="p-6 rounded-2xl bg-white dark:bg-[#101318] border border-slate-200/80 dark:border-white/10 space-y-5 shadow-sm">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                  <FolderKanban className="w-4 h-4 text-indigo-500" />
                  <span>Feedback by Category</span>
                </h2>
                <div className="space-y-4 max-h-[280px] overflow-y-auto pr-1">
                  {data?.feedbackByCategory && data.feedbackByCategory.length > 0 ? (
                    data.feedbackByCategory.map((cat) => {
                      const pct = Math.round((cat.count / totalFeedbackCount) * 100);
                      return (
                        <div key={cat.category} className="space-y-1.5 text-sm">
                          <div className="flex justify-between text-xs font-medium">
                            <span className="font-semibold text-slate-900 dark:text-slate-100">{cat.category}</span>
                            <span className="font-mono text-slate-500">{cat.count} ({pct}%)</span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-white/5 overflow-hidden">
                            <div
                              className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                              style={{ width: `${Math.max(pct, 5)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-sm text-slate-500 italic">No category data recorded yet.</div>
                  )}
                </div>
              </div>

              {/* Sentiment Distribution */}
              <div className="p-6 rounded-2xl bg-white dark:bg-[#101318] border border-slate-200/80 dark:border-white/10 space-y-5 shadow-sm">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-emerald-500" />
                  <span>Sentiment Distribution</span>
                </h2>
                <div className="space-y-4 max-h-[280px] overflow-y-auto pr-1">
                  {data?.feedbackBySentiment && data.feedbackBySentiment.length > 0 ? (
                    data.feedbackBySentiment.map((sent) => {
                      const pct = Math.round((sent.count / totalFeedbackCount) * 100);
                      return (
                        <div key={sent.sentiment} className="space-y-1.5 text-sm">
                          <div className="flex justify-between text-xs uppercase font-mono">
                            <span className="font-bold text-slate-900 dark:text-slate-100">{sent.sentiment}</span>
                            <span className="text-slate-500">{sent.count} ({pct}%)</span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-white/5 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${getSentimentBarColor(sent.sentiment)}`}
                              style={{ width: `${Math.max(pct, 5)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-sm text-slate-500 italic">No sentiment data recorded yet.</div>
                  )}
                </div>
              </div>

              {/* Source Distribution */}
              <div className="p-6 rounded-2xl bg-white dark:bg-[#101318] border border-slate-200/80 dark:border-white/10 space-y-5 shadow-sm">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                  <Share2 className="w-4 h-4 text-cyan-500" />
                  <span>Feedback by Source</span>
                </h2>
                <div className="space-y-4 max-h-[280px] overflow-y-auto pr-1">
                  {data?.feedbackBySource && data.feedbackBySource.length > 0 ? (
                    data.feedbackBySource.map((src) => {
                      const pct = Math.round((src.count / totalFeedbackCount) * 100);
                      return (
                        <div key={src.source} className="space-y-1.5 text-sm">
                          <div className="flex justify-between text-xs font-medium">
                            <span className="font-semibold text-slate-900 dark:text-slate-100">{src.source}</span>
                            <span className="font-mono text-slate-500">{src.count} ({pct}%)</span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-white/5 overflow-hidden">
                            <div
                              className="h-full bg-cyan-500 rounded-full transition-all duration-300"
                              style={{ width: `${Math.max(pct, 5)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-sm text-slate-500 italic">No source data recorded yet.</div>
                  )}
                </div>
              </div>
            </div>

            {/* Recurring Issues & Top Requested Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Recurring Product Issues */}
              <div className="p-6 rounded-2xl bg-white dark:bg-[#101318] border border-slate-200/80 dark:border-white/10 space-y-5 shadow-sm">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-500" />
                  <span>Recurring Product Issues & Friction</span>
                </h2>
                {data?.mostCommonIssues && data.mostCommonIssues.length > 0 ? (
                  <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                    {data.mostCommonIssues.map((issue) => {
                      const detailUrl = issue.feedbackId ? `/feedback/${issue.feedbackId}` : '/feedback';
                      return (
                        <Link
                          key={issue.id || issue.insightText}
                          href={detailUrl}
                          className="p-4 rounded-xl bg-slate-50 dark:bg-[#07080A] hover:bg-slate-100 dark:hover:bg-white/5 border border-slate-200/80 dark:border-white/5 hover:border-indigo-500/30 flex items-start justify-between gap-3 text-sm group transition-all block"
                        >
                          <span className="text-slate-800 dark:text-slate-200 font-medium group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            {issue.insightText}
                          </span>
                          <span className="px-2.5 py-1 rounded-lg text-xs font-mono bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 shrink-0 font-semibold">
                            {issue.insightType || 'Issue'}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-6 rounded-xl bg-slate-50 dark:bg-[#07080A] border border-slate-200/80 dark:border-white/5 text-sm text-slate-500 italic text-center">
                    No AI key insights recorded yet. Run AI analysis on customer feedback items to populate.
                  </div>
                )}
              </div>

              {/* Top Requested Features */}
              <div className="p-6 rounded-2xl bg-white dark:bg-[#101318] border border-slate-200/80 dark:border-white/10 space-y-5 shadow-sm">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-amber-500" />
                  <span>Top Requested Product Features</span>
                </h2>
                {data?.mostRequestedFeatures && data.mostRequestedFeatures.length > 0 ? (
                  <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                    {data.mostRequestedFeatures.map((fr) => {
                      const detailUrl = fr.feedbackId ? `/feedback/${fr.feedbackId}` : '/feedback';
                      return (
                        <Link
                          key={fr.id || fr.title}
                          href={detailUrl}
                          className="p-4 rounded-xl bg-slate-50 dark:bg-[#07080A] hover:bg-slate-100 dark:hover:bg-white/5 border border-slate-200/80 dark:border-white/5 hover:border-indigo-500/30 space-y-1.5 text-sm group transition-all block"
                        >
                          <div className="font-bold text-indigo-600 dark:text-indigo-400 group-hover:underline">
                            {fr.title || fr.featureDescription}
                          </div>
                          <div className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">
                            {fr.description || fr.reason}
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-6 rounded-xl bg-slate-50 dark:bg-[#07080A] border border-slate-200/80 dark:border-white/5 text-sm text-slate-500 italic text-center">
                    No feature requests extracted yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Global Create Feedback Modal Overlay */}
        <CreateFeedbackModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={loadInsights}
        />
      </div>
    </ProtectedRoute>
  );
}
