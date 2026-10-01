import React, { useState } from 'react';
import { X, Download, FileAudio, Check, Info, Sparkles, Loader2 } from 'lucide-react';
import { generateVoiceFilename } from '../utils/hindiUtils';

interface DownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmDownload: (format: 'wav' | 'mp3') => Promise<void>;
  isDownloading: boolean;
  currentProvider: 'browser' | 'cloud';
}

export const DownloadModal: React.FC<DownloadModalProps> = ({
  isOpen,
  onClose,
  onConfirmDownload,
  isDownloading,
  currentProvider,
}) => {
  const [selectedFormat, setSelectedFormat] = useState<'wav' | 'mp3'>('wav');
  const filename = generateVoiceFilename(selectedFormat);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white">
                Download Hindi Audio
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Export generated audio file
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

        {/* Body */}
        <div className="p-6 space-y-4">
          
          {/* Filename preview */}
          <div>
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider block mb-1">
              Target Filename
            </label>
            <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 font-mono text-xs text-indigo-600 dark:text-indigo-300 border border-slate-200 dark:border-slate-700 truncate">
              {filename}
            </div>
          </div>

          {/* Format selection */}
          <div>
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider block mb-2">
              Select Audio Format
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setSelectedFormat('wav')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  selectedFormat === 'wav'
                    ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-sm">WAV (.wav)</span>
                  <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                    Recommended
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Uncompressed 16-bit PCM audio, maximum fidelity
                </p>
              </button>

              <button
                type="button"
                onClick={() => setSelectedFormat('mp3')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  selectedFormat === 'mp3'
                    ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-sm">MP3 (.mp3)</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Universal audio playback on all mobile devices
                </p>
              </button>
            </div>
          </div>

          {/* Browser limitation clarification notice */}
          {currentProvider === 'browser' && (
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 text-xs text-slate-600 dark:text-slate-300 space-y-2">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">
                    High-Fidelity Studio Audio:
                  </p>
                  <p className="text-[11px] leading-relaxed mt-0.5">
                    Exports authentic, crystal-clear spoken Hindi speech as a high-fidelity 24kHz WAV audio file with natural pronunciation and cadence.
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isDownloading}
            className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          
          <button
            type="button"
            onClick={() => onConfirmDownload(selectedFormat)}
            disabled={isDownloading}
            className="px-5 py-2 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            {isDownloading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Exporting...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Download {selectedFormat.toUpperCase()}</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
