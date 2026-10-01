import React from 'react';
import { X, Check, FileText, Clock } from 'lucide-react';
import { cleanHindiText, formatTime } from '../utils/hindiUtils';

interface TextPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  rawText: string;
  speed: number;
}

export const TextPreviewModal: React.FC<TextPreviewModalProps> = ({
  isOpen,
  onClose,
  rawText,
  speed,
}) => {
  if (!isOpen) return null;

  const cleanedText = cleanHindiText(rawText);
  const words = cleanedText ? cleanedText.split(/\s+/).filter(Boolean).length : 0;
  const chars = cleanedText.length;
  // Estimate ~130 words per minute at 1.0x
  const estimatedSeconds = Math.max(1, (words / 130) * 60 / speed);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white">
                Text Preview & Cleaned Output
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Shows normalized Hindi text ready for speech synthesis
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stats bar */}
        <div className="px-6 py-2.5 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between text-xs text-slate-600 dark:text-slate-300 gap-3">
          <div className="flex items-center gap-4">
            <span>
              Characters: <strong>{chars}</strong>
            </span>
            <span>
              Words: <strong>{words}</strong>
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-medium">
            <Clock className="w-3.5 h-3.5" />
            <span>Estimated Duration: ~{formatTime(estimatedSeconds)}</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {cleanedText ? (
            <div className="font-hindi text-base sm:text-lg leading-relaxed text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-950/60 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 whitespace-pre-wrap select-text">
              {cleanedText}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400 dark:text-slate-500 text-sm">
              No text to preview. Please enter Hindi text in the editor.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm flex items-center gap-2"
          >
            <Check className="w-4 h-4" />
            <span>Done</span>
          </button>
        </div>

      </div>
    </div>
  );
};
