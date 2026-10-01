import React, { useState } from 'react';
import { Volume2, Play, Loader2, Globe, AlertCircle, Sparkles } from 'lucide-react';
import { TTSVoice } from '../types/tts';

interface VoiceSelectorProps {
  voices: TTSVoice[];
  selectedVoiceId: string;
  onSelectVoice: (voiceId: string) => void;
  onPreviewVoice: (voiceId: string) => Promise<void>;
  hasNativeHindi: boolean;
  language?: string;
  onLanguageChange?: (lang: string) => void;
}

export const VoiceSelector: React.FC<VoiceSelectorProps> = ({
  voices,
  selectedVoiceId,
  onSelectVoice,
  onPreviewVoice,
  hasNativeHindi,
  language = 'hi-IN',
}) => {
  const [isPreviewing, setIsPreviewing] = useState(false);

  const handlePreview = async () => {
    if (isPreviewing) return;
    setIsPreviewing(true);
    try {
      await onPreviewVoice(selectedVoiceId);
    } catch (e) {
      console.error('Preview error:', e);
    } finally {
      setIsPreviewing(false);
    }
  };

  // Group voices by provider or standard presets
  const browserVoices = voices.filter((v) => v.provider === 'browser');
  const cloudVoices = voices.filter((v) => v.provider === 'cloud');

  return (
    <div className="space-y-4">
      
      {/* Language row */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
          भाषा (Language)
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Globe className="w-4 h-4" />
          </div>
          <select
            value={language}
            disabled
            className="w-full pl-9 pr-8 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-800 dark:text-slate-200 cursor-not-allowed opacity-90"
            aria-label="Language selection"
          >
            <option value="hi-IN">Hindi (India) - हिन्दी (भारत)</option>
          </select>
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-xs text-slate-400">
            Default
          </div>
        </div>
      </div>

      {/* Voice Selection row */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            आवाज़ (Voice)
          </label>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            {voices.length} voice{voices.length === 1 ? '' : 's'} ready
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <select
              value={selectedVoiceId}
              onChange={(e) => onSelectVoice(e.target.value)}
              className="w-full py-2.5 px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-sm"
              aria-label="Voice selection"
            >
              {/* Browser Voices */}
              {browserVoices.length > 0 && (
                <optgroup label="Browser Hindi Voices (Free & Offline)">
                  {browserVoices.map((voice) => (
                    <option key={voice.id} value={voice.id}>
                      {voice.gender === 'female' ? '👩' : '👨'} {voice.name} {voice.isDefault ? '(Default)' : ''}
                    </option>
                  ))}
                </optgroup>
              )}

              {/* Neural Studio Voices (if available or for cloud mode) */}
              {cloudVoices.length > 0 && (
                <optgroup label="Neural Studio Voices (High-Fidelity WAV)">
                  {cloudVoices.map((voice) => (
                    <option key={voice.id} value={voice.id}>
                      ✨ {voice.name}
                    </option>
                  ))}
                </optgroup>
              )}

              {/* If no voices loaded at all, provide standard requested presets */}
              {voices.length === 0 && (
                <>
                  <option value="browser_preset_female">👩 Hindi Female (Browser Free)</option>
                  <option value="browser_preset_male">👨 Hindi Male (Browser Free)</option>
                  <option value="browser_preset_female_natural">✨ Hindi Female – Natural (Browser Free)</option>
                  <option value="browser_preset_male_natural">✨ Hindi Male – Natural (Browser Free)</option>
                </>
              )}
            </select>
          </div>

          {/* Voice Preview Button */}
          <button
            type="button"
            onClick={handlePreview}
            disabled={isPreviewing}
            className="px-3.5 py-2.5 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm shrink-0 cursor-pointer disabled:opacity-60"
            title='Listen to sample: "नमस्ते, यह हिंदी आवाज़ का परीक्षण है।"'
          >
            {isPreviewing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Playing...</span>
              </>
            ) : (
              <>
                <Volume2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Preview</span>
              </>
            )}
          </button>
        </div>

        {/* Warning if Hindi voice unavailable */}
        {!hasNativeHindi && browserVoices.length === 0 && (
          <div className="mt-2.5 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-200 leading-relaxed">
            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">
                No Hindi voice is available on this device/browser. Please install or enable a Hindi speech voice.
              </p>
              <p className="text-[11px] text-amber-700/80 dark:text-amber-300/80 mt-1">
                Tip: You can use our <strong>Neural Studio</strong> engine which provides natural Hindi speech on any device, or install the Hindi language pack in Windows / Android / macOS settings.
              </p>
            </div>
          </div>
        )}

      </div>

    </div>
  );
};
