import React, { useState } from 'react';
import {
  Play,
  Pause,
  Square,
  RotateCcw,
  Volume2,
  VolumeX,
  Download,
  Loader2,
  Sparkles,
  Info,
  Check,
} from 'lucide-react';
import { PlaybackState, TTSSettings } from '../types/tts';
import { formatTime } from '../utils/hindiUtils';

interface AudioPlayerProps {
  playbackState: PlaybackState;
  settings: TTSSettings;
  text: string;
  onPlay: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onReplay: () => void;
  onDownload: () => Promise<void> | void;
  onSpeedChange: (speed: number) => void;
  onVolumeChange: (volume: number) => void;
  isDownloading?: boolean;
  downloadSuccess?: string | null;
  currentWord?: string;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  playbackState,
  settings,
  text,
  onPlay,
  onPause,
  onResume,
  onStop,
  onReplay,
  onDownload,
  onSpeedChange,
  onVolumeChange,
  isDownloading = false,
  downloadSuccess = null,
  currentWord = '',
}) => {
  const [isMuted, setIsMuted] = useState(false);
  const [prevVolume, setPrevVolume] = useState(settings.volume);
  const [showDownloadInfo, setShowDownloadInfo] = useState(false);

  const { isPlaying, isPaused, currentTime, duration, isGenerating } = playbackState;

  // Toggle Mute
  const handleToggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      onVolumeChange(prevVolume || 100);
    } else {
      setPrevVolume(settings.volume);
      setIsMuted(true);
      onVolumeChange(0);
    }
  };

  const progressPercent = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  return (
    <div className="bg-gradient-to-b from-white to-slate-50 dark:from-slate-900 dark:to-slate-950/80 rounded-2xl border border-indigo-100 dark:border-indigo-950/60 p-5 sm:p-6 shadow-md shadow-indigo-500/5 transition-all">
      
      {/* Top Bar: Title & Status */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center">
            <span className={`w-3.5 h-3.5 rounded-full ${isPlaying ? 'bg-emerald-500 animate-ping absolute' : ''}`} />
            <span className={`w-3.5 h-3.5 rounded-full ${isPlaying ? 'bg-emerald-500' : isPaused ? 'bg-amber-500' : 'bg-slate-400'}`} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Hindi Speech Player</span>
              <span className="text-[11px] font-normal px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {settings.provider === 'cloud' ? '✨ Neural Cloud' : '🎙️ Native Browser'}
              </span>
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isPlaying
                ? 'Playing generated speech...'
                : isPaused
                ? 'Playback paused'
                : 'Ready for playback'}
            </p>
          </div>
        </div>

        {/* Live Audio Visualizer Bars */}
        <div className="flex items-end gap-1 h-6 px-3 py-1 bg-slate-100 dark:bg-slate-800/80 rounded-lg">
          {[40, 70, 90, 60, 100, 50, 80, 45, 95, 65].map((height, idx) => (
            <span
              key={idx}
              className={`w-1 rounded-full transition-all duration-150 ${
                isPlaying
                  ? 'bg-gradient-to-t from-indigo-500 to-purple-500 animate-pulse'
                  : 'bg-slate-300 dark:bg-slate-700'
              }`}
              style={{
                height: isPlaying ? `${Math.max(20, (height * (idx % 2 === 0 ? 1 : 0.7)))}%` : '20%',
                animationDelay: `${idx * 0.08}s`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Progress Bar & Timers */}
      <div className="my-5">
        <div className="w-full bg-slate-200 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden relative cursor-default">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 rounded-full transition-all duration-150"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="flex justify-between items-center text-xs font-mono font-medium text-slate-500 dark:text-slate-400 mt-1.5">
          <span>{formatTime(currentTime)}</span>
          <span className="text-[11px] text-slate-400">
            {progressPercent.toFixed(0)}%
          </span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Word Karaoke Tracker (Shows current word being spoken) */}
      {currentWord && isPlaying && (
        <div className="mb-4 px-3 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-900/60 text-xs flex items-center justify-between">
          <span className="text-slate-500 dark:text-slate-400">Current Spoken Word:</span>
          <span className="font-hindi font-bold text-indigo-700 dark:text-indigo-300 text-sm tracking-wide bg-indigo-200/50 dark:bg-indigo-900 px-2 py-0.5 rounded-md">
            {currentWord}
          </span>
        </div>
      )}

      {/* Main Control Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        
        {/* Playback action buttons */}
        <div className="flex items-center gap-2">
          
          {/* Play / Pause Primary Button */}
          {!isPlaying ? (
            <button
              type="button"
              onClick={isPaused ? onResume : onPlay}
              disabled={isGenerating}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold text-sm shadow-md shadow-indigo-500/25 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>{isPaused ? 'Resume' : '▶ Play'}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onPause}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-sm shadow-md shadow-amber-500/25 flex items-center gap-2 transition-all active:scale-95"
            >
              <Pause className="w-4 h-4 fill-white" />
              <span>Pause</span>
            </button>
          )}

          {/* Stop Button */}
          <button
            type="button"
            onClick={onStop}
            disabled={!isPlaying && !isPaused}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            title="Stop playback"
          >
            <Square className="w-4 h-4 fill-current" />
          </button>

          {/* Replay Button */}
          <button
            type="button"
            onClick={onReplay}
            disabled={isGenerating}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            title="Replay from beginning"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Playback speed buttons */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          {[0.75, 1.0, 1.25, 1.5, 2.0].map((rate) => (
            <button
              key={rate}
              type="button"
              onClick={() => onSpeedChange(rate)}
              className={`px-2 py-1 rounded-lg text-xs font-mono font-medium transition-colors ${
                Math.abs(settings.speed - rate) < 0.01
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {rate}x
            </button>
          ))}
        </div>

        {/* Volume & Download Section */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          
          {/* Mini Volume Slider */}
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
            <button
              type="button"
              onClick={handleToggleMute}
              className="p-1.5 hover:text-slate-900 dark:hover:text-white"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted || settings.volume === 0 ? (
                <VolumeX className="w-4 h-4 text-rose-500" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="100"
              value={isMuted ? 0 : settings.volume}
              onChange={(e) => {
                if (isMuted) setIsMuted(false);
                onVolumeChange(parseInt(e.target.value, 10));
              }}
              className="w-16 sm:w-20 accent-indigo-600 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Download Audio Button */}
          <div className="relative">
            <button
              type="button"
              onClick={onDownload}
              disabled={isDownloading || !text.trim()}
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white font-semibold text-xs sm:text-sm flex items-center gap-2 shadow-sm transition-all active:scale-95 disabled:opacity-50"
              title="Download audio as WAV (hindi-voice-YYYY-MM-DD-HH-MM.wav)"
            >
              {isDownloading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Preparing WAV...</span>
                </>
              ) : downloadSuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Downloaded!</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>⬇ Download Audio</span>
                </>
              )}
            </button>
          </div>

        </div>

      </div>

      {/* Browser speech download info notice */}
      {settings.provider === 'browser' && (
        <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-800/60 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
            <span>
              Exporting audio uses high-fidelity WAV synthesis with filename format <code className="font-mono text-indigo-600 dark:text-indigo-400">hindi-voice-YYYY-MM-DD-HH-MM.wav</code>
            </span>
          </span>
        </div>
      )}

    </div>
  );
};
