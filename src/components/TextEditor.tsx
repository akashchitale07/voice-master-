import React, { useState } from 'react';
import {
  Trash2,
  ClipboardPaste,
  Sparkles,
  Scissors,
  Eye,
  Check,
  ChevronDown,
} from 'lucide-react';
import { CharacterCounter } from './CharacterCounter';
import { detectHindi, cleanHindiText, getStats, HINDI_SAMPLES } from '../utils/hindiUtils';
import { TextPreviewModal } from './TextPreviewModal';

interface TextEditorProps {
  text: string;
  onChange: (value: string) => void;
  speed: number;
  onClear: () => void;
  provider?: 'browser' | 'cloud';
  cloudCharLimit?: number;
}

export const TextEditor: React.FC<TextEditorProps> = ({
  text,
  onChange,
  speed,
  onClear,
  provider = 'browser',
  cloudCharLimit = 5000,
}) => {
  const [showPreview, setShowPreview] = useState(false);
  const [showSampleMenu, setShowSampleMenu] = useState(false);
  const [copiedNotification, setCopiedNotification] = useState<string | null>(null);

  const stats = getStats(text);
  const hindiDetection = detectHindi(text);

  const handlePaste = async () => {
    try {
      const clipText = await navigator.clipboard.readText();
      if (clipText) {
        onChange(clipText);
        showToast('Pasted from clipboard');
      }
    } catch {
      // In case permissions are blocked
      showToast('Clipboard access was blocked by browser. Please press Ctrl+V to paste.');
    }
  };

  const handleRemoveExtraSpaces = () => {
    if (!text.trim()) return;
    const cleaned = cleanHindiText(text);
    onChange(cleaned);
    showToast('Extra spaces cleaned');
  };

  const handleLoadSample = (sampleText: string) => {
    onChange(sampleText);
    setShowSampleMenu(false);
    showToast('Sample text inserted');
  };

  const showToast = (msg: string) => {
    setCopiedNotification(msg);
    setTimeout(() => setCopiedNotification(null), 2500);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col transition-all focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500/40">
      
      {/* Top Toolbar / Text Tools */}
      <div className="px-4 py-2.5 bg-slate-50/80 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          हिंदी टेक्स्ट (Hindi Text)
        </span>

        {/* Action Buttons */}
        <div className="flex items-center flex-wrap gap-1.5 text-xs">
          
          {/* Sample Text Selector */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowSampleMenu(!showSampleMenu)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 font-medium transition-colors"
              title="Insert sample Hindi paragraph"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <span>Sample Text</span>
              <ChevronDown className="w-3 h-3 opacity-60" />
            </button>

            {showSampleMenu && (
              <div className="absolute left-0 sm:right-0 sm:left-auto top-full mt-1 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-30 py-1.5 animate-fadeIn">
                <div className="px-3 py-1 text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  Select Sample
                </div>
                {HINDI_SAMPLES.map((sample, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleLoadSample(sample.text)}
                    className="w-full text-left px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex flex-col"
                  >
                    <span className="font-semibold">{sample.title}</span>
                    <span className="text-[11px] text-slate-400 dark:text-slate-500 truncate">
                      {sample.text}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Paste */}
          <button
            type="button"
            onClick={handlePaste}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 font-medium transition-colors"
            title="Paste from clipboard"
          >
            <ClipboardPaste className="w-3.5 h-3.5" />
            <span>Paste</span>
          </button>

          {/* Remove Extra Spaces */}
          <button
            type="button"
            onClick={handleRemoveExtraSpaces}
            disabled={!text.trim()}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none font-medium transition-colors"
            title="Remove unnecessary extra spaces and blank lines"
          >
            <Scissors className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Remove Extra Spaces</span>
            <span className="sm:hidden">Clean</span>
          </button>

          {/* Text Preview */}
          <button
            type="button"
            onClick={() => setShowPreview(true)}
            disabled={!text.trim()}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none font-medium transition-colors"
            title="Show cleaned preview before speech synthesis"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Preview</span>
          </button>

          {/* Clear Text */}
          <button
            type="button"
            onClick={onClear}
            disabled={!text}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 disabled:opacity-40 disabled:pointer-events-none font-medium transition-colors"
            title="Clear all text"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>

        </div>
      </div>

      {/* Text Area */}
      <div className="relative p-4 flex-1 min-h-[220px] sm:min-h-[280px]">
        <textarea
          value={text}
          onChange={(e) => onChange(e.target.value)}
          placeholder="यहाँ अपना हिंदी टेक्स्ट लिखें या पेस्ट करें..."
          rows={10}
          className="w-full h-full bg-transparent resize-y outline-none font-hindi text-base sm:text-lg leading-relaxed text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600"
          aria-label="Hindi Text Input"
        />

        {/* Temporary toast alert inside editor */}
        {copiedNotification && (
          <div className="absolute bottom-4 right-4 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs px-3 py-1.5 rounded-lg shadow-lg flex items-center gap-1.5 animate-fadeIn">
            <Check className="w-3.5 h-3.5 text-emerald-400 dark:text-emerald-600" />
            <span>{copiedNotification}</span>
          </div>
        )}
      </div>

      {/* Bottom Counter Bar */}
      <div className="px-4 py-3 bg-slate-50/70 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800">
        <CharacterCounter
          currentChars={stats.chars}
          wordCount={stats.words}
          hindiPercentage={hindiDetection.hindiPercentage}
          cloudCharLimit={cloudCharLimit}
          provider={provider}
        />
      </div>

      {/* Text Preview Modal */}
      <TextPreviewModal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        rawText={text}
        speed={speed}
      />

    </div>
  );
};
