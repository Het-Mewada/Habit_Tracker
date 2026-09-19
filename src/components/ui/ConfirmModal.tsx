'use client';

import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { clsx } from 'clsx';
import { Portal } from './Portal';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'default';
  isLoading?: boolean;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  isLoading = false,
  onConfirm,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <Portal>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm animate-in fade-in">
        <div className="w-full max-w-sm p-5 bg-white dark:bg-[#15181E] rounded-xl shadow-xl border border-slate-200/80 dark:border-slate-800/80 space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <div
                className={clsx(
                  'p-2 rounded-lg',
                  variant === 'danger'
                    ? 'bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                )}
              >
                <AlertTriangle className="w-4 h-4 stroke-[1.75]" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {title}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-400 leading-normal font-sans">
            {message}
          </p>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/60 font-mono text-xs">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-3.5 py-1.5 font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              {cancelText}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isLoading}
              className={clsx(
                'px-4 py-1.5 font-semibold text-white rounded-lg transition-all shadow-2xs disabled:opacity-50',
                variant === 'danger'
                  ? 'bg-red-700 hover:bg-red-800 dark:bg-red-600 dark:hover:bg-red-700'
                  : 'bg-slate-900 dark:bg-slate-100 dark:text-slate-900 hover:bg-slate-800'
              )}
            >
              {isLoading ? 'Processing...' : confirmText}
            </button>
          </div>
        </div>
      </div>
    </Portal>
  );
};
