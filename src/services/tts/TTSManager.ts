import { TTSVoice, TTSSettings, ProviderType } from '../../types/tts';
import { BrowserTTSProvider } from './BrowserTTSProvider';
import { CloudTTSProvider } from './CloudTTSProvider';
import { ITTSProvider, SpeakOptions } from './TTSProvider';
import { generateVoiceFilename } from '../../utils/hindiUtils';
import { triggerDownload } from './WavHelper';

export class TTSManager {
  private browserProvider: BrowserTTSProvider;
  private cloudProvider: CloudTTSProvider;
  private activeProviderType: ProviderType = 'browser';
  private cloudAvailable: boolean = false;

  constructor() {
    this.browserProvider = new BrowserTTSProvider();
    this.cloudProvider = new CloudTTSProvider();
  }

  async initialize(): Promise<{
    browserSupported: boolean;
    cloudAvailable: boolean;
  }> {
    const browserSupported = this.browserProvider.isSupported();
    this.cloudAvailable = await this.cloudProvider.checkAvailability();
    return {
      browserSupported,
      cloudAvailable: this.cloudAvailable,
    };
  }

  setProvider(type: ProviderType) {
    if (this.activeProviderType !== type) {
      this.getActiveProvider().stop();
      this.activeProviderType = type;
    }
  }

  getProviderType(): ProviderType {
    return this.activeProviderType;
  }

  isCloudAvailable(): boolean {
    return this.cloudAvailable;
  }

  getActiveProvider(): ITTSProvider {
    return this.activeProviderType === 'cloud' && this.cloudAvailable
      ? this.cloudProvider
      : this.browserProvider;
  }

  async getVoices(): Promise<{
    browserVoices: TTSVoice[];
    cloudVoices: TTSVoice[];
    hasNativeHindi: boolean;
  }> {
    const browserVoices = await this.browserProvider.getVoices();
    const cloudVoices = await this.cloudProvider.getVoices();

    const hasNativeHindi = browserVoices.length > 0;

    return {
      browserVoices,
      cloudVoices,
      hasNativeHindi,
    };
  }

  async speak(options: SpeakOptions): Promise<void> {
    const isCloudVoice = Boolean(options.settings.voiceId?.startsWith('cloud_'));
    const isCloudRequested = options.settings.provider === 'cloud';
    const useCloud = (isCloudVoice || isCloudRequested) && this.cloudAvailable;
    const provider = useCloud ? this.cloudProvider : this.browserProvider;

    try {
      await provider.speak(options);
    } catch (err: any) {
      // If Cloud TTS fails or is quota-limited (429), seamlessly fall back to Browser Speech!
      if (provider === this.cloudProvider) {
        console.warn('Cloud TTS encountered error, switching to Browser TTS:', err?.message);
        this.activeProviderType = 'browser';
        await this.browserProvider.speak({
          ...options,
          settings: { ...options.settings, provider: 'browser' },
        });
        return;
      }
      throw err;
    }
  }

  pause(): void {
    this.browserProvider.pause();
    this.cloudProvider.pause();
  }

  resume(): void {
    this.getActiveProvider().resume();
  }

  stop(): void {
    this.browserProvider.stop();
    this.cloudProvider.stop();
  }

  async replay(options: SpeakOptions): Promise<void> {
    await this.speak(options);
  }

  /**
   * Voice preview says: "नमस्ते, यह हिंदी आवाज़ का परीक्षण है।"
   */
  async previewVoice(
    voiceId: string,
    speed: number = 1.0,
    pitch: number = 1.0,
    volume: number = 100
  ): Promise<void> {
    const previewText = 'नमस्ते, यह हिंदी आवाज़ का परीक्षण है।';
    const isCloudVoice = voiceId.startsWith('cloud_');
    const providerType: ProviderType = isCloudVoice ? 'cloud' : 'browser';

    const settings: TTSSettings = {
      language: 'hi-IN',
      voiceId,
      speed,
      pitch,
      volume,
      provider: providerType,
    };

    if (isCloudVoice && this.cloudAvailable) {
      await this.cloudProvider.speak({
        text: previewText,
        settings,
      });
    } else {
      await this.browserProvider.speak({
        text: previewText,
        settings,
      });
    }
  }

  /**
   * Generates and downloads audio file as genuine high-fidelity Hindi WAV speech.
   * Filename format: hindi-voice-YYYY-MM-DD-HH-MM.wav
   */
  async downloadAudio(
    text: string,
    settings: TTSSettings
  ): Promise<{ filename: string; source: 'cloud' }> {
    const filename = generateVoiceFilename('wav');

    let lastError: any = null;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        if (attempt > 0) {
          // Automatic brief retry delay
          await new Promise((r) => setTimeout(r, 2500));
        }
        const { blob } = await this.cloudProvider.generateAudioFile(text, settings);
        triggerDownload(blob, filename);
        return { filename, source: 'cloud' };
      } catch (err: any) {
        lastError = err;
        const isQuota = err?.isQuotaExceeded || String(err?.message || '').includes('429');
        if (!isQuota) break;
      }
    }

    if (lastError?.isQuotaExceeded || String(lastError?.message || '').includes('429')) {
      throw new Error(
        'Cloud audio export is experiencing high demand (rate limit reached). Please wait a few seconds and try downloading again, or listen directly in the player.'
      );
    }
    throw new Error(
      lastError?.message || 'Could not export speech audio. Please check your internet connection and try again.'
    );
  }
}

export const ttsManager = new TTSManager();
