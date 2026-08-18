'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ProtectedRoute } from '../../components/ProtectedRoute';
import { CreateFeedbackModal } from '../../components/CreateFeedbackModal';
import { fetchFeedbackList, FeedbackItem } from '../../lib/apiClient';
import { toast } from 'sonner';
import {
  Search,
  Filter,
  Plus,
  FileText,
  MessageSquare,
} from 'lucide-react';

const SOURCES = ['All', 'Customer Support', 'Survey', 'Product Review', 'Sales Team', 'Direct Feedback', 'Internal Team', 'Other'];
const CATEGORIES = ['All', 'Bug', 'Feature Request', 'Usability', 'Performance', 'Billing', 'Customer Service', 'Product Experience', 'Other'];
const STATUSES = ['All', 'Open', 'In Progress', 'Resolved'];

export default function FeedbackListPage() {
  const [feedbackItems, setFeedbackItems] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedSource, setSelectedSource] = useState('All');
  const [totalCount, setTotalCount] = useState(0);

  // Debounce search input by 300ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const loadFeedback = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchFeedbackList({
        search: debouncedSearch,
        category: selectedCategory,
        status: selectedStatus,
        source: selectedSource,
      });
      setFeedbackItems(data?.items || []);
      setTotalCount(data?.total || 0);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load customer feedback records.');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, selectedCategory, selectedStatus, selectedSource]);

  useEffect(() => {
    loadFeedback();
  }, [loadFeedback]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Open':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
      case 'In Progress':
        return 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20';
      case 'Resolved':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
      default:
        return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20';
    }
  };

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200/80 dark:border-white/10">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-3">
              <MessageSquare className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
              <span>Customer Feedback</span>
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-sm mt-1.5 font-medium">
              Filter, inspect, and manage customer feedback records.
            </p>
          </div>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            type="button"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-sm font-semibold transition-all shadow-md shadow-indigo-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>New Feedback</span>
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#101318] border border-slate-200/80 dark:border-white/10 space-y-4 shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search Input */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
                <Search className="w-3.5 h-3.5" />
                <span>Search Keyword</span>
              </label>

              <div className="relative">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search title, customer, email..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#07080A] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-100 placeholder-slate-400 text-sm focus:outline-none focus:border-indigo-500 transition-all"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5" />
                <span>Category</span>
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#07080A] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:border-indigo-500 transition-all"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5" />
                <span>Status</span>
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#07080A] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:border-indigo-500 transition-all"
              >
                {STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            {/* Source Filter */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5" />
                <span>Source</span>
              </label>
              <select
                value={selectedSource}
                onChange={(e) => setSelectedSource(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#07080A] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:border-indigo-500 transition-all"
              >
                {SOURCES.map((src) => (
                  <option key={src} value={src}>
                    {src}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Data Table / List */}
        <div className="rounded-2xl bg-white dark:bg-[#101318] border border-slate-200/80 dark:border-white/10 overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-slate-200/80 dark:border-white/10 flex items-center justify-between">
            <span className="text-sm font-mono font-medium text-slate-600 dark:text-slate-400">
              Showing {feedbackItems.length} of {totalCount} records
            </span>
          </div>

          {loading ? (
            <div className="p-8 space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-16 rounded-xl bg-slate-200 dark:bg-white/5 animate-pulse" />
              ))}
            </div>
          ) : feedbackItems.length === 0 ? (
            <div className="p-12 text-center space-y-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {search || selectedCategory !== 'All' || selectedStatus !== 'All' || selectedSource !== 'All'
                  ? 'No matching feedback found'
                  : 'No customer feedback yet'}
              </h3>
              <p className="text-sm text-slate-500 max-w-sm mx-auto">
                {search || selectedCategory !== 'All'
                  ? 'Try adjusting your search keywords or active filter parameters.'
                  : 'Start capturing customer feedback to uncover insights.'}
              </p>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="inline-block mt-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-all shadow-md shadow-indigo-500/20"
              >
                Add Feedback
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-200/80 dark:border-white/10 text-xs font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-white/[0.02]">
                    <th className="px-5 py-3.5 font-bold">Title</th>
                    <th className="px-5 py-3.5 font-bold">Customer</th>
                    <th className="px-5 py-3.5 font-bold">Category</th>
                    <th className="px-5 py-3.5 font-bold">Source</th>
                    <th className="px-5 py-3.5 font-bold">Status</th>
                    <th className="px-5 py-3.5 font-bold">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/60 dark:divide-white/5">
                  {feedbackItems.map((item) => (
                    <tr
                      key={item.id}
                      onClick={() => window.location.href = `/feedback/${item.id}`}
                      className="hover:bg-slate-50 dark:hover:bg-white/[0.03] cursor-pointer transition-colors duration-150"
                    >
                      <td className="px-5 py-4 font-bold text-slate-900 dark:text-slate-100 max-w-xs truncate">
                        <div className="flex items-center gap-2">
                          {item.inputType === 'file' && (
                            <span className="px-2 py-0.5 text-[10px] font-mono rounded-md border border-indigo-500/30 text-indigo-500 bg-indigo-500/10 flex items-center gap-1">
                              <FileText className="w-3 h-3" />
                              TXT
                            </span>
                          )}
                          <span className="truncate">{item.title}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-slate-700 dark:text-slate-300">
                        <div className="font-semibold">{item.customerName || 'N/A'}</div>
                        <div className="text-xs text-slate-400 font-mono">{item.customerEmail}</div>
                      </td>
                      <td className="px-5 py-4 text-slate-700 dark:text-slate-300">
                        <span className="px-2.5 py-1 rounded-lg text-xs font-medium border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#07080A]">
                          {item.category}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-slate-600 dark:text-slate-300 text-xs">
                        {item.source}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${getStatusBadge(item.status)}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-slate-500 font-mono text-xs">
                        {new Date(item.feedbackDate || item.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Global Create Feedback Modal Overlay */}
        <CreateFeedbackModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={loadFeedback}
        />
      </div>
    </ProtectedRoute>
  );
}
