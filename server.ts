import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === 'production';

app.use(express.json({ limit: '5mb' }));

// Health / Status endpoint
app.get('/api/status', (_req: Request, res: Response) => {
  const hasGeminiKey = Boolean(process.env.GEMINI_API_KEY);
  res.json({
    status: 'ok',
    cloudTtsAvailable: hasGeminiKey,
    defaultProvider: 'browser',
    models: ['gemini-3.8-flash-lite-tts'],
  });
});

// In-memory audio synthesis cache (up to 150 items) to prevent redundant API calls
const audioCache = new Map<string, { audioBase64: string; mimeType: string }>();

function getCacheKey(text: string, voice: string, speed: number): string {
  return `${voice}_${speed.toFixed(2)}_${text.trim()}`;
}

// Cloud TTS synthesis endpoint (High-fidelity cloud provider with dual-model fallback & caching)
app.post('/api/tts', async (req: Request, res: Response) => {
  try {
    const { text, voice = 'Kore', speed = 1.0, pitch = 1.0 } = req.body;

    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ error: 'Text is required for TTS generation.' });
    }

    if (text.length > 50000) {
      return res.status(400).json({ error: 'Text exceeds maximum length of 50,000 characters for Cloud TTS. Browser TTS supports unlimited text.' });
    }

    const trimmed = text.trim();

    // Voice mapping for Gemini TTS prebuilt voices:
    // Female: 'Kore' (Clear, natural), 'Zephyr' (Warm, gentle)
    // Male: 'Puck' (Energetic, natural), 'Fenrir' (Deep, steady), 'Charon' (Authoritative)
    const validVoices = ['Kore', 'Puck', 'Fenrir', 'Zephyr', 'Charon'];
    const selectedVoice = validVoices.includes(voice) ? voice : 'Kore';

    // 1. Check in-memory cache first
    const cacheKey = getCacheKey(trimmed, selectedVoice, speed);
    const cached = audioCache.get(cacheKey);
    if (cached) {
      return res.json({
        audioBase64: cached.audioBase64,
        mimeType: cached.mimeType,
        provider: 'cloud',
        voice: selectedVoice,
        cached: true,
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(503).json({
        error: 'Cloud TTS requires GEMINI_API_KEY. Browser TTS is available without any configuration.',
        fallbackToBrowser: true,
      });
    }

    const ai = new GoogleGenAI({ apiKey });

    // Models to try in sequence: flagship 'gemini-3.8-flash-tts' then 'gemini-3.8-flash-lite-tts'
    const candidateModels = ['gemini-3.8-flash-tts', 'gemini-3.8-flash-lite-tts'];
    let lastError: any = null;
    let base64Audio: string | undefined;
    let mimeType: string = 'audio/wav';

    for (const model of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: trimmed,
                  speechMetadata: {
                    style:
                      speed > 1.2
                        ? 'Fast-paced, clear Hindi pronunciation'
                        : speed < 0.9
                        ? 'Calm, slow, clear Hindi pronunciation'
                        : 'Clear, natural Hindi pronunciation with authentic cadence',
                  },
                },
              ],
            },
          ],
          config: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: {
                  voiceName: selectedVoice,
                },
              },
            },
          },
        });

        base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        mimeType = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.mimeType || 'audio/wav';

        if (base64Audio) {
          break; // Succeeded!
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`TTS attempt with model ${model} failed:`, err?.message || err);
      }
    }

    if (!base64Audio) {
      throw lastError || new Error('No audio data returned from any speech synthesis model.');
    }

    // Cache result (keep cache size <= 150)
    if (audioCache.size >= 150) {
      const firstKey = audioCache.keys().next().value;
      if (firstKey) audioCache.delete(firstKey);
    }
    audioCache.set(cacheKey, { audioBase64: base64Audio, mimeType });

    return res.json({
      audioBase64: base64Audio,
      mimeType: mimeType,
      provider: 'cloud',
      voice: selectedVoice,
    });
  } catch (error: any) {
    const rawMsg = String(error?.message || '');
    const isQuotaExceeded =
      rawMsg.includes('429') ||
      rawMsg.includes('RESOURCE_EXHAUSTED') ||
      rawMsg.includes('Quota exceeded') ||
      rawMsg.includes('quota');

    if (isQuotaExceeded) {
      console.warn('Cloud TTS quota reached (429). Client will use Free Browser Speech.');
      return res.status(429).json({
        error: 'Cloud quota limit reached. Please use Free Browser Speech for unlimited speech without quota limits.',
        isQuotaExceeded: true,
        fallbackToBrowser: true,
      });
    }

    console.warn('Cloud TTS unavailable:', error?.message || error);
    return res.status(500).json({
      error: 'Failed to synthesize speech using cloud provider. Please use Free Browser Speech.',
      fallbackToBrowser: true,
    });
  }
});

async function startServer() {
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
        watch: process.env.DISABLE_HMR === 'true' ? null : {},
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production: serve built static files from dist
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Hindi Voice Studio server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
