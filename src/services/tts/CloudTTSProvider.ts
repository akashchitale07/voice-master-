import { TTSVoice, TTSSettings } from '../../types/tts';
import { ITTSProvider, SpeakOptions } from './TTSProvider';

export class CloudTTSProvider implements ITTSProvider {
  readonly id = 'cloud' as const;
  readonly name = 'Neural Studio Speech (High-Fidelity WAV)';

  private audioElement: HTMLAudioElement | null = null;
  private currentOptions: SpeakOptions | null = null;
  private cachedAudioUrl: string | null = null;
  private cachedBlob: Blob | null = null;
  private isAvailable: boolean | null = null;

  isSupported(): boolean {
    return typeof window !== 'undefined' && typeof fetch !== 'undefined';
  }

  async checkAvailability(): Promise<boolean> {
    if (this.isAvailable !== null) return this.isAvailable;
    try {
      const res = await fetch('/api/status');
      const data = await res.json();
      this.isAvailable = Boolean(data.cloudTtsAvailable);
      return this.isAvailable;
    } catch {
      this.isAvailable = false;
      return false;
    }
  }

  async getVoices(): Promise<TTSVoice[]> {
    return [
      {
        id: 'cloud_Kore',
        name: 'Hindi Female – Natural (Kore)',
        lang: 'hi-IN',
        gender: 'female',
        provider: 'cloud',
      },
      {
        id: 'cloud_Zephyr',
        name: 'Hindi Female – Soft (Zephyr)',
        lang: 'hi-IN',
        gender: 'female',
        provider: 'cloud',
      },
      {
        id: 'cloud_Puck',
        name: 'Hindi Male – Natural (Puck)',
        lang: 'hi-IN',
        gender: 'male',
        provider: 'cloud',
      },
      {
        id: 'cloud_Fenrir',
        name: 'Hindi Male – Deep (Fenrir)',
        lang: 'hi-IN',
        gender: 'male',
        provider: 'cloud',
      },
      {
        id: 'cloud_Charon',
        name: 'Hindi Male – Expressive (Charon)',
        lang: 'hi-IN',
        gender: 'male',
        provider: 'cloud',
      },
    ];
  }

  async generateAudioFile(
    text: string,
    settings: TTSSettings
  ): Promise<{ blob: Blob; mimeType: string }> {
    // Map voiceId to a valid Gemini prebuilt voice
    let voiceName = 'Kore';
    if (settings.voiceId?.startsWith('cloud_')) {
      voiceName = settings.voiceId.replace('cloud_', '');
    } else if (settings.voiceId?.toLowerCase().includes('male')) {
      voiceName = 'Puck';
    } else {
      voiceName = 'Kore';
    }

    const response = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        voice: voiceName,
        speed: settings.speed,
        pitch: settings.pitch,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const err = new Error(
        errorData.error ||
          (response.status === 429
            ? 'Cloud speech quota exceeded. Switching to Free Browser Speech.'
            : `Server responded with status ${response.status}`)
      );
      (err as any).isQuotaExceeded = response.status === 429 || errorData.isQuotaExceeded;
      (err as any).fallbackToBrowser = Boolean(errorData.fallbackToBrowser);
      throw err;
    }

    const data = await response.json();
    const base64 = data.audioBase64;
    const mimeType = data.mimeType || 'audio/wav';

    // Decode base64 to binary blob
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    const blob = new Blob([bytes], { type: mimeType });
    this.cachedBlob = blob;
    return { blob, mimeType };
  }

  async speak(options: SpeakOptions): Promise<void> {
    this.stop();
    this.currentOptions = options;

    const { text, settings } = options;

    try {
      const { blob } = await this.generateAudioFile(text, settings);
      
      if (this.cachedAudioUrl) {
        URL.revokeObjectURL(this.cachedAudioUrl);
      }
      this.cachedAudioUrl = URL.createObjectURL(blob);

      const audio = new Audio(this.cachedAudioUrl);
      this.audioElement = audio;

      audio.volume = Math.max(0, Math.min(1.0, (settings.volume ?? 100) / 100));
      audio.playbackRate = Math.max(0.5, Math.min(2.0, settings.speed || 1.0));

      audio.onplay = () => {
        options.onStart?.();
      };

      audio.onpause = () => {
        if (!audio.ended) {
          options.onPause?.();
        }
      };

      audio.ontimeupdate = () => {
        options.onProgress?.(audio.currentTime, audio.duration || 0);

        // Approximate word boundary for visualizer
        const words = text.trim().split(/\s+/);
        if (words.length > 0 && audio.duration > 0) {
          const progressFraction = audio.currentTime / audio.duration;
          const wordIndex = Math.min(words.length - 1, Math.floor(progressFraction * words.length));
          options.onBoundary?.(wordIndex, words[wordIndex]?.length || 0, words[wordIndex] || '');
        }
      };

      audio.onended = () => {
        options.onProgress?.(audio.duration, audio.duration);
        options.onEnd?.();
      };

      audio.onerror = () => {
        const err = new Error('Audio playback failed.');
        options.onError?.(err);
      };

      await audio.play();
    } catch (err: any) {
      options.onError?.(err);
      throw err;
    }
  }

  pause(): void {
    if (this.audioElement && !this.audioElement.paused) {
      this.audioElement.pause();
    }
  }

  resume(): void {
    if (this.audioElement && this.audioElement.paused) {
      this.audioElement.play();
    }
  }

  stop(): void {
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.currentTime = 0;
      this.audioElement = null;
    }
    this.currentOptions = null;
  }

  async replay(options?: SpeakOptions): Promise<void> {
    if (this.audioElement && this.cachedAudioUrl) {
      this.audioElement.currentTime = 0;
      await this.audioElement.play();
    } else {
      const opts = options || this.currentOptions;
      if (opts) {
        await this.speak(opts);
      }
    }
  }

  getCachedBlob(): Blob | null {
    return this.cachedBlob;
  }
}
