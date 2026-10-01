import React from 'react';
import { Infinity } from 'lucide-react';

interface CharacterCounterProps {
  currentChars: number;
  wordCount: number;
  hindiPercentage: number;
}

export const CharacterCounter: React.FC<CharacterCounterProps> = ({
  currentChars,
  wordCount,
  hindiPercentage,
}) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
      
      {/* Counters */}
      <div className="flex items-center gap-3">
        <span className="font-mono font-medium text-slate-700 dark:text-slate-300">
          Characters: <strong>{currentChars.toLocaleString()}</strong>
        </span>

        <span className="text-slate-300 dark:text-slate-700">|</span>

        <span className="font-mono">
          Words: <strong className="text-slate-700 dark:text-slate-300">{wordCount.toLocaleString()}</strong>
        </span>

        <span className="text-slate-300 dark:text-slate-700">|</span>

        {/* Unlimited indicator badge */}
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
          <Infinity className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
          <span>Unlimited Words</span>
        </span>
      </div>

      {/* Script analysis indicator */}
      {currentChars > 0 && (
        <div className="flex items-center gap-1.5">
          <span
            className={`w-2 h-2 rounded-full ${
              hindiPercentage >= 50
                ? 'bg-emerald-500'
                : hindiPercentage > 0
                ? 'bg-amber-500'
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
                Non-Devanagari text detected
              </span>
            )}
          </span>
        </div>
      )}

    </div>
  );
};
