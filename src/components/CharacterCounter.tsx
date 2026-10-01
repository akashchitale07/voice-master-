import React from 'react';
import { AlertTriangle, AlertCircle, Clock, Infinity, Info, CheckCircle2 } from 'lucide-react';

interface CharacterCounterProps {
  currentChars: number;
  wordCount: number;
  hindiPercentage: number;
  cloudCharLimit?: number;
  provider?: 'browser' | 'cloud';
}

export const CharacterCounter: React.FC<CharacterCounterProps> = ({
  currentChars,
  wordCount,
  hindiPercentage,
  cloudCharLimit = 5000,
  provider = 'browser',
}) => {
  // Usage threshold calculations
  const warningThreshold = Math.floor(cloudCharLimit * 0.7); // 3,500 chars
  const isNearLimit = currentChars >= warningThreshold && currentChars <= cloudCharLimit;
  const isOverLimit = currentChars > cloudCharLimit;
  const usagePercentage = Math.min(100, Math.round((currentChars / cloudCharLimit) * 100));

  // Audio duration estimation (~130 words per minute average reading speed)
  const formatEstimatedTime = (words: number) => {
    if (words === 0) return '0s';
    const totalSeconds = Math.max(1, Math.round((words / 130) * 60));
    if (totalSeconds < 60) return `~${totalSeconds}s`;
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return secs > 0 ? `~${mins}m ${secs}s` : `~${mins}m`;
  };

  return (
    <div className="space-y-2">
      {/* Top Row: Counters, Estimation & Status Chips */}
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-xs">
        
        {/* Left Side: Character & Word Stats */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Character Counter with dynamic color alerting */}
          <div
            className={`flex items-center gap-1.5 font-mono px-2 py-0.5 rounded-md transition-colors ${
              isOverLimit
                ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-bold border border-rose-300 dark:border-rose-800'
                : isNearLimit
                ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-semibold border border-amber-300 dark:border-amber-800'
                : 'text-slate-700 dark:text-slate-300 bg-slate-100/70 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60'
            }`}
            title={`Characters: ${currentChars.toLocaleString()} | Cloud Limit: ${cloudCharLimit.toLocaleString()} | Browser: Unlimited`}
          >
            {isOverLimit ? (
              <AlertCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
            ) : isNearLimit ? (
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
            ) : (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            )}
            <span>
              Characters: <strong>{currentChars.toLocaleString()}</strong>
              <span className="text-[11px] opacity-75 font-normal"> / {cloudCharLimit.toLocaleString()}</span>
            </span>
          </div>

          {/* Word Count */}
          <div className="font-mono text-slate-600 dark:text-slate-300 flex items-center gap-1">
            <span>Words:</span>
            <strong className="text-slate-900 dark:text-slate-100">{wordCount.toLocaleString()}</strong>
          </div>

          <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">|</span>

          {/* Speech duration estimate */}
          {wordCount > 0 && (
            <div
              className="flex items-center gap-1 text-slate-500 dark:text-slate-400"
              title="Estimated speech duration at standard 1.0x rate"
            >
              <Clock className="w-3 h-3 text-indigo-500" />
              <span>Est. Audio: <strong className="text-slate-700 dark:text-slate-300">{formatEstimatedTime(wordCount)}</strong></span>
            </div>
          )}

          {/* Mode Pill: Unlimited Browser indicator */}
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
            <Infinity className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
            <span>Browser: Unlimited</span>
          </span>
        </div>

        {/* Right Side: Script analysis indicator */}
        {currentChars > 0 && (
          <div className="flex items-center gap-1.5 ml-auto">
            <span
              className={`w-2 h-2 rounded-full ${
                hindiPercentage >= 50
                  ? 'bg-emerald-500 ring-2 ring-emerald-400/20'
                  : hindiPercentage > 0
                  ? 'bg-amber-500 ring-2 ring-amber-400/20'
                  : 'bg-slate-400'
              }`}
            />
            <span className="text-[11px]">
              {hindiPercentage >= 50 ? (
                <span className="text-emerald-700 dark:text-emerald-300 font-medium">
                  Hindi Devanagari ({hindiPercentage}%)
                </span>
              ) : hindiPercentage > 0 ? (
                <span className="text-amber-700 dark:text-amber-400 font-medium">
                  Mixed Text ({hindiPercentage}% Hindi)
                </span>
              ) : (
                <span className="text-slate-500 dark:text-slate-400">
                  Non-Devanagari text
                </span>
              )}
            </span>
          </div>
        )}

      </div>

      {/* Visual Capacity Meter Bar for Cloud Limit Context */}
      <div className="space-y-1">
        <div className="h-1.5 w-full bg-slate-200/80 dark:bg-slate-700/60 rounded-full overflow-hidden flex">
          <div
            className={`h-full transition-all duration-300 rounded-full ${
              isOverLimit
                ? 'bg-rose-500 dark:bg-rose-400'
                : isNearLimit
                ? 'bg-amber-500 dark:bg-amber-400'
                : 'bg-indigo-500 dark:bg-indigo-400'
            }`}
            style={{ width: `${usagePercentage}%` }}
          />
        </div>

        {/* Contextual Warning & Guidance Alert */}
        {isOverLimit ? (
          <div className="flex items-start gap-1.5 text-[11px] text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 px-2.5 py-1.5 rounded-lg border border-rose-200 dark:border-rose-900/60">
            <AlertCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">Exceeds typical Cloud synthesis limit (5,000 characters).</span>
              <span className="ml-1 opacity-90">
                Text length is not restricted — Free Browser Speech will automatically handle your entire document with continuous sentence queueing and zero quota limits.
              </span>
            </div>
          </div>
        ) : isNearLimit ? (
          <div className="flex items-start gap-1.5 text-[11px] text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1.5 rounded-lg border border-amber-200 dark:border-amber-900/60">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">Approaching typical Cloud API limit ({currentChars.toLocaleString()} / {cloudCharLimit.toLocaleString()} chars).</span>
              <span className="ml-1 opacity-90">
                For longer texts or articles, Native Browser Speech provides unlimited conversion without hitting API rate limits.
              </span>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 pt-0.5">
            <span className="flex items-center gap-1">
              <Info className="w-3 h-3 text-slate-400" />
              <span>Cloud limit: ~{cloudCharLimit.toLocaleString()} chars per request • Native Browser: Unlimited</span>
            </span>
            <span>{usagePercentage}% of cloud capacity</span>
          </div>
        )}
      </div>
    </div>
  );
};
