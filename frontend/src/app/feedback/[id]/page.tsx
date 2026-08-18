'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ProtectedRoute } from '../../../components/ProtectedRoute';
import { ConfirmModal } from '../../../components/ConfirmModal';
import { RichTextEditor } from '../../../components/RichTextEditor';
import { toast } from 'sonner';
import {
  fetchFeedbackById,
  updateFeedbackApi,
  deleteFeedbackApi,
  analyzeFeedbackApi,
  fetchActionsApi,
  createActionApi,
  updateActionApi,
  deleteActionApi,
  fetchNotesApi,
  createNoteApi,
  updateNoteApi,
  deleteNoteApi,
  FeedbackItem,
  ActionItem,
  InternalNote,
  KeyInsight,
  FeatureRequestItem,
} from '../../../lib/apiClient';
import {
  ArrowLeft,
  Sparkles,
  Brain,
  User,
  Mail,
  Calendar,
  Tag,
  Globe,
  FileText,
  CheckSquare,
  MessageCircle,
  Plus,
  Trash2,
  Edit,
  AlertCircle,
  Lightbulb,
  X,
} from 'lucide-react';

const SOURCES = ['Customer Support', 'Survey', 'Product Review', 'Sales Team', 'Direct Feedback', 'Internal Team', 'Other'];
const CATEGORIES = ['Bug', 'Feature Request', 'Usability', 'Performance', 'Billing', 'Customer Service', 'Product Experience', 'Other'];
const STATUSES = ['Open', 'In Progress', 'Resolved'];

const ACTION_PRIORITIES = ['Low', 'Medium', 'High'];
const ACTION_STATUSES = ['Open', 'In Progress', 'Blocked', 'Completed'];

