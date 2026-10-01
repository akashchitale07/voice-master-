import { TTSVoice, TTSSettings, ProviderType } from '../../types/tts';
import { BrowserTTSProvider } from './BrowserTTSProvider';
import { CloudTTSProvider } from './CloudTTSProvider';
import { ITTSProvider, SpeakOptions } from './TTSProvider';
import { generateVoiceFilename } from '../../utils/hindiUtils';
import { generateSyntheticHindiWav, triggerDownload } from './WavHelper';

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
    const provider = this.getActiveProvider();
    try {
      await provider.speak(options);
    } catch (err: any) {
      // If Cloud TTS fails or is quota-limited (429), seamlessly fall back to Browser Speech!
      if (this.activeProviderType === 'cloud') {
        console.warn('Cloud TTS encountered error, switching to Browser TTS:', err?.message);
        this.activeProviderType = 'browser';
        await this.browserProvider.speak(options);
        return;
      }
      throw err;
    }
  }

  pause(): void {
    this.getActiveProvider().pause();
  }

  resume(): void {
    this.getActiveProvider().resume();
  }

  stop(): void {
    this.browserProvider.stop();
    this.cloudProvider.stop();
  }

  async replay(options: SpeakOptions): Promise<void> {
    await this.getActiveProvider().replay(options);
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
    const settings: TTSSettings = {
      language: 'hi-IN',
      voiceId,
      speed,
      pitch,
      volume,
      provider: this.activeProviderType,
    };

    await this.speak({
      text: previewText,
      settings,
    });
  }

  /**
   * Generates and downloads audio file as WAV.
   * Filename format: hindi-voice-YYYY-MM-DD-HH-MM.wav
   */
  async downloadAudio(
    text: string,
    settings: TTSSettings
  ): Promise<{ filename: string; source: 'cloud' | 'synthetic' }> {
    const filename = generateVoiceFilename('wav');

    // 1. If user explicitly requested Cloud and it is available, attempt cloud WAV
    if (settings.provider === 'cloud' && this.cloudAvailable) {
      try {
        const { blob } = await this.cloudProvider.generateAudioFile(text, settings);
        triggerDownload(blob, filename);
        return { filename, source: 'cloud' };
      } catch (err) {
        console.warn('Cloud audio export rate limited or failed, falling back to instant synthetic audio:', err);
      }
    }

    // 2. Client-side audio generation (100% free, offline, zero quota limit)
    const syntheticBlob = generateSyntheticHindiWav(text, settings.speed, settings.pitch);
    triggerDownload(syntheticBlob, filename);
    return { filename, source: 'synthetic' };
  }
}

export const ttsManager = new TTSManager();
