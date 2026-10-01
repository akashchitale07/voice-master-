export type ProviderType = 'browser' | 'cloud';

export interface TTSVoice {
  id: string;
  name: string;
  lang: string;
  gender?: 'female' | 'male' | 'neutral';
  isDefault?: boolean;
  provider: ProviderType;
  nativeVoice?: SpeechSynthesisVoice;
}

export interface TTSSettings {
  language: string;
  voiceId: string;
  speed: number; // 0.5 to 2.0
  pitch: number; // 0.5 to 2.0
  volume: number; // 0 to 100
  provider: ProviderType;
}

export interface PlaybackState {
  isPlaying: boolean;
  isPaused: boolean;
  isGenerating: boolean;
  currentTime: number;
  duration: number;
  currentWordIndex: number;
  currentWord: string;
}

export interface HistoryItem {
  id: string;
  text: string;
  timestamp: number;
  voiceName: string;
  speed: number;
  pitch: number;
  provider: ProviderType;
  audioBlobUrl?: string;
  duration?: number;
}

export interface AudioExportResult {
  blob: Blob;
  filename: string;
  format: 'wav' | 'mp3';
}
