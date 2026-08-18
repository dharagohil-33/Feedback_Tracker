'use client';

import React, { useRef } from 'react';
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Quote,
  Code,
  Heading1,
  Heading2,
  Trash2,
} from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  required?: boolean;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Write or paste content...',
  rows = 6,
  required = false,
}: RichTextEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const applyFormatting = (prefix: string, suffix: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);

    let replacement = '';
    if (selectedText) {
      replacement = `${prefix}${selectedText}${suffix}`;
    } else {
      replacement = `${prefix}sample text${suffix}`;
    }

    const newValue = value.substring(0, start) + replacement + value.substring(end);
    onChange(newValue);

    // Restore focus and selection
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + prefix.length,
        start + prefix.length + (selectedText ? selectedText.length : 11)
      );
    }, 0);
  };

  const insertPrefixLine = (linePrefix: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);

    const replacement = linePrefix + (selectedText || 'List item');
    const newValue = value.substring(0, start) + replacement + value.substring(end);
    onChange(newValue);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + linePrefix.length, start + replacement.length);
    }, 0);
  };

  const handleClear = () => {
    onChange('');
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const wordCount = value.trim() ? value.trim().split(/\s+/).length : 0;
  const charCount = value.length;

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#07080A] overflow-hidden transition-all focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500/30">
      {/* Formatting Toolbar */}
      <div className="p-2 border-b border-slate-200 dark:border-white/10 bg-white dark:bg-[#101318] flex flex-wrap items-center justify-between gap-1">
        <div className="flex flex-wrap items-center gap-1">
          {/* Bold */}
          <button
            type="button"
            title="Bold (**text**)"
            onClick={() => applyFormatting('**', '**')}
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors font-bold text-xs flex items-center justify-center"
          >
            <Bold className="w-4 h-4" />
          </button>

          {/* Italic */}
          <button
            type="button"
            title="Italic (*text*)"
            onClick={() => applyFormatting('*', '*')}
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors text-xs flex items-center justify-center"
          >
            <Italic className="w-4 h-4" />
          </button>

          <div className="h-4 w-px bg-slate-200 dark:bg-white/10 mx-1" />

          {/* Heading 1 */}
          <button
            type="button"
            title="Heading 1 (# Text)"
            onClick={() => insertPrefixLine('# ')}
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors text-xs flex items-center justify-center"
          >
            <Heading1 className="w-4 h-4" />
          </button>

          {/* Heading 2 */}
          <button
            type="button"
            title="Heading 2 (## Text)"
            onClick={() => insertPrefixLine('## ')}
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors text-xs flex items-center justify-center"
          >
            <Heading2 className="w-4 h-4" />
          </button>

          <div className="h-4 w-px bg-slate-200 dark:bg-white/10 mx-1" />

          {/* Bullet List */}
          <button
            type="button"
            title="Bullet List (- Item)"
            onClick={() => insertPrefixLine('- ')}
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors text-xs flex items-center justify-center"
          >
            <List className="w-4 h-4" />
          </button>

          {/* Numbered List */}
          <button
            type="button"
            title="Numbered List (1. Item)"
            onClick={() => insertPrefixLine('1. ')}
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors text-xs flex items-center justify-center"
          >
            <ListOrdered className="w-4 h-4" />
          </button>

          <div className="h-4 w-px bg-slate-200 dark:bg-white/10 mx-1" />

          {/* Quote */}
          <button
            type="button"
            title="Blockquote (> Quote)"
            onClick={() => insertPrefixLine('> ')}
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors text-xs flex items-center justify-center"
          >
            <Quote className="w-4 h-4" />
          </button>

          {/* Code Block */}
          <button
            type="button"
            title="Code Snippet (`code`)"
            onClick={() => applyFormatting('`', '`')}
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors text-xs flex items-center justify-center"
          >
            <Code className="w-4 h-4" />
          </button>
        </div>

        {/* Clear Button */}
        {value.length > 0 && (
          <button
            type="button"
            title="Clear content"
            onClick={handleClear}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors text-xs flex items-center gap-1 font-medium"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Clear</span>
          </button>
        )}
      </div>

      {/* Main Textarea */}
      <textarea
        ref={textareaRef}
        rows={rows}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full p-4 bg-transparent text-slate-900 dark:text-slate-100 text-sm font-mono leading-relaxed focus:outline-none resize-y min-h-[140px]"
      />

      {/* Footer Stats Bar */}
      <div className="px-4 py-2 border-t border-slate-200 dark:border-white/10 bg-white/50 dark:bg-[#101318]/50 flex items-center justify-between text-[11px] font-mono text-slate-400">
        <span>Rich Text Format Supported</span>
        <div className="flex items-center space-x-3">
          <span>{wordCount} words</span>
          <span>•</span>
          <span>{charCount} characters</span>
        </div>
      </div>
    </div>
  );
}
