/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Volume2,
  Sparkles,
  Play,
  RotateCcw,
  Square,
  Keyboard,
  Info,
  Sliders,
  FileAudio,
  Radio,
  Download,
  AlertCircle,
} from 'lucide-react';
import { Header } from './components/Header';
import { TextEditor } from './components/TextEditor';
import { VoiceSelector } from './components/VoiceSelector';
import { VoiceSettings } from './components/VoiceSettings';
import { AudioPlayer } from './components/AudioPlayer';
import { RecentHistory } from './components/RecentHistory';
import { PrivacyNotice } from './components/PrivacyNotice';
import { ErrorMessage } from './components/ErrorMessage';
import { DownloadModal } from './components/DownloadModal';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal';
import { ttsManager } from './services/tts/TTSManager';
import {
  TTSSettings,
  TTSVoice,
  PlaybackState,
  HistoryItem,
  ProviderType,
} from './types/tts';
import {
  detectHindi,
  cleanHindiText,
  generateVoiceFilename,
} from './utils/hindiUtils';

const DEFAULT_SAMPLE = 'नमस्ते! आपका स्वागत है। आज हम एक नई कहानी के बारे में जानेंगे।';

export default function App() {
  // Theme state
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('hindi_tts_theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  });

  // Text editor state
  const [text, setText] = useState<string>(DEFAULT_SAMPLE);

  // Settings state
  const [settings, setSettings] = useState<TTSSettings>(() => {
    const saved = localStorage.getItem('hindi_tts_settings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return {
      language: 'hi-IN',
      voiceId: '',
      speed: 1.0,
      pitch: 1.0,
      volume: 100,
      provider: 'browser',
    };
  });

  // Voices & Provider state
  const [voices, setVoices] = useState<TTSVoice[]>([]);
  const [hasNativeHindi, setHasNativeHindi] = useState<boolean>(true);
  const [cloudAvailable, setCloudAvailable] = useState<boolean>(false);

  // Playback state
  const [playbackState, setPlaybackState] = useState<PlaybackState>({
    isPlaying: false,
    isPaused: false,
    isGenerating: false,
    currentTime: 0,
    duration: 0,
    currentWordIndex: -1,
    currentWord: '',
  });

  const [hasGenerated, setHasGenerated] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<'error' | 'warning' | 'info'>('error');
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  // Modals
  const [showDownloadModal, setShowDownloadModal] = useState<boolean>(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState<boolean>(false);

  // History state
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    const saved = localStorage.getItem('hindi_tts_history');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return [];
  });

  // Sync theme to document element
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('hindi_tts_theme', theme);
  }, [theme]);

  // Persist settings
  useEffect(() => {
    localStorage.setItem('hindi_tts_settings', JSON.stringify(settings));
  }, [settings]);

  // Persist history
  useEffect(() => {
    localStorage.setItem('hindi_tts_history', JSON.stringify(history));
  }, [history]);

  // Initialize TTS Manager & voices
  useEffect(() => {
    let mounted = true;

    async function initTTS() {
      const initResult = await ttsManager.initialize();
      if (!mounted) return;
      setCloudAvailable(initResult.cloudAvailable);

      const voiceData = await ttsManager.getVoices();
      if (!mounted) return;

      setHasNativeHindi(voiceData.hasNativeHindi);

      const combinedVoices = [
        ...voiceData.browserVoices,
        ...voiceData.cloudVoices,
      ];
      setVoices(combinedVoices);

      // Select default voice if not selected
      if (!settings.voiceId && combinedVoices.length > 0) {
        const defaultVoice =
          combinedVoices.find((v) => v.isDefault) || combinedVoices[0];
        setSettings((prev) => ({
          ...prev,
          voiceId: defaultVoice.id,
        }));
      }

      if (!initResult.browserSupported) {
        setErrorMessage(
          'Web Speech API is not supported in this browser. Please use Chrome, Edge, Safari, or switch to Neural Studio.'
        );
        setErrorType('warning');
      }
    }

    initTTS();

    // Re-check voices on Chrome voiceschanged
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = () => {
        if (mounted) initTTS();
      };
    }

    return () => {
      mounted = false;
      ttsManager.stop();
    };
  }, []);

  // Set provider handler
  const handleSelectProvider = (providerType: ProviderType) => {
    ttsManager.stop();
    ttsManager.setProvider(providerType);
    setSettings((prev) => {
      // Pick appropriate voice for this provider
      const providerVoice = voices.find((v) => v.provider === providerType);
      return {
        ...prev,
        provider: providerType,
        voiceId: providerVoice ? providerVoice.id : prev.voiceId,
      };
    });
  };

  // Preview Voice handler
  const handlePreviewVoice = async (voiceId: string) => {
    try {
      setErrorMessage(null);
      await ttsManager.previewVoice(
        voiceId,
        settings.speed,
        settings.pitch,
        settings.volume
      );
    } catch (err: any) {
      setErrorMessage(err?.message || 'Voice preview failed.');
      setErrorType('warning');
    }
  };

  // Generate / Play Speech
  const handleGenerateVoice = async () => {
    setErrorMessage(null);

    // 1. Validate entered text
    const trimmed = text.trim();
    if (!trimmed) {
      setErrorMessage('Please enter some Hindi text first.');
      setErrorType('error');
      return;
    }

    // 2. Detect Hindi
    const detection = detectHindi(trimmed);
    if (!detection.hasHindi) {
      setErrorMessage(
        'The text entered appears to have no Hindi Devanagari characters. For authentic Hindi pronunciation, use Hindi text.'
      );
      setErrorType('warning');
    }

    // 3. Mark generating state
    setPlaybackState((prev) => ({
      ...prev,
      isGenerating: true,
      isPlaying: false,
      isPaused: false,
      currentTime: 0,
    }));

    try {
      ttsManager.setProvider(settings.provider);

      await ttsManager.speak({
        text: trimmed,
        settings,
        onStart: () => {
          setHasGenerated(true);
          setPlaybackState((prev) => ({
            ...prev,
            isPlaying: true,
            isPaused: false,
            isGenerating: false,
          }));
        },
        onPause: () => {
          setPlaybackState((prev) => ({
            ...prev,
            isPlaying: false,
            isPaused: true,
          }));
        },
        onResume: () => {
          setPlaybackState((prev) => ({
            ...prev,
            isPlaying: true,
            isPaused: false,
          }));
        },
        onEnd: () => {
          setPlaybackState((prev) => ({
            ...prev,
            isPlaying: false,
            isPaused: false,
            currentWord: '',
          }));
        },
        onProgress: (current, duration) => {
          setPlaybackState((prev) => ({
            ...prev,
            currentTime: current,
            duration: Math.max(prev.duration, duration),
          }));
        },
        onBoundary: (_charIndex, _charLength, word) => {
          setPlaybackState((prev) => ({
            ...prev,
            currentWord: word,
          }));
        },
        onError: (err) => {
          setPlaybackState((prev) => ({
            ...prev,
            isPlaying: false,
            isPaused: false,
            isGenerating: false,
          }));
          setErrorMessage(err.message || 'Error occurred during speech synthesis.');
          setErrorType('error');
        },
      });

      // Save to recent history
      const selectedVoice = voices.find((v) => v.id === settings.voiceId);
      const newItem: HistoryItem = {
        id: Date.now().toString(),
        text: trimmed,
        timestamp: Date.now(),
        voiceName: selectedVoice?.name || 'Hindi Voice',
        speed: settings.speed,
        pitch: settings.pitch,
        provider: settings.provider,
      };

      setHistory((prev) => {
        // Keep unique by text & max 15 items
        const filtered = prev.filter((item) => item.text !== trimmed);
        return [newItem, ...filtered].slice(0, 15);
      });
    } catch (err: any) {
      setPlaybackState((prev) => ({
        ...prev,
        isGenerating: false,
        isPlaying: false,
      }));
      setErrorMessage(
        err?.message || 'Could not generate speech. Please check your browser voice settings.'
      );
      setErrorType('error');
    }
  };

  // Playback controls
  const handlePause = () => {
    ttsManager.pause();
    setPlaybackState((prev) => ({ ...prev, isPlaying: false, isPaused: true }));
  };

  const handleResume = () => {
    ttsManager.resume();
    setPlaybackState((prev) => ({ ...prev, isPlaying: true, isPaused: false }));
  };

  const handleStop = () => {
    ttsManager.stop();
    setPlaybackState((prev) => ({
      ...prev,
      isPlaying: false,
      isPaused: false,
      currentTime: 0,
      currentWord: '',
    }));
  };

  const handleReplay = async () => {
    handleStop();
    await handleGenerateVoice();
  };

  // Download Trigger
  const handleDownload = async (format: 'wav' | 'mp3' = 'wav') => {
    if (!text.trim()) {
      setErrorMessage('Please enter text first to export audio.');
      setErrorType('error');
      return;
    }

    setIsDownloading(true);
    setErrorMessage(null);

    try {
      const result = await ttsManager.downloadAudio(text.trim(), settings);
      setDownloadSuccess(result.filename);
      setTimeout(() => setDownloadSuccess(null), 4000);
      setShowDownloadModal(false);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to download audio file.');
      setErrorType('error');
    } finally {
      setIsDownloading(false);
    }
  };

  // Reset voice settings to defaults
  const handleResetSettings = () => {
    setSettings((prev) => ({
      ...prev,
      speed: 1.0,
      pitch: 1.0,
      volume: 100,
    }));
  };

  // Keyboard shortcuts listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is inside inputs other than global shortcuts
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleGenerateVoice();
        return;
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        handleStop();
        return;
      }

      // Space to toggle play/pause only when not typing inside textarea or input
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      if (e.key === ' ' && !isInput && hasGenerated) {
        e.preventDefault();
        if (playbackState.isPlaying) {
          handlePause();
        } else {
          handleResume();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [text, settings, playbackState.isPlaying, hasGenerated]);

  return (
    <div className="min-h-screen flex flex-col font-sans transition-colors duration-200">
      
      {/* App Header */}
      <Header
        theme={theme}
        onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        activeProvider={settings.provider}
        cloudAvailable={cloudAvailable}
        onSelectProvider={handleSelectProvider}
      />

      {/* Main Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Error / Notification Banner */}
        <ErrorMessage
          message={errorMessage}
          type={errorType}
          onDismiss={() => setErrorMessage(null)}
          actionText={
            errorType === 'warning' && !hasNativeHindi
              ? 'Try Neural Studio Voice'
              : undefined
          }
          onAction={() => handleSelectProvider('cloud')}
        />

        {/* Studio Grid: Left (Text Editor + Controls), Right (Voice Settings + History) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column (8 cols): Text Editor, Primary Action & Audio Player */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-6">
            
            {/* Text Editor Card */}
            <TextEditor
              text={text}
              onChange={setText}
              speed={settings.speed}
              onClear={() => {
                setText('');
                handleStop();
              }}
            />

            {/* Large Primary Generate Voice Button */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <button
                type="button"
                onClick={handleGenerateVoice}
                disabled={playbackState.isGenerating}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-600 to-purple-600 hover:from-indigo-700 hover:via-indigo-700 hover:to-purple-700 text-white font-bold text-base sm:text-lg shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-3 transition-all transform active:scale-[0.99] disabled:opacity-60 cursor-pointer"
              >
                {playbackState.isGenerating ? (
                  <>
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Generating voice...</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-6 h-6 animate-pulse" />
                    <span>🔊 Generate Voice</span>
                  </>
                )}
              </button>

              {/* Quick shortcut indicator */}
              <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500 shrink-0">
                <kbd className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-[11px]">
                  Ctrl+Enter
                </kbd>
                <span>to generate</span>
              </div>
            </div>

            {/* Audio Player Card (Displayed once generated or when text exists) */}
            {(hasGenerated || playbackState.isPlaying || playbackState.isPaused) && (
              <div className="animate-fadeIn">
                <AudioPlayer
                  playbackState={playbackState}
                  settings={settings}
                  text={text}
                  onPlay={handleGenerateVoice}
                  onPause={handlePause}
                  onResume={handleResume}
                  onStop={handleStop}
                  onReplay={handleReplay}
                  onDownload={() => setShowDownloadModal(true)}
                  onSpeedChange={(speed) => setSettings((s) => ({ ...s, speed }))}
                  onVolumeChange={(volume) => setSettings((s) => ({ ...s, volume }))}
                  isDownloading={isDownloading}
                  downloadSuccess={downloadSuccess}
                  currentWord={playbackState.currentWord}
                />
              </div>
            )}

            {/* Privacy Card */}
            <PrivacyNotice />

          </div>

          {/* Right Column (5 cols / 4 cols): Voice Selection & Settings Panel */}
          <div className="lg:col-span-5 xl:col-span-4 space-y-6">
            
            {/* Voice & Settings Card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-5">
              
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-indigo-500" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    आवाज़ चयन (Voice Selection)
                  </h3>
                </div>
                
                {/* Keyboard shortcut trigger */}
                <button
                  type="button"
                  onClick={() => setShowShortcutsModal(true)}
                  className="p-1 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="Keyboard shortcuts guide"
                >
                  <Keyboard className="w-4 h-4" />
                </button>
              </div>

              {/* Voice Selector */}
              <VoiceSelector
                voices={voices}
                selectedVoiceId={settings.voiceId}
                onSelectVoice={(voiceId) => {
                  setSettings((prev) => ({ ...prev, voiceId }));
                  // Auto-switch provider if selecting cloud vs browser voice
                  const v = voices.find((item) => item.id === voiceId);
                  if (v && v.provider !== settings.provider) {
                    handleSelectProvider(v.provider);
                  }
                }}
                onPreviewVoice={handlePreviewVoice}
                hasNativeHindi={hasNativeHindi}
                language={settings.language}
              />

              {/* Sliders for Speed, Pitch, Volume */}
              <VoiceSettings
                settings={settings}
                onChange={setSettings}
                onReset={handleResetSettings}
              />

            </div>

            {/* Recent History */}
            <RecentHistory
              history={history}
              onSelect={(item) => {
                setText(item.text);
                setSettings((prev) => ({
                  ...prev,
                  speed: item.speed || 1.0,
                  pitch: item.pitch || 1.0,
                  provider: item.provider || prev.provider,
                }));
              }}
              onClear={() => setHistory([])}
              onDeleteOne={(id) =>
                setHistory((prev) => prev.filter((item) => item.id !== id))
              }
            />

          </div>

        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 py-4 mt-8 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
          <p>
            <strong>Hindi Voice Studio</strong> • Free Text to Speech for Hindi (हिन्दी)
          </p>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setShowShortcutsModal(true)}
              className="hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1"
            >
              <Keyboard className="w-3.5 h-3.5" />
              <span>Shortcuts</span>
            </button>
            <span>•</span>
            <span>Local & Private</span>
          </div>
        </div>
      </footer>

      {/* Download Dialog Modal */}
      <DownloadModal
        isOpen={showDownloadModal}
        onClose={() => setShowDownloadModal(false)}
        onConfirmDownload={handleDownload}
        isDownloading={isDownloading}
        currentProvider={settings.provider}
      />

      {/* Keyboard Shortcuts Modal */}
      <KeyboardShortcutsModal
        isOpen={showShortcutsModal}
        onClose={() => setShowShortcutsModal(false)}
      />

    </div>
  );
}
