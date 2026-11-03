import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));

// Initialize Google GenAI client server-side
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({
  apiKey: apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Default persona configuration based on user brief
const DEFAULT_PERSONA_PROMPT = `A mature, warm, deep, and authoritative male narrator's voice, speaking in standard Latin American Spanish (Rioplatense / Argentine documentary style, clear and unaccented for general audiences). The tone is formal, solemn, serious, highly professional, and evocative, reminiscent of classic TV documentary narrators (such as Pancho Ibáñez and Ernesto Frith in 'La Aventura del Hombre').
Pitch: Deep baritone with rich chest resonance and full low-end frequencies.
Pacing & Cadencia: Slow-to-moderate, steady tempo. Impeccable use of deliberate, dramatic pauses between clauses to convey grandeur, nostalgia, and scientific or historical weight.
Articulation: Flawless, crisp diction with soft, natural breath control. Smooth transitions without sudden pitch spikes or overly dramatic shifts.
Emotional Tone: Reverent, reflective, authoritative yet inviting and educational. It conveys wisdom, mystery, and solemn respect for nature and history.`;

/**
 * Health check
 */
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    model: 'gemini-3.8-flash-tts',
  });
});

/**
 * TTS Generation Endpoint using gemini-3.8-flash-tts
 */
app.post('/api/tts/generate', async (req: Request, res: Response) => {
  try {
    const {
      text,
      voiceName = 'Fenrir',
      customPersona,
      stability = 80,
      clarity = 85,
      styleExaggeration = 15,
      pacing = 'slow-to-moderate',
    } = req.body;

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return res.status(400).json({ error: 'Text prompt is required for TTS generation.' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: 'GEMINI_API_KEY is not configured on the server. Please check the Secrets panel.',
      });
    }

    // Build the synthesized style directive combining the exact persona with calibration metrics
    const basePersona = customPersona?.trim() || DEFAULT_PERSONA_PROMPT;
    const technicalDirectives = `
Acoustic parameters applied:
- Stability: ${stability}% (Consistent solemn posture, strictly avoid erratic pitch shifts)
- Clarity & Articulation: ${clarity}% (Maximum baritone chest resonance, crystal clear diction)
- Style Exaggeration: ${styleExaggeration}% (Documentary naturalism, no theatrical hyperbole)
- Pacing & Cadence: ${pacing} (Deliberate dramatic pauses between sentences, reverent breathing).`;

    const fullStyleDirective = `${basePersona}\n${technicalDirectives}`;

    // Clean or format text if needed
    const cleanedText = text.trim();

    // Call gemini-3.8-flash-tts
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash-tts',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: cleanedText,
              speechMetadata: {
                style: fullStyleDirective,
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
              voiceName: voiceName,
            },
          },
        },
      },
    });

    const candidatePart = response.candidates?.[0]?.content?.parts?.[0];
    const base64Audio = candidatePart?.inlineData?.data;
    const mimeType = candidatePart?.inlineData?.mimeType || 'audio/wav';

    if (!base64Audio) {
      console.warn('No inline audio data returned from Gemini TTS. Response candidates:', JSON.stringify(response.candidates));
      return res.status(502).json({
        error: 'The TTS model did not return synthesized audio. Please verify text or try again.',
      });
    }

    return res.json({
      success: true,
      audioBase64: base64Audio,
      mimeType: mimeType,
      voiceName,
      text: cleanedText,
      parameters: {
        stability,
        clarity,
        styleExaggeration,
        pacing,
      },
    });
  } catch (error: any) {
    console.error('TTS Generation error:', error);
    const errorMessage = error?.message || 'Failed to synthesize speech';
    const status = error?.status || 500;
    return res.status(status).json({
      error: errorMessage,
      details: error?.details || undefined,
    });
  }
});

/**
 * Script Enhancement Endpoint (Gemini 3.8 Flash)
 * Re-writes or enriches any draft script into classic documentary narration style
 * with dramatic pauses, evocative imagery, and solemn cadence.
 */
app.post('/api/script/enhance', async (req: Request, res: Response) => {
  try {
    const { draftText, styleType = 'documentary_classic' } = req.body;

    if (!draftText || typeof draftText !== 'string' || draftText.trim().length === 0) {
      return res.status(400).json({ error: 'Draft text is required for script enhancement.' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: 'GEMINI_API_KEY is not configured on the server.',
      });
    }

    const systemPrompt = `Eres un prestigioso guionista y director de locución documental de televisión en español, especializado en el estilo mítico de "La Aventura del Hombre", Pancho Ibáñez y Ernesto Frith.
Tu misión es transformar el texto del usuario en un guion de narración solemne, poético, majestuoso y científicamente riguroso.
Reglas:
1. Idioma: Español rioplatense/latinoamericano neutro y culto, digno de un documental de archivo o de naturaleza/historia monumental.
2. Ritmo: Incorpora puntos suspensivos ("...") o acotaciones sutiles donde deban ocurrir pausas dramáticas y silencios reflexivos.
3. Puedes utilizar etiquetas de inflexión vocal sutiles reconocidas por modelos de voz avanzados como <breath> cuando un respiro dramático añada realismo.
4. Mantén la esencia y mensaje original pero eleva la riqueza léxica (palabras como "inmemorial", "vastedad", "vestigio", "silencio", "destino", "origen").
5. Devuelve ÚNICAMENTE el guion narrativo final, sin introducciones ni comentarios adicionales.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [
        {
          role: 'user',
          parts: [{ text: `Adapta el siguiente texto al estilo de locución documental solemne:\n\n"${draftText}"` }],
        },
      ],
      config: {
        systemInstruction: systemPrompt,
      },
    });

    const enhancedScript = response.text?.trim() || draftText;

    return res.json({
      success: true,
      enhancedScript,
    });
  } catch (error: any) {
    console.error('Script Enhancement error:', error);
    return res.status(500).json({
      error: error?.message || 'Error al optimizar el guion con IA',
    });
  }
});

import http from 'http';

/**
 * Start Server (Dev with Vite middlewares / Prod with static files)
 */
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';
  const httpServer = http.createServer(app);

  if (!isProd) {
    const { createServer } = await import('vite');
    const isHmrDisabled = process.env.DISABLE_HMR === 'true';
    const vite = await createServer({
      server: {
        middlewareMode: true,
        hmr: isHmrDisabled ? false : { server: httpServer },
        watch: isHmrDisabled ? null : {},
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  httpServer.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`🎙️ AuraNarrador Server running on http://0.0.0.0:${PORT} (${isProd ? 'Production' : 'Development'})`);
  });
}

startServer();
