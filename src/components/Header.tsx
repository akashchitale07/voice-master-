import React from 'react';
import { Volume2, Sun, Moon, ShieldCheck, Sparkles, Radio } from 'lucide-react';
import { ProviderType } from '../types/tts';

interface HeaderProps {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  activeProvider: ProviderType;
  cloudAvailable: boolean;
  onSelectProvider: (provider: ProviderType) => void;
}

export const Header: React.FC<HeaderProps> = ({
  theme,
  onToggleTheme,
  activeProvider,
  cloudAvailable,
  onSelectProvider,
}) => {
  return (
    <header className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-40 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex items-center justify-between gap-4">
          
          {/* Logo & Titles */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 ring-2 ring-indigo-500/30">
              <Volume2 className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Hindi Voice Studio
                </h1>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300/40 dark:border-emerald-800/50">
                  FREE TEXT TO SPEECH
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Convert Hindi text into natural-sounding speech
              </p>
            </div>
          </div>

          {/* Right Controls: Provider Switch, Privacy, Theme */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Engine Selector */}
            <div className="hidden md:flex items-center bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
              <button
                type="button"
                onClick={() => onSelectProvider('browser')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                  activeProvider === 'browser'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
                title="Free native browser speech engine (100% offline & local)"
              >
                <Radio className="w-3.5 h-3.5" />
                <span>Browser TTS (Free)</span>
              </button>
              
              <button
                type="button"
                onClick={() => onSelectProvider('cloud')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                  activeProvider === 'cloud'
                    ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
                title={cloudAvailable ? 'High-fidelity Neural Cloud Voices with direct WAV export' : 'Requires Cloud TTS config'}
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                <span>Neural Studio</span>
                {cloudAvailable ? (
                  <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20" />
                ) : (
                  <span className="text-[10px] uppercase font-bold text-amber-500 ml-0.5">WAV</span>
                )}
              </button>
            </div>

            {/* Privacy indicator */}
            <div
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] text-slate-600 dark:text-slate-300 font-medium"
              title="Your text stays in your browser during browser speech synthesis"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>100% Private</span>
            </div>

            {/* Theme Toggle */}
            <button
              type="button"
              onClick={onToggleTheme}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-300 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
              aria-label="Toggle theme"
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-600" />
              )}
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
