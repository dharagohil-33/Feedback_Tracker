'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, LogOut, Trash2, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'indigo';
  isLoading?: boolean;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  isLoading = false,
}: ConfirmModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scroll when modal is open
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

  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          icon: <Trash2 className="w-6 h-6 text-rose-500" />,
          iconBg: 'bg-rose-500/10 border-rose-500/20',
          confirmBtn: 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-500/20',
        };
      case 'warning':
        return {
          icon: <AlertTriangle className="w-6 h-6 text-amber-500" />,
          iconBg: 'bg-amber-500/10 border-amber-500/20',
          confirmBtn: 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-500/20',
        };
      case 'indigo':
      default:
        return {
          icon: <LogOut className="w-6 h-6 text-indigo-500" />,
          iconBg: 'bg-indigo-500/10 border-indigo-500/20',
          confirmBtn: 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/20',
        };
    }
  };

  const style = getVariantStyles();

  return createPortal(
    <div className="fixed inset-0 z-[100] w-full h-full bg-slate-900/60 dark:bg-black/80 flex items-center justify-center p-4 overflow-y-auto !mt-0">
      <div className="w-full max-w-md p-6 rounded-2xl bg-white dark:bg-[#101318] border border-slate-200/80 dark:border-white/10 space-y-5 shadow-2xl my-auto">
        <div className="flex items-start justify-between">
          <div className={`p-3 rounded-xl border ${style.iconBg} shrink-0`}>
            {style.icon}
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2">
          <h3 className="text-lg font-extrabold text-slate-900 dark:text-slate-100">
            {title}
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
            {message}
          </p>
        </div>

        <div className="flex items-center justify-end space-x-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-5 py-2.5 rounded-xl font-semibold text-xs transition-all shadow-md disabled:opacity-50 ${style.confirmBtn}`}
          >
            {isLoading ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
