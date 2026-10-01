import React from 'react';
import { ShieldCheck, Lock, CheckCircle2 } from 'lucide-react';

export const PrivacyNotice: React.FC = () => {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 p-4 text-xs text-slate-600 dark:text-slate-400">
      <div className="flex items-start gap-3">
        <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 shrink-0">
          <ShieldCheck className="w-4 h-4" />
        </div>
        <div className="space-y-1">
          <p className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <span>गोपनीयता सुरक्षा (Privacy First)</span>
            <span className="text-[10px] font-normal px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300">
              100% Client-Side
            </span>
          </p>
          <p className="leading-relaxed">
            Your text is processed locally when using browser-based speech. We do not store your text.
          </p>
        </div>
      </div>
    </div>
  );
};
