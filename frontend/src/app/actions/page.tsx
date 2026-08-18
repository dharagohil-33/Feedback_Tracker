'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ProtectedRoute } from '../../components/ProtectedRoute';
import { ConfirmModal } from '../../components/ConfirmModal';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';
import {
  fetchActionsApi,
  createActionApi,
  updateActionApi,
  deleteActionApi,
  fetchFeedbackList,
  ActionItem,
  FeedbackItem,
} from '../../lib/apiClient';
import {
  CheckSquare,
  Plus,
  Search,
  Filter,
  User,
  Calendar,
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Edit,
  Trash2,
  X,
  RotateCcw,
} from 'lucide-react';

const STATUS_OPTIONS = ['All', 'Open', 'In Progress', 'Blocked', 'Completed'];
const PRIORITY_OPTIONS = ['All', 'High', 'Medium', 'Low'];

export default function ActionsPage() {
  const [actions, setActions] = useState<ActionItem[]>([]);
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Search and Filter state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');

  // Create Modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createDesc, setCreateDesc] = useState('');
  const [createOwner, setCreateOwner] = useState('');
  const [createDueDate, setCreateDueDate] = useState('');
  const [createPriority, setCreatePriority] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [createStatus, setCreateStatus] = useState<'Open' | 'In Progress' | 'Blocked' | 'Completed'>('Open');
  const [createFeedbackId, setCreateFeedbackId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit Modal state
  const [editingAction, setEditingAction] = useState<ActionItem | null>(null);
  const [editDesc, setEditDesc] = useState('');
  const [editOwner, setEditOwner] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [editPriority, setEditPriority] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [editStatus, setEditStatus] = useState<'Open' | 'In Progress' | 'Blocked' | 'Completed'>('Open');
  const [isSaving, setIsSaving] = useState(false);

  // Delete Confirmation state
  const [actionToDelete, setActionToDelete] = useState<ActionItem | null>(null);

  const loadActions = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchActionsApi({
        status: statusFilter,
        priority: priorityFilter,
      });
      setActions(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load action tracker items');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, priorityFilter]);

  const loadFeedbacks = useCallback(async () => {
    try {
      const res = await fetchFeedbackList({ limit: 100 });
      if (res?.items) setFeedbacks(res.items);
    } catch (_err) {
      // Non-critical background fetch
    }
  }, []);

  useEffect(() => {
    loadActions();
    loadFeedbacks();
  }, [loadActions, loadFeedbacks]);

  // Handle Quick Status Change
  const handleStatusToggle = async (action: ActionItem, newStatus: 'Open' | 'In Progress' | 'Blocked' | 'Completed') => {
    try {
      const updated = await updateActionApi(action.id, { status: newStatus });
      if (updated) {
        setActions((prev) => prev.map((a) => (a.id === action.id ? updated : a)));
        toast.success(`Action status changed to "${newStatus}"`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update action status');
    }
  };

  // Handle Create Action
  const handleCreateAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createDesc.trim()) {
      toast.error('Action description is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      await createActionApi({
        description: createDesc.trim(),
        owner: createOwner.trim() || 'Unassigned',
        dueDate: createDueDate || undefined,
        priority: createPriority,
        status: createStatus,
        feedbackId: createFeedbackId || undefined,
      });

      toast.success('Follow-up action item created!');
      setIsCreateModalOpen(false);
      setCreateDesc('');
      setCreateOwner('');
      setCreateDueDate('');
      setCreatePriority('Medium');
      setCreateStatus('Open');
      setCreateFeedbackId('');
      loadActions();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create action item');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Open Edit Modal
  const openEditModal = (action: ActionItem) => {
    setEditingAction(action);
    setEditDesc(action.description);
    setEditOwner(action.owner || '');
    setEditDueDate(action.dueDate ? new Date(action.dueDate).toISOString().split('T')[0] : '');
    setEditPriority(action.priority || 'Medium');
    setEditStatus(action.status || 'Open');
  };

  // Handle Save Edit Action
  const handleSaveAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAction) return;
    if (!editDesc.trim()) {
      toast.error('Action description is required.');
      return;
    }

    setIsSaving(true);
    try {
      const updated = await updateActionApi(editingAction.id, {
        description: editDesc.trim(),
        owner: editOwner.trim() || 'Unassigned',
        dueDate: editDueDate || undefined,
        priority: editPriority,
        status: editStatus,
      });

      if (updated) {
        setActions((prev) => prev.map((a) => (a.id === editingAction.id ? updated : a)));
        toast.success('Action item updated successfully!');
      }
      setEditingAction(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update action item');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Delete Action
  const handleDeleteAction = async (action: ActionItem) => {
    try {
      await deleteActionApi(action.id);
      setActions((prev) => prev.filter((a) => a.id !== action.id));
      toast.success('Action item deleted');
      setActionToDelete(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete action item');
    }
  };

  // Filter actions locally by search
  const filteredActions = actions.filter((a) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return a.description.toLowerCase().includes(q) || (a.owner && a.owner.toLowerCase().includes(q));
  });

  // Calculate Metrics
  const totalCount = actions.length;
  const openCount = actions.filter((a) => a.status === 'Open').length;
  const inProgressCount = actions.filter((a) => a.status === 'In Progress').length;
  const blockedCount = actions.filter((a) => a.status === 'Blocked').length;
  const completedCount = actions.filter((a) => a.status === 'Completed').length;

  const getPriorityBadgeClass = (priority: string) => {
    switch (priority) {
      case 'High':
        return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
      case 'Medium':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
      default:
        return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20';
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
      case 'In Progress':
        return 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20';
      case 'Blocked':
        return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
      default:
        return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20';
    }
  };

  return (
    <ProtectedRoute>
      <div className="space-y-8">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200/80 dark:border-white/10">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-3">
              <CheckSquare className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
              <span>Follow-up Action Tracker</span>
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-sm mt-1.5 font-medium">
              Track, assign, and manage team action items extracted from customer feedback.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-all shadow-md shadow-indigo-500/20 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>New Action Item</span>
          </button>
        </div>

        {/* Metrics Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
          <div className="p-4 rounded-2xl bg-white dark:bg-[#101318] border border-slate-200/80 dark:border-white/10 space-y-1 shadow-sm">
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block">Total Actions</span>
            <span className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">{totalCount}</span>
          </div>
          <div className="p-4 rounded-2xl bg-white dark:bg-[#101318] border border-slate-200/80 dark:border-white/10 space-y-1 shadow-sm">
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-400" />
              <span>Open</span>
            </span>
            <span className="text-2xl font-extrabold text-slate-700 dark:text-slate-300">{openCount}</span>
          </div>
          <div className="p-4 rounded-2xl bg-white dark:bg-[#101318] border border-slate-200/80 dark:border-white/10 space-y-1 shadow-sm">
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block flex items-center gap-1">
              <Clock className="w-3 h-3 text-indigo-500" />
              <span>In Progress</span>
            </span>
            <span className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400">{inProgressCount}</span>
          </div>
          <div className="p-4 rounded-2xl bg-white dark:bg-[#101318] border border-slate-200/80 dark:border-white/10 space-y-1 shadow-sm">
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block flex items-center gap-1">
              <XCircle className="w-3 h-3 text-rose-500" />
              <span>Blocked</span>
            </span>
            <span className="text-2xl font-extrabold text-rose-600 dark:text-rose-400">{blockedCount}</span>
          </div>
          <div className="p-4 rounded-2xl bg-white dark:bg-[#101318] border border-slate-200/80 dark:border-white/10 space-y-1 shadow-sm">
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
              <span>Completed</span>
            </span>
            <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">{completedCount}</span>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#101318] border border-slate-200/80 dark:border-white/10 flex flex-col md:flex-row gap-4 items-center shadow-sm">
          {/* Search */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search actions or owners..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-[#07080A] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-100 text-sm font-medium focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <span className="text-sm font-bold text-slate-500">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-3.5 pr-8 py-2 rounded-xl bg-slate-50 dark:bg-[#07080A] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-100 text-sm font-semibold cursor-pointer focus:outline-none focus:border-indigo-500 transition-all"
              >
                {STATUS_OPTIONS.map((st) => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-sm font-bold text-slate-500">Priority:</span>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="pl-3.5 pr-8 py-2 rounded-xl bg-slate-50 dark:bg-[#07080A] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-100 text-sm font-semibold cursor-pointer focus:outline-none focus:border-indigo-500 transition-all"
              >
                {PRIORITY_OPTIONS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            {(search || statusFilter !== 'All' || priorityFilter !== 'All') && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setStatusFilter('All');
                  setPriorityFilter('All');
                }}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Actions List */}
        {loading ? (
          <div className="space-y-3">
            <div className="h-20 rounded-2xl bg-slate-200 dark:bg-white/5 animate-pulse" />
            <div className="h-20 rounded-2xl bg-slate-200 dark:bg-white/5 animate-pulse" />
            <div className="h-20 rounded-2xl bg-slate-200 dark:bg-white/5 animate-pulse" />
          </div>
        ) : filteredActions.length > 0 ? (
          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
            {filteredActions.map((action) => {
              const isOverdue =
                action.dueDate &&
                action.status !== 'Completed' &&
                new Date(action.dueDate).getTime() < new Date().getTime();

              return (
                <div
                  key={action.id}
                  className="p-5 rounded-2xl bg-white dark:bg-[#101318] border border-slate-200/80 dark:border-white/10 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-indigo-500/30 transition-all"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Interactive Status Changer Dropdown */}
                      <select
                        value={action.status}
                        onChange={(e) =>
                          handleStatusToggle(
                            action,
                            e.target.value as 'Open' | 'In Progress' | 'Blocked' | 'Completed'
                          )
                        }
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${getStatusBadgeClass(
                          action.status
                        )} cursor-pointer focus:outline-none`}
                      >
                        <option value="Open">Open</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Blocked">Blocked</option>
                        <option value="Completed">Completed</option>
                      </select>

                      {/* Priority Badge */}
                      <span
                        className={`px-2.5 py-1 rounded-lg text-xs font-mono border font-semibold ${getPriorityBadgeClass(
                          action.priority
                        )}`}
                      >
                        {action.priority} Priority
                      </span>

                      {/* Linked Feedback Record */}
                      {action.feedbackId && (
                        <Link
                          href={`/feedback/${action.feedbackId}`}
                          className="px-2.5 py-1 rounded-lg text-xs font-medium bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 hover:underline flex items-center gap-1"
                        >
                          <span>View Customer Feedback</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      )}
                    </div>

                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200 leading-relaxed">
                      {action.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400 pt-1">
                      <span className="flex items-center gap-1 font-medium">
                        <User className="w-3.5 h-3.5 text-indigo-500" />
                        <span>{action.owner || 'Unassigned'}</span>
                      </span>

                      {action.dueDate && (
                        <span
                          className={`flex items-center gap-1 font-mono text-xs ${
                            isOverdue
                              ? 'text-rose-600 dark:text-rose-400 font-bold'
                              : 'text-slate-500 dark:text-slate-400'
                          }`}
                        >
                          <Calendar className="w-3.5 h-3.5" />
                          <span>Due: {new Date(action.dueDate).toLocaleDateString()}</span>
                          {isOverdue && <span className="text-[10px] uppercase font-bold">(Overdue)</span>}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-white/5">
                    <button
                      type="button"
                      onClick={() => openEditModal(action)}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-white hover:bg-indigo-50 dark:bg-white/5 dark:hover:bg-indigo-500/20 text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 text-xs font-semibold flex items-center gap-1.5 transition-all"
                    >
                      <Edit className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActionToDelete(action)}
                      className="px-3 py-1.5 rounded-lg border border-rose-200 dark:border-rose-500/20 bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 text-rose-700 dark:text-rose-400 text-xs font-semibold flex items-center gap-1.5 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-12 rounded-2xl bg-white dark:bg-[#101318] border border-slate-200/80 dark:border-white/10 text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-slate-400 mx-auto" />
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">No Action Items Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No follow-up action items match your current search query or filter selection.
            </p>
          </div>
        )}

        {/* CREATE ACTION MODAL OVERLAY */}
        {isCreateModalOpen &&
          createPortal(
            <div className="fixed inset-0 z-[100] w-full h-full bg-slate-900/60 dark:bg-black/80 flex items-center justify-center p-4 sm:p-6 overflow-y-auto !mt-0">
              <div className="w-full max-w-lg p-6 rounded-2xl bg-white dark:bg-[#101318] border border-slate-200/80 dark:border-white/10 space-y-4 shadow-2xl my-auto">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 dark:border-white/10">
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <CheckSquare className="w-4 h-4 text-indigo-500" />
                    <span>Create Action Item</span>
                  </h3>
                  <button
                    onClick={() => setIsCreateModalOpen(false)}
                    type="button"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleCreateAction} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                      Action Description *
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={createDesc}
                      onChange={(e) => setCreateDesc(e.target.value)}
                      placeholder="e.g. Investigate CSV export timeout bug for datasets exceeding 50,000 rows..."
                      className="w-full p-3 rounded-xl bg-slate-50 dark:bg-[#07080A] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                        Owner
                      </label>
                      <input
                        type="text"
                        value={createOwner}
                        onChange={(e) => setCreateOwner(e.target.value)}
                        placeholder="e.g. Sarah Jenkins"
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#07080A] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-100 text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                        Due Date
                      </label>
                      <input
                        type="date"
                        value={createDueDate}
                        onChange={(e) => setCreateDueDate(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#07080A] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-100 text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                        Priority
                      </label>
                      <select
                        value={createPriority}
                        onChange={(e) => setCreatePriority(e.target.value as 'Low' | 'Medium' | 'High')}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#07080A] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-100 text-xs"
                      >
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                        Status
                      </label>
                      <select
                        value={createStatus}
                        onChange={(e) => setCreateStatus(e.target.value as 'Open' | 'In Progress' | 'Blocked' | 'Completed')}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#07080A] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-100 text-xs"
                      >
                        <option value="Open">Open</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Blocked">Blocked</option>
                        <option value="Completed">Completed</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                      Link Customer Feedback Record (Optional)
                    </label>
                    <select
                      value={createFeedbackId}
                      onChange={(e) => setCreateFeedbackId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#07080A] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-100 text-xs"
                    >
                      <option value="">Unassigned (Standalone Action)</option>
                      {feedbacks.map((fb) => (
                        <option key={fb.id} value={fb.id}>
                          {fb.title} ({fb.customerName})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex justify-end space-x-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsCreateModalOpen(false)}
                      className="px-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-semibold text-xs disabled:opacity-50"
                    >
                      {isSubmitting ? 'Creating...' : 'Create Action'}
                    </button>
                  </div>
                </form>
              </div>
            </div>,
            document.body
          )}

        {/* EDIT ACTION MODAL OVERLAY */}
        {editingAction &&
          createPortal(
            <div className="fixed inset-0 z-[100] w-full h-full bg-slate-900/60 dark:bg-black/80 flex items-center justify-center p-4 sm:p-6 overflow-y-auto !mt-0">
              <div className="w-full max-w-lg p-6 rounded-2xl bg-white dark:bg-[#101318] border border-slate-200/80 dark:border-white/10 space-y-4 shadow-2xl my-auto">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 dark:border-white/10">
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Edit Follow-up Action</h3>
                  <button
                    onClick={() => setEditingAction(null)}
                    type="button"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSaveAction} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                      Action Description *
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={editDesc}
                      onChange={(e) => setEditDesc(e.target.value)}
                      className="w-full p-3 rounded-xl bg-slate-50 dark:bg-[#07080A] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                        Owner
                      </label>
                      <input
                        type="text"
                        value={editOwner}
                        onChange={(e) => setEditOwner(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#07080A] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-100 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                        Due Date
                      </label>
                      <input
                        type="date"
                        value={editDueDate}
                        onChange={(e) => setEditDueDate(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#07080A] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-100 text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                        Priority
                      </label>
                      <select
                        value={editPriority}
                        onChange={(e) => setEditPriority(e.target.value as 'Low' | 'Medium' | 'High')}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#07080A] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-100 text-xs"
                      >
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                        Status
                      </label>
                      <select
                        value={editStatus}
                        onChange={(e) => setEditStatus(e.target.value as 'Open' | 'In Progress' | 'Blocked' | 'Completed')}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#07080A] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-100 text-xs"
                      >
                        <option value="Open">Open</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Blocked">Blocked</option>
                        <option value="Completed">Completed</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setEditingAction(null)}
                      className="px-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-semibold text-xs disabled:opacity-50"
                    >
                      {isSaving ? 'Saving...' : 'Save Action'}
                    </button>
                  </div>
                </form>
              </div>
            </div>,
            document.body
          )}

        {/* DELETE ACTION CONFIRMATION MODAL */}
        <ConfirmModal
          isOpen={!!actionToDelete}
          onClose={() => setActionToDelete(null)}
          onConfirm={() => actionToDelete && handleDeleteAction(actionToDelete)}
          title="Delete Action Item?"
          message="Are you sure you want to delete this follow-up action item? This action cannot be undone."
          confirmText="Delete Action"
          variant="danger"
        />
      </div>
    </ProtectedRoute>
  );
}