export default function FeedbackDetailPage() {
  const params = useParams();
  const router = useRouter();
  const feedbackId = params?.id as string;

  const [feedback, setFeedback] = useState<FeedbackItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // AI Analysis State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [localAiAnalysis, setLocalAiAnalysis] = useState<Record<string, unknown> | null>(null);

  // Actions State
  const [actions, setActions] = useState<ActionItem[]>([]);
  const [isAddingAction, setIsAddingAction] = useState(false);
  const [newActionDesc, setNewActionDesc] = useState('');
  const [newActionOwner, setNewActionOwner] = useState('Unassigned');
  const [newActionDueDate, setNewActionDueDate] = useState('');
  const [newActionPriority, setNewActionPriority] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [newActionStatus, setNewActionStatus] = useState<'Open' | 'In Progress' | 'Blocked' | 'Completed'>('Open');
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);
  const [actionToDelete, setActionToDelete] = useState<string | null>(null);

  // Edit Action Modal State
  const [editingAction, setEditingAction] = useState<ActionItem | null>(null);
  const [editActionDesc, setEditActionDesc] = useState('');
  const [editActionOwner, setEditActionOwner] = useState('');
  const [editActionDueDate, setEditActionDueDate] = useState('');
  const [editActionPriority, setEditActionPriority] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [editActionStatus, setEditActionStatus] = useState<'Open' | 'In Progress' | 'Blocked' | 'Completed'>('Open');
  const [isSavingAction, setIsSavingAction] = useState(false);

  // Internal Notes State
  const [notes, setNotes] = useState<InternalNote[]>([]);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteContent, setEditingNoteContent] = useState('');
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null);

  // Feedback Edit Modal State
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editCustomerName, setEditCustomerName] = useState('');
  const [editCustomerEmail, setEditCustomerEmail] = useState('');
  const [editFeedbackDate, setEditFeedbackDate] = useState('');
  const [editSource, setEditSource] = useState('Direct Feedback');
  const [editCategory, setEditCategory] = useState('Other');
  const [editStatus, setEditStatus] = useState('Open');
  const [editContent, setEditContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Delete Feedback Modal State
  const [isDeletingModalOpen, setIsDeletingModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadDetail = useCallback(async () => {
    if (!feedbackId) return;
    setLoading(true);
    setError(null);
    try {
      const [fbData, actionItems, noteItems] = await Promise.all([
        fetchFeedbackById(feedbackId),
        fetchActionsApi({ feedbackId }),
        fetchNotesApi(feedbackId),
      ]);

      if (fbData) {
        setFeedback(fbData);
        setEditTitle(fbData.title);
        setEditCustomerName(fbData.customerName);
        setEditCustomerEmail(fbData.customerEmail);
        setEditFeedbackDate(fbData.feedbackDate ? fbData.feedbackDate.split('T')[0] : '');
        setEditSource(fbData.source);
        setEditCategory(fbData.category);
        setEditStatus(fbData.status);
        setEditContent(fbData.content);
      } else {
        setError('Feedback record not found.');
      }

      setActions(actionItems || []);
      setNotes(noteItems || []);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load feedback workspace';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [feedbackId]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  useEffect(() => {
    const isAnyModalOpen = isAddingAction || !!editingAction || !!actionToDelete || !!noteToDelete || isEditing || isDeletingModalOpen;
    if (isAnyModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isAddingAction, editingAction, actionToDelete, noteToDelete, isEditing, isDeletingModalOpen]);

  const handleAnalyze = async () => {
    if (!feedback) return;
    setIsAnalyzing(true);
    try {
      const res = await analyzeFeedbackApi(feedback.id);
      if (res?.feedback) {
        setFeedback(res.feedback);
        if (res.aiAnalysis && typeof res.aiAnalysis === 'object') {
          setLocalAiAnalysis(res.aiAnalysis as Record<string, unknown>);
        }
        toast.success('AI analysis completed successfully!');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'AI Analysis request failed.';
      toast.error(msg);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // --- ACTION HANDLERS ---
  const handleCreateAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedback || !newActionDesc.trim()) return;
    setIsSubmittingAction(true);
    try {
      const created = await createActionApi({
        feedbackId: feedback.id,
        description: newActionDesc.trim(),
        owner: newActionOwner.trim() || 'Unassigned',
        dueDate: newActionDueDate ? newActionDueDate : null,
        priority: newActionPriority,
        status: newActionStatus,
      });
      if (created) {
        setActions((prev) => [created, ...prev]);
        setNewActionDesc('');
        setNewActionOwner('Unassigned');
        setNewActionDueDate('');
        setIsAddingAction(false);
        toast.success('Follow-up action item created!');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create action item');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleStatusChange = async (actionId: string, status: string) => {
    try {
      const updated = await updateActionApi(actionId, { status });
      if (updated) {
        setActions((prev) => prev.map((a) => (a.id === actionId ? updated : a)));
        toast.success(`Action status updated to ${status}`);
      }
    } catch (err) {
      toast.error('Failed updating action status');
    }
  };

  const handleOpenEditAction = (action: ActionItem) => {
    setEditingAction(action);
    setEditActionDesc(action.description);
    setEditActionOwner(action.owner || 'Unassigned');
    setEditActionDueDate(action.dueDate ? action.dueDate.split('T')[0] : '');
    setEditActionPriority(action.priority);
    setEditActionStatus(action.status);
  };

  const handleSaveAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAction) return;
    setIsSavingAction(true);
    try {
      const updated = await updateActionApi(editingAction.id, {
        description: editActionDesc.trim(),
        owner: editActionOwner.trim() || 'Unassigned',
        dueDate: editActionDueDate ? editActionDueDate : null,
        priority: editActionPriority,
        status: editActionStatus,
      });
      if (updated) {
        setActions((prev) => prev.map((a) => (a.id === editingAction.id ? updated : a)));
        setEditingAction(null);
        toast.success('Action item updated!');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save action changes');
    } finally {
      setIsSavingAction(false);
    }
  };

  const handleDeleteAction = async (actionId: string) => {
    try {
      await deleteActionApi(actionId);
      setActions((prev) => prev.filter((a) => a.id !== actionId));
      setActionToDelete(null);
      toast.success('Action item deleted!');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete action');
    }
  };

  // --- INTERNAL NOTES HANDLERS ---
  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedback || !newNoteContent.trim()) return;
    setIsSubmittingNote(true);
    try {
      const created = await createNoteApi(feedback.id, { content: newNoteContent.trim() });
      if (created) {
        setNotes((prev) => [...prev, created]);
        setNewNoteContent('');
        toast.success('Internal team note added!');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add internal note');
    } finally {
      setIsSubmittingNote(false);
    }
  };

  const handleUpdateNote = async (noteId: string) => {
    if (!editingNoteContent.trim()) return;
    try {
      const updated = await updateNoteApi(noteId, { content: editingNoteContent.trim() });
      if (updated) {
        setNotes((prev) => prev.map((n) => (n.id === noteId ? updated : n)));
        setEditingNoteId(null);
        setEditingNoteContent('');
        toast.success('Internal note updated!');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update note');
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      await deleteNoteApi(noteId);
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
      setNoteToDelete(null);
      toast.success('Internal note deleted!');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete note');
    }
  };

  // --- FEEDBACK RECORD HANDLERS ---
  const handleUpdateFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedback) return;
    setIsSaving(true);
    try {
      const updated = await updateFeedbackApi(feedback.id, {
        title: editTitle.trim(),
        customerName: editCustomerName.trim(),
        customerEmail: editCustomerEmail.trim(),
        feedbackDate: new Date(editFeedbackDate).toISOString(),
        source: editSource,
        category: editCategory,
        status: editStatus,
        content: editContent.trim(),
      });
      if (updated) {
        setFeedback(updated);
        toast.success('Feedback record updated!');
      }
      setIsEditing(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update feedback');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteFeedback = async () => {
    if (!feedback) return;
    setIsDeleting(true);
    try {
      await deleteFeedbackApi(feedback.id);
      toast.success('Feedback record deleted!');
      router.push('/feedback');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete feedback');
      setIsDeleting(false);
      setIsDeletingModalOpen(false);
    }
  };

  const getSentimentBadge = (sentiment?: string | null) => {
    switch (sentiment?.toLowerCase()) {
      case 'positive':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
      case 'negative':
        return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
      default:
        return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20';
    }
  };

  const getPriorityBadge = (priority?: string | null) => {
    switch (priority?.toLowerCase()) {
      case 'critical':
      case 'high':
        return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
      case 'low':
        return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20';
      default:
        return 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20';
    }
  };

  const getActionStatusDot = (status: string) => {
    switch (status) {
      case 'Open':
        return 'bg-emerald-500';
      case 'In Progress':
        return 'bg-cyan-500';
      case 'Blocked':
        return 'bg-amber-500';
      case 'Completed':
        return 'bg-indigo-500';
      default:
        return 'bg-slate-500';
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="space-y-6 w-full animate-pulse">
          <div className="flex justify-between items-center pb-4 border-b border-slate-200/80 dark:border-white/10">
            <div className="space-y-2">
              <div className="h-4 w-32 rounded bg-slate-200 dark:bg-white/5" />
              <div className="h-8 w-64 rounded bg-slate-200 dark:bg-white/5" />
            </div>
            <div className="flex space-x-2">
              <div className="h-9 w-28 rounded-xl bg-slate-200 dark:bg-white/5" />
              <div className="h-9 w-24 rounded-xl bg-slate-200 dark:bg-white/5" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="h-24 rounded-2xl bg-slate-200 dark:bg-white/5" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-7 space-y-4">
              <div className="h-56 rounded-2xl bg-slate-200 dark:bg-white/5" />
              <div className="h-64 rounded-2xl bg-slate-200 dark:bg-white/5" />
            </div>
            <div className="lg:col-span-5 space-y-4">
              <div className="h-64 rounded-2xl bg-slate-200 dark:bg-white/5" />
              <div className="h-64 rounded-2xl bg-slate-200 dark:bg-white/5" />
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (error || !feedback) {
    return (
      <ProtectedRoute>
        <div className="max-w-2xl mx-auto p-8 rounded-2xl bg-white dark:bg-[#101318] border border-slate-200/80 dark:border-white/10 text-center space-y-4 shadow-sm">
          <div className="text-rose-500 font-semibold text-sm">Notice: {error || 'Record not found'}</div>
          <Link href="/feedback" className="inline-block px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold">
            Return to Feedback Workspace
          </Link>
        </div>
      </ProtectedRoute>
    );
  }

  const isCompleted = feedback.aiStatus === 'completed' || !!feedback.summary || !!localAiAnalysis;

  return (
    <ProtectedRoute>
      <div className="space-y-8 w-full">
        {/* Navigation Breadcrumb & Executive Actions Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200/80 dark:border-white/10">
          <div>
            <Link href="/feedback" className="text-xs font-mono text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1.5 mb-2 font-semibold">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Feedback Workspace</span>
            </Link>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-3">
              <span>{feedback.title}</span>
              <span className="px-3 py-1 rounded-xl text-xs font-mono border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-[#101318]">
                {feedback.status}
              </span>
            </h1>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              type="button"
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all disabled:opacity-50 flex items-center gap-2 shadow-md shadow-indigo-500/20"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isAnalyzing ? 'Analyzing...' : isCompleted ? 'Re-analyze Feedback' : 'Analyze with AI'}</span>
            </button>
            <button
              onClick={() => setIsEditing(true)}
              type="button"
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-white/5 transition-all flex items-center gap-1.5"
            >
              <Edit className="w-3.5 h-3.5" />
              <span>Edit</span>
            </button>
            <button
              onClick={() => setIsDeletingModalOpen(true)}
              type="button"
              className="px-4 py-2.5 rounded-xl border border-rose-500/20 bg-rose-500/10 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 transition-all flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
          </div>
        </div>

        {/* Full-Width 4-Card Metadata Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Customer Info */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#101318] border border-slate-200/80 dark:border-white/10 space-y-2 shadow-sm">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-indigo-500" />
              <span>Customer Information</span>
            </span>
            <div className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">
              {feedback.customerName || 'Anonymous Customer'}
            </div>
            <div className="text-xs font-mono text-indigo-600 dark:text-indigo-400 truncate flex items-center gap-1">
              <Mail className="w-3 h-3" />
              <span>{feedback.customerEmail}</span>
            </div>
          </div>

          {/* Card 2: Classification */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#101318] border border-slate-200/80 dark:border-white/10 space-y-2 shadow-sm">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-indigo-500" />
              <span>Category & Source</span>
            </span>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg text-xs font-semibold border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#07080A]">
                {feedback.category}
              </span>
              <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                {feedback.source}
              </span>
            </div>
            <div className="text-xs font-mono text-slate-400 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>Logged {new Date(feedback.feedbackDate || feedback.createdAt).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Card 3: AI Intelligence Tags */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#101318] border border-slate-200/80 dark:border-white/10 space-y-2 shadow-sm">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Brain className="w-3.5 h-3.5 text-indigo-500" />
              <span>AI Sentiment & Priority</span>
            </span>
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-1 rounded-lg text-xs font-mono uppercase font-bold border ${getSentimentBadge(feedback.sentiment || (localAiAnalysis?.sentiment as string))}`}>
                {feedback.sentiment || (localAiAnalysis?.sentiment as string) || 'Neutral'}
              </span>
              <span className={`px-2.5 py-1 rounded-lg text-xs font-mono uppercase font-bold border ${getPriorityBadge(feedback.priority || (localAiAnalysis?.priority as string))}`}>
                {feedback.priority || (localAiAnalysis?.priority as string) || 'Medium'}
              </span>
            </div>
            <div className="text-xs font-mono text-slate-400">
              Area: {feedback.productArea || (localAiAnalysis?.productArea as string) || 'Core Product'}
            </div>
          </div>

          {/* Card 4: Document / AI Status */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#101318] border border-slate-200/80 dark:border-white/10 space-y-2 shadow-sm">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-indigo-500" />
              <span>Input & AI Engine Status</span>
            </span>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5" />
                <span>{feedback.inputType === 'file' ? `Document (.TXT)` : 'Manual Text Entry'}</span>
              </span>
              <span className={`px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold border ${isCompleted ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'}`}>
                {isCompleted ? 'AI Analyzed' : 'Unanalyzed'}
              </span>
            </div>
            <div className="text-xs font-mono text-slate-400 truncate">
              {feedback.fileName ? `${feedback.fileName} (${feedback.fileSize ? (feedback.fileSize / 1024).toFixed(1) : 0} KB)` : 'Direct submission'}
            </div>
          </div>
        </div>

        {/* Main 2-Column Responsive Workspace Grid (7 cols / 5 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column (Primary Content & AI Intelligence Workspace - 7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Original Customer Feedback Card */}
            <div className="p-6 rounded-2xl bg-white dark:bg-[#101318] border border-slate-200/80 dark:border-white/10 space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-500" />
                  <span>Original Customer Feedback</span>
                </h2>
                <span className="text-xs font-mono text-slate-400">
                  Logged {new Date(feedback.feedbackDate || feedback.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="p-6 rounded-xl bg-slate-50 dark:bg-[#07080A] border border-slate-200/80 dark:border-white/5 font-mono text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed max-h-72 sm:max-h-80 overflow-y-auto pr-2">
                {feedback.content}
              </div>
            </div>

            {/* AI INTELLIGENCE WORKSPACE */}
            <div className="p-6 rounded-2xl bg-white dark:bg-[#101318] border border-indigo-500/30 space-y-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-500 animate-pulse" />
                  <span className="text-xs font-mono uppercase tracking-wider text-indigo-600 dark:text-indigo-400 font-extrabold">
                    AI Intelligence Workspace
                  </span>
                </div>
                <span
                  className={`px-3 py-1 rounded-lg text-xs font-mono font-bold border ${
                    isAnalyzing
                      ? 'bg-amber-500/10 text-amber-500 border-amber-500/20 animate-pulse'
                      : isCompleted
                      ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                      : 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20'
                  }`}
                >
                  {isAnalyzing ? 'Processing...' : isCompleted ? 'AI Analyzed' : 'Unanalyzed'}
                </span>
              </div>

              {/* Processing Skeleton State */}
              {isAnalyzing ? (
                <div className="p-4 space-y-4 animate-pulse">
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#07080A] border border-indigo-500/20 space-y-2">
                    <div className="h-4 w-28 rounded bg-indigo-500/20" />
                    <div className="h-4 w-full rounded bg-slate-200 dark:bg-white/5" />
                    <div className="h-4 w-5/6 rounded bg-slate-200 dark:bg-white/5" />
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="h-16 rounded-xl bg-slate-200 dark:bg-white/5" />
                    <div className="h-16 rounded-xl bg-slate-200 dark:bg-white/5" />
                    <div className="h-16 rounded-xl bg-slate-200 dark:bg-white/5" />
                    <div className="h-16 rounded-xl bg-slate-200 dark:bg-white/5" />
                  </div>
                </div>
              ) : isCompleted ? (
                /* COMPLETED AI RESULTS VIEW */
                <div className="space-y-5">
                  {/* AI Summary Banner */}
                  <div className="p-5 rounded-xl bg-indigo-500/5 dark:bg-[#07080A] border border-indigo-500/20 space-y-2 max-h-48 overflow-y-auto pr-2">
                    <span className="text-xs font-mono uppercase tracking-wider text-indigo-600 dark:text-indigo-400 font-extrabold flex items-center gap-1.5">
                      <Brain className="w-3.5 h-3.5" />
                      <span>AI Summary</span>
                    </span>
                    <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                      {feedback.summary || (localAiAnalysis?.summary as string)}
                    </p>
                  </div>

                  {/* AI Classification Badges */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#07080A] border border-slate-200/80 dark:border-white/5 space-y-1">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block font-bold">Sentiment</span>
                      <span className={`inline-block px-2.5 py-1 rounded-lg text-xs border uppercase font-mono font-bold ${getSentimentBadge(feedback.sentiment || (localAiAnalysis?.sentiment as string))}`}>
                        {feedback.sentiment || (localAiAnalysis?.sentiment as string) || 'Neutral'}
                      </span>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#07080A] border border-slate-200/80 dark:border-white/5 space-y-1">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block font-bold">Priority</span>
                      <span className={`inline-block px-2.5 py-1 rounded-lg text-xs border uppercase font-mono font-bold ${getPriorityBadge(feedback.priority || (localAiAnalysis?.priority as string))}`}>
                        {feedback.priority || (localAiAnalysis?.priority as string) || 'Medium'}
                      </span>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#07080A] border border-slate-200/80 dark:border-white/5 space-y-1">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block font-bold">Type</span>
                      <span className="text-sm font-bold text-slate-900 dark:text-slate-100 capitalize block">
                        {feedback.feedbackType || (localAiAnalysis?.feedbackType as string) || 'General'}
                      </span>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#07080A] border border-slate-200/80 dark:border-white/5 space-y-1">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block font-bold">Product Area</span>
                      <span className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate block">
                        {feedback.productArea || (localAiAnalysis?.productArea as string) || 'Core App'}
                      </span>
                    </div>
                  </div>

                  {/* Key Insights List */}
                  {((feedback.keyInsights && feedback.keyInsights.length > 0) || ((localAiAnalysis?.keyInsights as unknown[])?.length ?? 0) > 0) && (
                    <div className="space-y-3">
                      <span className="text-xs font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Key Extracted Insights</span>
                      </span>
                      <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                        {(feedback.keyInsights || (localAiAnalysis?.keyInsights as KeyInsight[]) || []).map((insight: KeyInsight, idx: number) => (
                          <div key={idx} className="p-4 rounded-xl bg-slate-50 dark:bg-[#07080A] border border-slate-200/80 dark:border-white/5 flex items-start justify-between gap-3 text-sm">
                            <span className="text-slate-800 dark:text-slate-200 font-medium">{insight.insightText}</span>
                            <span className="px-2.5 py-1 rounded-lg text-xs font-mono bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 whitespace-nowrap font-bold">
                              {insight.insightType || 'Insight'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Extracted Feature Requests */}
                  <div className="space-y-3">
                    <span className="text-xs font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold flex items-center gap-1.5">
                      <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                      <span>Extracted Feature Requests</span>
                    </span>
                    {(feedback.featureRequests && feedback.featureRequests.length > 0) || ((localAiAnalysis?.featureRequests as unknown[])?.length ?? 0) > 0 ? (
                      <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                        {(feedback.featureRequests || (localAiAnalysis?.featureRequests as FeatureRequestItem[]) || []).map((fr: FeatureRequestItem, idx: number) => (
                          <div key={idx} className="p-4 rounded-xl bg-slate-50 dark:bg-[#07080A] border border-slate-200/80 dark:border-white/5 space-y-1 text-sm">
                            <div className="font-bold text-indigo-600 dark:text-indigo-400">
                              {fr.title || fr.featureDescription}
                            </div>
                            <div className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">
                              {fr.description || fr.reason}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#07080A] border border-slate-200/80 dark:border-white/5 text-sm text-slate-500 italic">
                        No feature request identified in this feedback.
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* UNANALYZED INITIAL STATE */
                <div className="space-y-4">
                  <div className="p-5 rounded-xl bg-slate-50 dark:bg-[#07080A] border border-slate-200/80 dark:border-white/5 text-sm text-slate-600 dark:text-slate-400 space-y-2">
                    <p className="font-semibold text-slate-900 dark:text-slate-100">
                      This feedback has not been analyzed by AI yet.
                    </p>
                  </div>

                  <button
                    onClick={handleAnalyze}
                    type="button"
                    className="w-full py-3 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-md shadow-indigo-500/20"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Analyze Feedback with AI Engine</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right Column (Operations Workspace - 5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* ACTION ITEM MANAGEMENT TRACKER WORKSPACE */}
            <div className="p-6 rounded-2xl bg-white dark:bg-[#101318] border border-slate-200/80 dark:border-white/10 space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <CheckSquare className="w-4 h-4 text-indigo-500" />
                    <span>Follow-up Action Tracker ({actions.length})</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5 font-medium">
                    Create, assign owners, set due dates, and track completion.
                  </p>
                </div>
                <button
                  onClick={() => setIsAddingAction(true)}
                  type="button"
                  className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all flex items-center gap-1.5 shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Action</span>
                </button>
              </div>

              {/* CREATE ACTION MODAL OVERLAY */}
              {isAddingAction && (
                <div className="fixed inset-0 z-[100] w-full h-full bg-slate-900/60 dark:bg-black/80 flex items-center justify-center p-4 sm:p-6 overflow-y-auto !mt-0">
                  <div className="w-full max-w-lg p-6 rounded-2xl bg-white dark:bg-[#101318] border border-slate-200/80 dark:border-white/10 space-y-4 shadow-2xl">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 dark:border-white/10">
                      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <CheckSquare className="w-4 h-4 text-indigo-500" />
                        <span>Create Follow-up Action</span>
                      </h3>
                      <button
                        onClick={() => setIsAddingAction(false)}
                        type="button"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <form onSubmit={handleCreateAction} className="space-y-4 text-xs">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Action Description *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g., Triage checkout payment failure with engineering squad"
                          value={newActionDesc}
                          onChange={(e) => setNewActionDesc(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#07080A] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-100 text-sm"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Owner</label>
                          <input
                            type="text"
                            placeholder="Unassigned"
                            value={newActionOwner}
                            onChange={(e) => setNewActionOwner(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#07080A] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-100 text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Due Date</label>
                          <input
                            type="date"
                            value={newActionDueDate}
                            onChange={(e) => setNewActionDueDate(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#07080A] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-100 text-xs"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Priority</label>
                          <select
                            value={newActionPriority}
                            onChange={(e) => setNewActionPriority(e.target.value as 'Low' | 'Medium' | 'High')}
                            className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#07080A] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-100 text-xs"
                          >
                            {ACTION_PRIORITIES.map((p) => (
                              <option key={p} value={p}>{p}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Status</label>
                          <select
                            value={newActionStatus}
                            onChange={(e) => setNewActionStatus(e.target.value as 'Open' | 'In Progress' | 'Blocked' | 'Completed')}
                            className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#07080A] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-100 text-xs"
                          >
                            {ACTION_STATUSES.map((s) => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="flex justify-end space-x-3 pt-2">
                        <button
                          type="button"
                          onClick={() => setIsAddingAction(false)}
                          className="px-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 text-xs"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={isSubmittingAction}
                          className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-semibold text-xs disabled:opacity-50"
                        >
                          {isSubmittingAction ? 'Creating...' : 'Save Action Item'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* Action List Table / Cards */}
              {actions.length > 0 ? (
                <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                  {actions.map((act) => (
                    <div
                      key={act.id}
                      className="p-4 rounded-xl bg-slate-50 dark:bg-[#07080A] border border-slate-200/80 dark:border-white/5 flex flex-col space-y-2.5 text-xs"
                    >
                      <div className="font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${getActionStatusDot(act.status)}`} />
                        <span>{act.description}</span>
                      </div>
                      
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-xs text-slate-500 font-mono border-t border-slate-200/60 dark:border-white/5">
                        <div className="flex items-center gap-3">
                          <span>Owner: <strong className="text-slate-700 dark:text-slate-300">{act.owner || 'Unassigned'}</strong></span>
                          <span>Due: <strong className="text-slate-700 dark:text-slate-300">{act.dueDate ? new Date(act.dueDate).toLocaleDateString() : 'None'}</strong></span>
                        </div>

                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono uppercase font-bold border ${getPriorityBadge(act.priority)}`}>
                            {act.priority}
                          </span>
                          <select
                            value={act.status}
                            onChange={(e) => handleStatusChange(act.id, e.target.value)}
                            className="px-2 py-1 rounded-lg bg-white dark:bg-[#101318] border border-slate-200 dark:border-white/10 text-xs font-mono text-slate-800 dark:text-slate-200"
                          >
                            {ACTION_STATUSES.map((s) => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                          <button
                            onClick={() => handleOpenEditAction(act)}
                            type="button"
                            className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-white/10 bg-white hover:bg-indigo-50 dark:bg-white/5 dark:hover:bg-indigo-500/20 text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 text-xs font-semibold flex items-center gap-1 shadow-sm transition-all"
                          >
                            <Edit className="w-3 h-3 text-indigo-500" />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => setActionToDelete(act.id)}
                            type="button"
                            className="px-2.5 py-1 rounded-lg border border-rose-200 dark:border-rose-500/20 bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 text-rose-700 dark:text-rose-400 text-xs font-semibold flex items-center gap-1 shadow-sm transition-all"
                          >
                            <Trash2 className="w-3 h-3 text-rose-500" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 rounded-xl bg-slate-50 dark:bg-[#07080A] border border-slate-200/80 dark:border-white/5 text-center text-xs text-slate-500 space-y-1">
                  <p className="font-semibold text-slate-700 dark:text-slate-300">No follow-up action items created yet</p>
                  <p className="text-xs">Click &quot;Create Action&quot; above to add follow-up tasks and assign team owners.</p>
                </div>
              )}
            </div>

            {/* INTERNAL TEAM NOTES WORKSPACE */}
            <div className="p-6 rounded-2xl bg-white dark:bg-[#101318] border border-slate-200/80 dark:border-white/10 space-y-4 shadow-sm">
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <MessageCircle className="w-4 h-4 text-indigo-500" />
                  <span>Internal Team Notes ({notes.length})</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5 font-medium">
                  Internal notes are private to the team and kept separate from original customer feedback.
                </p>
              </div>

              {/* Add Note Form */}
              <form onSubmit={handleCreateNote} className="space-y-3">
                <textarea
                  required
                  rows={3}
                  placeholder="Add an internal note or update for team members..."
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                  className="w-full p-4 rounded-xl bg-slate-50 dark:bg-[#07080A] border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-slate-100 font-mono leading-relaxed"
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isSubmittingNote || !newNoteContent.trim()}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold disabled:opacity-50"
                  >
                    {isSubmittingNote ? 'Posting Note...' : 'Post Internal Note'}
                  </button>
                </div>
              </form>

              {/* Internal Notes List */}
              {notes.length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto pr-1 pt-2">
                  {notes.map((note) => (
                    <div key={note.id} className="p-4 rounded-xl bg-slate-50 dark:bg-[#07080A] border border-slate-200/80 dark:border-white/5 space-y-2 text-xs">
                      <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                        <span className="font-bold text-indigo-600 dark:text-indigo-400">
                          {note.authorName} ({note.authorEmail || 'Team Member'})
                        </span>
                        <span>{new Date(note.createdAt).toLocaleString()}</span>
                      </div>

                      {editingNoteId === note.id ? (
                        <div className="space-y-2 pt-1">
                          <textarea
                            rows={3}
                            value={editingNoteContent}
                            onChange={(e) => setEditingNoteContent(e.target.value)}
                            className="w-full p-3 rounded-xl bg-white dark:bg-[#101318] border border-slate-200 dark:border-white/10 text-xs font-mono text-slate-900 dark:text-slate-100"
                          />
                          <div className="flex justify-end space-x-2">
                            <button
                              type="button"
                              onClick={() => setEditingNoteId(null)}
                              className="px-3 py-1 rounded text-slate-500 text-xs"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateNote(note.id)}
                              className="px-3 py-1 rounded-lg bg-indigo-600 text-white text-xs font-semibold"
                            >
                              Save Note
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-slate-800 dark:text-slate-200 leading-relaxed font-mono whitespace-pre-wrap flex justify-between items-start text-xs">
                          <span>{note.content}</span>
                          <div className="flex items-center space-x-2 ml-4 shrink-0">
                            <button
                              onClick={() => {
                                setEditingNoteId(note.id);
                                setEditingNoteContent(note.content);
                              }}
                              className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-white/10 bg-white hover:bg-indigo-50 dark:bg-white/5 dark:hover:bg-indigo-500/20 text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 text-xs font-semibold flex items-center gap-1 shadow-sm transition-all"
                            >
                              <Edit className="w-3 h-3 text-indigo-500" />
                              <span>Edit</span>
                            </button>
                            <button
                              onClick={() => setNoteToDelete(note.id)}
                              className="px-2.5 py-1 rounded-lg border border-rose-200 dark:border-rose-500/20 bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 text-rose-700 dark:text-rose-400 text-xs font-semibold flex items-center gap-1 shadow-sm transition-all"
                            >
                              <Trash2 className="w-3 h-3 text-rose-500" />
                              <span>Delete</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#07080A] border border-slate-200/80 dark:border-white/5 text-center text-xs text-slate-500">
                  No internal notes added yet.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* EDIT ACTION MODAL */}
        {editingAction && (
          <div className="fixed inset-0 z-[100] w-full h-full bg-slate-900/60 dark:bg-black/80 flex items-center justify-center p-4 sm:p-6 overflow-y-auto !mt-0">
            <div className="w-full max-w-lg p-6 rounded-2xl bg-white dark:bg-[#101318] border border-slate-200/80 dark:border-white/10 space-y-4 shadow-2xl">
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
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Description *</label>
                  <input
                    type="text"
                    required
                    value={editActionDesc}
                    onChange={(e) => setEditActionDesc(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#07080A] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-100 text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Owner</label>
                    <input
                      type="text"
                      value={editActionOwner}
                      onChange={(e) => setEditActionOwner(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#07080A] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-100 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Due Date</label>
                    <input
                      type="date"
                      value={editActionDueDate}
                      onChange={(e) => setEditActionDueDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#07080A] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-100 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Priority</label>
                    <select
                      value={editActionPriority}
                      onChange={(e) => setEditActionPriority(e.target.value as 'Low' | 'Medium' | 'High')}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#07080A] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-100 text-xs"
                    >
                      {ACTION_PRIORITIES.map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Status</label>
                    <select
                      value={editActionStatus}
                      onChange={(e) => setEditActionStatus(e.target.value as 'Open' | 'In Progress' | 'Blocked' | 'Completed')}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#07080A] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-100 text-xs"
                    >
                      {ACTION_STATUSES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
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
                    disabled={isSavingAction}
                    className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-semibold text-xs disabled:opacity-50"
                  >
                    {isSavingAction ? 'Saving...' : 'Save Action'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* DELETE NOTE CONFIRMATION MODAL */}
        <ConfirmModal
          isOpen={!!noteToDelete}
          onClose={() => setNoteToDelete(null)}
          onConfirm={() => noteToDelete && handleDeleteNote(noteToDelete)}
          title="Delete Internal Note?"
          message="Are you sure you want to delete this internal team note? This action cannot be undone."
          confirmText="Delete Note"
          variant="danger"
        />

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

        {/* EDIT FEEDBACK MODAL */}
        {isEditing && (
          <div className="fixed inset-0 z-[100] w-full h-full bg-slate-900/60 dark:bg-black/80 flex items-center justify-center p-4 sm:p-6 overflow-y-auto !mt-0">
            <div className="w-full max-w-2xl p-6 rounded-2xl bg-white dark:bg-[#101318] border border-slate-200/80 dark:border-white/10 space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 dark:border-white/10">
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Edit Feedback Record</h3>
                <button
                  onClick={() => setIsEditing(false)}
                  type="button"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleUpdateFeedback} className="space-y-4 text-xs">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Title *</label>
                  <input
                    type="text"
                    required
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#07080A] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-100 text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Customer Name *</label>
                    <input
                      type="text"
                      required
                      value={editCustomerName}
                      onChange={(e) => setEditCustomerName(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-[#07080A] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-100 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Customer Email *</label>
                    <input
                      type="email"
                      required
                      value={editCustomerEmail}
                      onChange={(e) => setEditCustomerEmail(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-[#07080A] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-100 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Source</label>
                    <select
                      value={editSource}
                      onChange={(e) => setEditSource(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#07080A] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-100 text-xs"
                    >
                      {SOURCES.map((src) => (
                        <option key={src} value={src}>{src}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Category</label>
                    <select
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#07080A] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-100 text-xs"
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Status</label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#07080A] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-100 text-xs"
                    >
                      {STATUSES.map((st) => (
                        <option key={st} value={st}>{st}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Feedback Content *</label>
                  <RichTextEditor
                    value={editContent}
                    onChange={setEditContent}
                    placeholder="Paste or write customer feedback..."
                    rows={5}
                    required
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-semibold text-xs disabled:opacity-50"
                  >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* DELETE FEEDBACK CONFIRMATION MODAL */}
        <ConfirmModal
          isOpen={isDeletingModalOpen}
          onClose={() => setIsDeletingModalOpen(false)}
          onConfirm={handleDeleteFeedback}
          title="Delete Feedback Record?"
          message="This will permanently remove this customer feedback record and any associated storage files from PostgreSQL. This action cannot be undone."
          confirmText="Delete Record"
          variant="danger"
          isLoading={isDeleting}
        />
      </div>
    </ProtectedRoute>
  );
}
