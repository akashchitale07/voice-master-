import { TTSVoice, TTSSettings } from '../../types/tts';
import { ITTSProvider, SpeakOptions } from './TTSProvider';

export class BrowserTTSProvider implements ITTSProvider {
  readonly id = 'browser' as const;
  readonly name = 'Browser SpeechSynthesis (Native Free)';

  private activeUtterance: SpeechSynthesisUtterance | null = null;
  private currentOptions: SpeakOptions | null = null;
  private progressInterval: ReturnType<typeof setInterval> | null = null;
  private keepAliveInterval: ReturnType<typeof setInterval> | null = null;
  private startTime: number = 0;
  private estimatedDuration: number = 0;
  private elapsedBeforePause: number = 0;
  private isCanceled: boolean = false;
  private currentChunkIndex: number = 0;
  private textChunks: { text: string; charOffset: number }[] = [];

  isSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
  }

  async getVoices(): Promise<TTSVoice[]> {
    if (!this.isSupported()) return [];

    return new Promise((resolve) => {
      const fetchAndFormat = () => {
        const rawVoices = window.speechSynthesis.getVoices();
        
        // Filter for Hindi voices (hi-IN, hi, Hindi, India)
        const hindiVoices = rawVoices.filter((v) => {
          const lang = (v.lang || '').toLowerCase();
          const name = (v.name || '').toLowerCase();
          return (
            lang === 'hi-in' ||
            lang.startsWith('hi') ||
            name.includes('hindi') ||
            (name.includes('india') && lang.includes('hi'))
          );
        });

        const formatted: TTSVoice[] = hindiVoices.map((v, index) => {
          const lowerName = v.name.toLowerCase();
          let gender: 'female' | 'male' | 'neutral' = 'neutral';
          if (lowerName.includes('female') || lowerName.includes('kalpana') || lowerName.includes('geeta') || lowerName.includes('heera')) {
            gender = 'female';
          } else if (lowerName.includes('male') || lowerName.includes('hemant') || lowerName.includes('amit') || lowerName.includes('madhav')) {
            gender = 'male';
          } else {
            gender = index % 2 === 0 ? 'female' : 'male';
          }

          return {
            id: `browser_${v.name}_${v.lang}`,
            name: v.name,
            lang: v.lang,
            gender,
            isDefault: v.default || index === 0,
            provider: 'browser',
            nativeVoice: v,
          };
        });

        resolve(formatted);
      };

      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        fetchAndFormat();
      } else {
        window.speechSynthesis.onvoiceschanged = () => {
          fetchAndFormat();
        };
        setTimeout(fetchAndFormat, 800);
      }
    });
  }

  /**
   * Splits long text into natural sentence / phrase chunks so browsers
   * (Chrome, Edge, Safari) do not cut off or freeze on long/unlimited texts.
   */
  private splitIntoChunks(text: string, maxLen: number = 200): { text: string; charOffset: number }[] {
    const chunks: { text: string; charOffset: number }[] = [];
    if (!text.trim()) return chunks;

    // Split by Devanagari full stop (।), Latin periods, question marks, exclamation marks, or newlines
    const sentenceRegex = /([^।?!.\n\r]+[।?!.\n\r]+|[^।?!.\n\r]+$)/g;
    let match: RegExpExecArray | null;
    let currentOffset = 0;

    const rawSentences: { text: string; offset: number }[] = [];
    while ((match = sentenceRegex.exec(text)) !== null) {
      const sentence = match[0];
      if (sentence.trim()) {
        rawSentences.push({ text: sentence, offset: match.index });
      }
    }

    if (rawSentences.length === 0) {
      rawSentences.push({ text, offset: 0 });
    }

    for (const item of rawSentences) {
      if (item.text.length <= maxLen) {
        chunks.push({ text: item.text.trim(), charOffset: item.offset });
      } else {
        // If a single sentence exceeds maxLen, split by commas or spaces
        const words = item.text.split(/([,;:，、\s]+)/);
        let currentChunk = '';
        let chunkStartOffset = item.offset;

        for (const token of words) {
          if ((currentChunk + token).length > maxLen && currentChunk.trim().length > 0) {
            chunks.push({ text: currentChunk.trim(), charOffset: chunkStartOffset });
            chunkStartOffset += currentChunk.length;
            currentChunk = token;
          } else {
            currentChunk += token;
          }
        }
        if (currentChunk.trim().length > 0) {
          chunks.push({ text: currentChunk.trim(), charOffset: chunkStartOffset });
        }
      }
    }

    return chunks.length > 0 ? chunks : [{ text: text.trim(), charOffset: 0 }];
  }

  async speak(options: SpeakOptions): Promise<void> {
    if (!this.isSupported()) {
      const err = new Error('Browser SpeechSynthesis is not supported on this device/browser.');
      options.onError?.(err);
      throw err;
    }

    this.stop();
    this.isCanceled = false;
    this.currentOptions = options;

    const { text, settings } = options;
    this.textChunks = this.splitIntoChunks(text);
    this.currentChunkIndex = 0;

    // Estimate duration: approx 130 words per minute in Hindi at 1.0x rate
    const words = text.trim().split(/\s+/).filter(Boolean);
    const speed = Math.max(0.5, Math.min(2.0, settings.speed || 1.0));
    const baseDurationSec = Math.max(1.5, (words.length / 130) * 60);
    this.estimatedDuration = baseDurationSec / speed;
    this.elapsedBeforePause = 0;

    this.startTime = Date.now();
    options.onStart?.();
    this.startProgressTracking();
    this.startKeepAlive();

    this.speakCurrentChunk();
  }

  private speakCurrentChunk(): void {
    if (this.isCanceled || !this.currentOptions) return;

    if (this.currentChunkIndex >= this.textChunks.length) {
      // Completed all chunks of the unlimited text
      this.stopProgressTracking();
      this.stopKeepAlive();
      this.activeUtterance = null;
      this.currentOptions.onProgress?.(this.estimatedDuration, this.estimatedDuration);
      this.currentOptions.onEnd?.();
      return;
    }

    const chunk = this.textChunks[this.currentChunkIndex];
    const utterance = new SpeechSynthesisUtterance(chunk.text);
    this.activeUtterance = utterance;

    const { settings } = this.currentOptions;
    const speed = Math.max(0.5, Math.min(2.0, settings.speed || 1.0));

    // Apply voice
    if (settings.voiceId) {
      const allVoices = window.speechSynthesis.getVoices();
      const matched = allVoices.find(
        (v) => `browser_${v.name}_${v.lang}` === settings.voiceId || v.name === settings.voiceId
      );
      if (matched) {
        utterance.voice = matched;
        utterance.lang = matched.lang || 'hi-IN';
      } else {
        utterance.lang = 'hi-IN';
      }
    } else {
      utterance.lang = 'hi-IN';
    }

    utterance.rate = speed;
    utterance.pitch = Math.max(0.5, Math.min(2.0, settings.pitch || 1.0));
    utterance.volume = Math.max(0, Math.min(1.0, (settings.volume ?? 100) / 100));

    // Handle boundary (word tracking with offset)
    utterance.onboundary = (event) => {
      if (event.name === 'word') {
        const charIndex = chunk.charOffset + event.charIndex;
        const charLength = event.charLength || 5;
        const word = chunk.text.substring(event.charIndex, event.charIndex + charLength);
        this.currentOptions?.onBoundary?.(charIndex, charLength, word);
      }
    };

    utterance.onend = () => {
      if (this.isCanceled) return;
      this.currentChunkIndex++;
      this.speakCurrentChunk();
    };

    utterance.onerror = (event) => {
      if (this.isCanceled || event.error === 'interrupted' || event.error === 'canceled') {
        return;
      }
      console.warn('Speech chunk error, skipping to next chunk:', event.error);
      this.currentChunkIndex++;
      this.speakCurrentChunk();
    };

    window.speechSynthesis.speak(utterance);
  }

  pause(): void {
    if (this.isSupported() && window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
      this.elapsedBeforePause += (Date.now() - this.startTime) / 1000;
      this.stopProgressTracking();
      this.stopKeepAlive();
      window.speechSynthesis.pause();
      this.currentOptions?.onPause?.();
    }
  }

  resume(): void {
    if (this.isSupported() && window.speechSynthesis.paused) {
      this.startTime = Date.now();
      this.startProgressTracking();
      this.startKeepAlive();
      window.speechSynthesis.resume();
      this.currentOptions?.onResume?.();
    }
  }

  stop(): void {
    this.isCanceled = true;
    if (this.isSupported()) {
      window.speechSynthesis.cancel();
    }
    this.stopProgressTracking();
    this.stopKeepAlive();
    this.activeUtterance = null;
    this.elapsedBeforePause = 0;
    this.currentChunkIndex = 0;
    this.textChunks = [];
  }

  async replay(options?: SpeakOptions): Promise<void> {
    const opts = options || this.currentOptions;
    if (opts) {
      await this.speak(opts);
    }
  }

  private startProgressTracking(): void {
    this.stopProgressTracking();
    this.progressInterval = setInterval(() => {
      if (!window.speechSynthesis.speaking || window.speechSynthesis.paused) {
        return;
      }
      const current = this.elapsedBeforePause + (Date.now() - this.startTime) / 1000;
      const clampedCurrent = Math.min(current, this.estimatedDuration);
      this.currentOptions?.onProgress?.(clampedCurrent, this.estimatedDuration);
    }, 100);
  }

  private stopProgressTracking(): void {
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
      this.progressInterval = null;
    }
  }

  /**
   * Chromium bug workaround: speech synthesis can pause itself after ~15s
   * of long speaking. Periodic pause/resume keep-alive keeps it alive.
   */
  private startKeepAlive(): void {
    this.stopKeepAlive();
    this.keepAliveInterval = setInterval(() => {
      if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
        window.speechSynthesis.pause();
        window.speechSynthesis.resume();
      }
    }, 12000);
  }

  private stopKeepAlive(): void {
    if (this.keepAliveInterval) {
      clearInterval(this.keepAliveInterval);
      this.keepAliveInterval = null;
    }
  }
}
