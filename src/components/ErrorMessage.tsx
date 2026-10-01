import React from 'react';
import { AlertCircle, X, AlertTriangle, Info } from 'lucide-react';

interface ErrorMessageProps {
  message: string | null;
  type?: 'error' | 'warning' | 'info';
  onDismiss?: () => void;
  actionText?: string;
  onAction?: () => void;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  message,
  type = 'error',
  onDismiss,
  actionText,
  onAction,
}) => {
  if (!message) return null;

  const styles = {
    error: {
      bg: 'bg-rose-50 dark:bg-rose-950/40',
      border: 'border-rose-200 dark:border-rose-800/60',
      text: 'text-rose-800 dark:text-rose-200',
      icon: <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />,
      btn: 'text-rose-700 hover:text-rose-900 dark:text-rose-300 dark:hover:text-rose-100',
    },
    warning: {
      bg: 'bg-amber-50 dark:bg-amber-950/40',
      border: 'border-amber-200 dark:border-amber-800/60',
      text: 'text-amber-800 dark:text-amber-200',
      icon: <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />,
      btn: 'text-amber-700 hover:text-amber-900 dark:text-amber-300 dark:hover:text-amber-100',
    },
    info: {
      bg: 'bg-indigo-50 dark:bg-indigo-950/40',
      border: 'border-indigo-200 dark:border-indigo-800/60',
      text: 'text-indigo-800 dark:text-indigo-200',
      icon: <Info className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />,
      btn: 'text-indigo-700 hover:text-indigo-900 dark:text-indigo-300 dark:hover:text-indigo-100',
    },
  }[type];

  return (
    <div
      role="alert"
      className={`rounded-xl p-3.5 border ${styles.bg} ${styles.border} ${styles.text} flex items-start gap-3 transition-all animate-fadeIn`}
    >
      {styles.icon}
      <div className="flex-1 text-sm font-medium leading-relaxed">
        {message}
        {actionText && onAction && (
          <button
            type="button"
            onClick={onAction}
            className="ml-2 font-semibold underline hover:no-underline cursor-pointer"
          >
            {actionText}
          </button>
        )}
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className={`p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 ${styles.btn} transition-colors`}
          aria-label="Dismiss message"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
