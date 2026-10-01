import { TTSVoice, TTSSettings } from '../../types/tts';

export interface SpeakOptions {
  text: string;
  settings: TTSSettings;
  onStart?: () => void;
  onPause?: () => void;
  onResume?: () => void;
  onEnd?: () => void;
  onError?: (error: Error) => void;
  onBoundary?: (charIndex: number, charLength: number, word: string) => void;
  onProgress?: (currentTime: number, duration: number) => void;
}

export interface ITTSProvider {
  readonly id: 'browser' | 'cloud';
  readonly name: string;
  isSupported(): boolean;
  getVoices(): Promise<TTSVoice[]>;
  speak(options: SpeakOptions): Promise<void>;
  pause(): void;
  resume(): void;
  stop(): void;
  replay(options: SpeakOptions): Promise<void>;
  generateAudioFile?(text: string, settings: TTSSettings): Promise<{ blob: Blob; mimeType: string }>;
}
