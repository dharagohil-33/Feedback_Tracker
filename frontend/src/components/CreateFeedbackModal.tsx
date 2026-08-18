'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { createFeedbackApi } from '../lib/apiClient';
import { RichTextEditor } from './RichTextEditor';
import { toast } from 'sonner';
import {
  FileText,
  Edit3,
  Upload,
  X,
  User,
  Mail,
  Tag,
  Globe,
  Plus,
} from 'lucide-react';

const SOURCES = ['Customer Support', 'Survey', 'Product Review', 'Sales Team', 'Direct Feedback', 'Internal Team', 'Other'];
const CATEGORIES = ['Bug', 'Feature Request', 'Usability', 'Performance', 'Billing', 'Customer Service', 'Product Experience', 'Other'];
const STATUSES = ['Open', 'In Progress', 'Resolved'];

interface CreateFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function CreateFeedbackModal({ isOpen, onClose, onSuccess }: CreateFeedbackModalProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  const [inputMode, setInputMode] = useState<'text' | 'file'>('text');
  const [title, setTitle] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [feedbackDate, setFeedbackDate] = useState(new Date().toISOString().split('T')[0]);
  const [source, setSource] = useState('Direct Feedback');
  const [category, setCategory] = useState('Other');
  const [status, setStatus] = useState('Open');
  const [content, setContent] = useState('');

  // File Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileBase64, setFileBase64] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<number | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock background scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file extension
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== 'txt') {
      toast.error('Only .txt text files are supported.');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be under 5MB.');
      return;
    }

    setSelectedFile(file);
    setFileSize(file.size);

    // Auto set title if title is empty
    if (!title.trim()) {
      const baseName = file.name.replace(/\.[^/.]+$/, '');
      setTitle(baseName.replace(/[-_]/g, ' '));
    }

    // Read text content & base64
    const reader = new FileReader();
    reader.onload = (event) => {
      const textContent = event.target?.result as string;
      setContent(textContent);
    };
    reader.readAsText(file);

    const base64Reader = new FileReader();
    base64Reader.onload = (event) => {
      const base64String = (event.target?.result as string).split(',')[1];
      setFileBase64(base64String);
    };
    base64Reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error('Feedback title is required.');
      return;
    }
    if (!customerName.trim()) {
      toast.error('Customer name is required.');
      return;
    }
    if (!customerEmail.trim() || !customerEmail.includes('@')) {
      toast.error('A valid customer email is required.');
      return;
    }
    if (!content.trim()) {
      toast.error('Feedback content is required.');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload: Record<string, unknown> = {
        title: title.trim(),
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim(),
        feedbackDate: new Date(feedbackDate).toISOString(),
        source,
        category,
        status,
        content: content.trim(),
        inputType: inputMode,
      };

      if (inputMode === 'file' && selectedFile) {
        payload.fileName = selectedFile.name;
        payload.fileSize = fileSize;
        payload.mimeType = 'text/plain';
        payload.fileData = fileBase64;
      }

      const created = await createFeedbackApi(payload);
      
      toast.success('Customer feedback logged successfully!');

      // Reset form
      setTitle('');
      setCustomerName('');
      setCustomerEmail('');
      setContent('');
      setSelectedFile(null);
      setFileBase64(null);

      onClose();

      if (onSuccess) {
        onSuccess();
      } else if (created?.id) {
        router.push(`/feedback/${created.id}`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create feedback record.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] w-full h-full bg-slate-900/60 dark:bg-black/80 flex items-center justify-center p-4 sm:p-6 overflow-y-auto !mt-0">
      <div className="w-full max-w-2xl max-h-[92vh] overflow-y-auto p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#101318] border border-slate-200/80 dark:border-white/10 space-y-6 shadow-2xl my-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200/80 dark:border-white/10">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Plus className="w-5 h-5 text-indigo-500" />
              <span>Capture Customer Feedback</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1 font-medium">Add feedback manually or upload a plain text (.txt) document</p>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Input Mode Selector */}
        <div className="p-1 rounded-xl bg-slate-100 dark:bg-[#07080A] border border-slate-200 dark:border-white/10 inline-flex w-full">
          <button
            type="button"
            onClick={() => setInputMode('text')}
            className={`flex-1 py-2.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-2 ${
              inputMode === 'text'
                ? 'bg-white dark:bg-[#101318] text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-white/10 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Manual Write / Paste</span>
          </button>
          <button
            type="button"
            onClick={() => setInputMode('file')}
            className={`flex-1 py-2.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-2 ${
              inputMode === 'file'
                ? 'bg-white dark:bg-[#101318] text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-white/10 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload .TXT File</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 text-sm">
          {/* File Upload Zone (If Option B selected) */}
          {inputMode === 'file' && (
            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-[#07080A] border-2 border-dashed border-slate-300 dark:border-white/10 text-center space-y-3">
              <Upload className="w-8 h-8 text-indigo-500 mx-auto" />
              <div>
                <span className="block text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {selectedFile ? selectedFile.name : 'Upload .txt Feedback Document'}
                </span>
                <span className="block text-xs text-slate-500 mt-1">
                  {selectedFile ? `${(selectedFile.size / 1024).toFixed(1)} KB` : 'Only plain text (.txt) files up to 5MB supported.'}
                </span>
              </div>
              <label className="inline-block px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold cursor-pointer transition-all shadow-md shadow-indigo-500/20">
                Select .TXT File
                <input
                  type="file"
                  accept=".txt,text/plain"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          )}

          {/* Customer Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-indigo-500" />
                <span>Customer Name *</span>
              </label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. Sarah Jenkins"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-[#07080A] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-indigo-500" />
                <span>Customer Email *</span>
              </label>
              <input
                type="email"
                required
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="sarah@acme.com"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-[#07080A] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-indigo-500" />
              <span>Feedback Title *</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Brief summary of feedback..."
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-[#07080A] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Classification Selectors */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                Date
              </label>
              <input
                type="date"
                value={feedbackDate}
                onChange={(e) => setFeedbackDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#07080A] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-100 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1">
                <Globe className="w-3 h-3" />
                <span>Source</span>
              </label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#07080A] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-100 text-xs"
              >
                {SOURCES.map((src) => (
                  <option key={src} value={src}>
                    {src}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1">
                <Tag className="w-3 h-3" />
                <span>Category</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#07080A] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-100 text-xs"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#07080A] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-100 text-xs"
              >
                {STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Feedback Content Text Area with Rich Text Editor */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Feedback Content *
            </label>
            <RichTextEditor
              value={content}
              onChange={setContent}
              placeholder="Paste or write customer feedback..."
              rows={5}
              required
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs disabled:opacity-50 shadow-md shadow-indigo-500/20"
            >
              {isSubmitting ? 'Saving Feedback...' : 'Save Feedback'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
