import React from 'react';
import { Gauge, Music, Volume2, RotateCcw } from 'lucide-react';
import { TTSSettings } from '../types/tts';

interface VoiceSettingsProps {
  settings: TTSSettings;
  onChange: (settings: TTSSettings) => void;
  onReset: () => void;
}

export const VoiceSettings: React.FC<VoiceSettingsProps> = ({
  settings,
  onChange,
  onReset,
}) => {
  const handleSpeedChange = (speed: number) => {
    onChange({ ...settings, speed });
  };

  const handlePitchChange = (pitch: number) => {
    onChange({ ...settings, pitch });
  };

  const handleVolumeChange = (volume: number) => {
    onChange({ ...settings, volume });
  };

  return (
    <div className="space-y-5 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            ध्वनि नियंत्रण (Voice Settings)
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Speed, pitch, and output volume
          </p>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium py-1 px-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Reset to default settings (1.0x speed, 1.0 pitch, 100% volume)"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset</span>
        </button>
      </div>

      {/* Speaking Speed Slider */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
            <Gauge className="w-3.5 h-3.5 text-indigo-500" />
            <span>Speaking Speed (गति)</span>
          </div>
          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-800/50">
            {settings.speed.toFixed(2)}x
          </span>
        </div>

        <input
          type="range"
          min="0.5"
          max="2.0"
          step="0.05"
          value={settings.speed}
          onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
          className="w-full accent-indigo-600 cursor-pointer h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none"
        />

        <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 mt-1">
          <span>0.5x (Slow)</span>
          <div className="flex items-center gap-1">
            {[0.75, 1.0, 1.25, 1.5].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => handleSpeedChange(preset)}
                className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition-colors ${
                  Math.abs(settings.speed - preset) < 0.01
                    ? 'bg-indigo-600 text-white font-bold'
                    : 'hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500'
                }`}
              >
                {preset}x
              </button>
            ))}
          </div>
          <span>2.0x (Fast)</span>
        </div>
      </div>

      {/* Pitch Slider */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
            <Music className="w-3.5 h-3.5 text-purple-500" />
            <span>Pitch (स्वर का स्तर)</span>
          </div>
          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200/50 dark:border-purple-800/50">
            {settings.pitch.toFixed(2)}
          </span>
        </div>

        <input
          type="range"
          min="0.5"
          max="2.0"
          step="0.05"
          value={settings.pitch}
          onChange={(e) => handlePitchChange(parseFloat(e.target.value))}
          className="w-full accent-purple-600 cursor-pointer h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none"
        />

        <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 mt-1">
          <span>0.5 (Deep)</span>
          <div className="flex items-center gap-1">
            {[0.8, 1.0, 1.2, 1.4].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => handlePitchChange(preset)}
                className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition-colors ${
                  Math.abs(settings.pitch - preset) < 0.01
                    ? 'bg-purple-600 text-white font-bold'
                    : 'hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500'
                }`}
              >
                {preset.toFixed(1)}
              </button>
            ))}
          </div>
          <span>2.0 (High)</span>
        </div>
      </div>

      {/* Volume Slider */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
            <Volume2 className="w-3.5 h-3.5 text-blue-500" />
            <span>Volume (ध्वनि)</span>
          </div>
          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/50 dark:border-blue-800/50">
            {Math.round(settings.volume)}%
          </span>
        </div>

        <input
          type="range"
          min="0"
          max="100"
          step="1"
          value={settings.volume}
          onChange={(e) => handleVolumeChange(parseInt(e.target.value, 10))}
          className="w-full accent-blue-600 cursor-pointer h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none"
        />

        <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 mt-1">
          <span>0% (Mute)</span>
          <span>50%</span>
          <span>100% (Max)</span>
        </div>
      </div>

    </div>
  );
};
