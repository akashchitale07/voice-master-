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

// Cloud TTS synthesis endpoint (Optional high-fidelity cloud provider)
app.post('/api/tts', async (req: Request, res: Response) => {
  try {
    const { text, voice = 'Kore', speed = 1.0, pitch = 1.0 } = req.body;

    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ error: 'Text is required for TTS generation.' });
    }

    if (text.length > 50000) {
      return res.status(400).json({ error: 'Text exceeds maximum length of 50,000 characters for Cloud TTS. Browser TTS supports unlimited text.' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(503).json({
        error: 'Cloud TTS requires GEMINI_API_KEY. Browser TTS is available without any configuration.',
        fallbackToBrowser: true,
      });
    }

    const ai = new GoogleGenAI({ apiKey });

    // Voice mapping for Gemini TTS prebuilt voices:
    // Female: 'Kore' (Clear, natural), 'Zephyr' (Warm, gentle)
    // Male: 'Puck' (Energetic, natural), 'Fenrir' (Deep, steady), 'Charon' (Authoritative)
    const validVoices = ['Kore', 'Puck', 'Fenrir', 'Zephyr', 'Charon'];
    const selectedVoice = validVoices.includes(voice) ? voice : 'Kore';

    // We can guide the model to speak in clear Hindi
    const speechInstruction = speed !== 1.0
      ? `Speak naturally in standard Hindi at ${speed > 1.2 ? 'fast' : speed < 0.9 ? 'slow' : 'medium'} pace: ${text}`
      : `Speak naturally in standard Hindi: ${text}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: speechInstruction,
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

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    const mimeType = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.mimeType || 'audio/wav';

    if (!base64Audio) {
      return res.status(500).json({ error: 'No audio data was returned from the cloud TTS model.' });
    }

    return res.json({
      audioBase64: base64Audio,
      mimeType: mimeType,
      provider: 'cloud',
      voice: selectedVoice,
    });
  } catch (error: any) {
    console.error('Cloud TTS error:', error);
    return res.status(500).json({
      error: error?.message || 'Failed to synthesize speech using cloud provider.',
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
