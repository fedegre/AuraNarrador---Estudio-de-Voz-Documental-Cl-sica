import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import { synthesizeWithKokoro } from './server/kokoro';
import { chatWithOllama, ollamaHost, ollamaModel } from './server/ollama';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));

// Engines: local by default (Kokoro for voice, Ollama for scripts); Gemini stays available as an option
const TTS_ENGINE = (process.env.TTS_ENGINE || 'kokoro').toLowerCase();
const SCRIPT_ENGINE = (process.env.SCRIPT_ENGINE || 'ollama').toLowerCase();
const GEMINI_TTS_MODEL = 'gemini-3.8-flash-tts';

// Initialize Google GenAI client server-side (only used when an engine is set to "gemini")
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({
  apiKey: apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Voice-specific acoustic and persona configurations
const VOICE_PERSONAS: Record<string, { prompt: string; sampleText: string }> = {
  Fenrir: {
    prompt: `A mature, warm, deep, and authoritative male narrator's voice, speaking in standard Latin American Spanish (Rioplatense / Argentine documentary style, clear and unaccented for general audiences). Pitch: Deep cavernous baritone with rich chest resonance and full low-end frequencies. Pacing: Slow-to-moderate, steady tempo with deliberate, dramatic pauses between clauses. Tone: Reverent, solemn, highly professional, reminiscent of Pancho Ibáñez and Ernesto Frith in 'La Aventura del Hombre'.`,
    sampleText: 'En los confines australes del continente... el viento custodia el silencio milenario de la Patagonia.',
  },
  Charon: {
    prompt: `A grave, mysterious, solemn, and deep low-register male narrator voice, speaking in standard Latin American Spanish. Pitch: Deep, darker acoustic tone with intimate breath control and mysterious weight. Pacing: Measured, suspenseful, deliberate cadence. Tone: Enigmatic, archaeological, cosmic, solemn.`,
    sampleText: 'Bajo la arena del desierto... los enigmas de civilizaciones extintas aguardan en la penumbra.',
  },
  Puck: {
    prompt: `An articulate, energetic, crisp, and intelligent male narrator voice, speaking in standard Latin American Spanish. Pitch: Balanced middle-baritone with analytical clarity. Pacing: Engaging, steady educational tempo with sharp diction. Tone: Scientific divulgation, dynamic, inquisitive, authoritative.`,
    sampleText: 'A través del telescopio, observamos cómo las galaxias evolucionan en una danza gravitacional sin fin.',
  },
  Zephyr: {
    prompt: `A calm, warm, serene, and philosophical male narrator voice, speaking in standard Latin American Spanish. Pitch: Soft baritone with gentle warmth and smooth transitions. Pacing: Relaxed, meditative, reflective tempo. Tone: Poetic, naturalistic, contemplative.`,
    sampleText: 'El murmullo del bosque nos recuerda la frágil armonía que sostiene toda forma de vida.',
  },
  Kore: {
    prompt: `A warm, dignified, elegant, and clear female narrator voice, speaking in standard Latin American Spanish (neutral documentary dubbing style). Pitch: Full-bodied alto / calm mezzosoprano with clean diction and solemn grace. Pacing: Poised, reverent, educational tempo. Tone: Authoritative, inviting, evocative documentary narrator.`,
    sampleText: 'Entre las cumbres andinas... la memoria de nuestros antepasados resuena intacta a través de los siglos.',
  },
};

// Memory cache for voice preview samples
const voiceSampleCache: Record<string, { audioBase64: string; mimeType: string }> = {};

async function synthesizeWithGemini(text: string, voiceName: string, style: string) {
  if (!process.env.GEMINI_API_KEY) {
    throw Object.assign(new Error('GEMINI_API_KEY no configurada (TTS_ENGINE=gemini).'), { status: 500 });
  }

  const response = await ai.models.generateContent({
    model: GEMINI_TTS_MODEL,
    contents: [
      {
        role: 'user',
        parts: [
          {
            text,
            speechMetadata: {
              style,
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
  const audioBase64 = candidatePart?.inlineData?.data;
  if (!audioBase64) {
    console.warn('No inline audio data returned from Gemini TTS. Response candidates:', JSON.stringify(response.candidates));
    throw Object.assign(new Error('The TTS model did not return synthesized audio. Please verify text or try again.'), {
      status: 502,
    });
  }
  return { audioBase64, mimeType: candidatePart?.inlineData?.mimeType || 'audio/wav' };
}

/**
 * Health check
 */
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    ttsEngine: TTS_ENGINE,
    scriptEngine: SCRIPT_ENGINE,
    model: TTS_ENGINE === 'gemini' ? GEMINI_TTS_MODEL : 'kokoro-v1.0',
    scriptModel: SCRIPT_ENGINE === 'gemini' ? 'gemini-3.8-flash' : `ollama:${ollamaModel()}`,
  });
});

/**
 * Voice Preview Sample Endpoint
 * Returns a quick cached or newly synthesized sample for a given voice
 */
app.get('/api/tts/sample/:voiceName', async (req: Request, res: Response) => {
  try {
    const voiceName = req.params.voiceName || 'Fenrir';
    const config = VOICE_PERSONAS[voiceName] || VOICE_PERSONAS['Fenrir'];

    if (voiceSampleCache[voiceName]) {
      return res.json({
        success: true,
        voiceName,
        sampleText: config.sampleText,
        audioBase64: voiceSampleCache[voiceName].audioBase64,
        mimeType: voiceSampleCache[voiceName].mimeType,
        cached: true,
      });
    }

    const { audioBase64: base64Audio, mimeType } =
      TTS_ENGINE === 'gemini'
        ? await synthesizeWithGemini(config.sampleText, voiceName, config.prompt)
        : await synthesizeWithKokoro(config.sampleText, voiceName);

    voiceSampleCache[voiceName] = { audioBase64: base64Audio, mimeType };

    return res.json({
      success: true,
      voiceName,
      sampleText: config.sampleText,
      audioBase64: base64Audio,
      mimeType,
      cached: false,
    });
  } catch (err: any) {
    console.error('Error in sample generation:', err);
    return res.status(500).json({ error: err.message || 'Error al obtener muestra de voz.' });
  }
});

/**
 * TTS Generation Endpoint (Kokoro local by default, gemini-3.8-flash-tts with TTS_ENGINE=gemini)
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

    const cleanedText = text.trim();
    let synthesized: { audioBase64: string; mimeType: string };

    if (TTS_ENGINE === 'gemini') {
      // Build the synthesized style directive combining the exact persona with calibration metrics
      const defaultVoiceConfig = VOICE_PERSONAS[voiceName] || VOICE_PERSONAS['Fenrir'];
      const basePersona = customPersona?.trim() || defaultVoiceConfig.prompt;
      const technicalDirectives = `
Acoustic parameters applied:
- Stability: ${stability}% (Consistent posture, strictly avoid erratic pitch shifts)
- Clarity & Articulation: ${clarity}% (Crystal clear diction and natural acoustic resonance)
- Style Exaggeration: ${styleExaggeration}% (Documentary naturalism, no theatrical hyperbole)
- Pacing & Cadence: ${pacing} (Deliberate dramatic pauses between sentences, reverent breathing).`;

      synthesized = await synthesizeWithGemini(cleanedText, voiceName, `${basePersona}\n${technicalDirectives}`);
    } else {
      // Kokoro has no style prompt: the voice character comes from the profile, pacing adjusts speed and pauses
      synthesized = await synthesizeWithKokoro(cleanedText, voiceName, pacing);
    }
    const { audioBase64: base64Audio, mimeType } = synthesized;

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
 * Script Enhancement Endpoint (Ollama local by default, Gemini 3.8 Flash with SCRIPT_ENGINE=gemini)
 * Re-writes or enriches any draft script into classic documentary narration style
 * with dramatic pauses, evocative imagery, and solemn cadence.
 */
app.post('/api/script/enhance', async (req: Request, res: Response) => {
  try {
    const { draftText, styleType = 'documentary_classic' } = req.body;

    if (!draftText || typeof draftText !== 'string' || draftText.trim().length === 0) {
      return res.status(400).json({ error: 'Draft text is required for script enhancement.' });
    }

    const systemPrompt = `Eres un prestigioso guionista y director de locución documental de televisión en español, especializado en el estilo mítico de "La Aventura del Hombre", Pancho Ibáñez y Ernesto Frith.
Tu misión es transformar el texto del usuario en un guion de narración solemne, poético, majestuoso y científicamente riguroso.
Reglas:
1. Idioma: Español rioplatense/latinoamericano neutro y culto, digno de un documental de archivo o de naturaleza/historia monumental.
2. Ritmo: Incorpora puntos suspensivos ("...") donde deban ocurrir pausas dramáticas y silencios reflexivos.
3. No uses etiquetas, acotaciones entre corchetes ni marcas de formato: todo lo que escribas será leído en voz alta.
4. Mantén la esencia y mensaje original pero eleva la riqueza léxica (palabras como "inmemorial", "vastedad", "vestigio", "silencio", "destino", "origen").
5. Devuelve ÚNICAMENTE el guion narrativo final, sin introducciones ni comentarios adicionales.`;

    const userPrompt = `Adapta el siguiente texto al estilo de locución documental solemne:\n\n"${draftText}"`;
    let enhancedText: string;

    if (SCRIPT_ENGINE === 'gemini') {
      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({
          error: 'GEMINI_API_KEY is not configured on the server (SCRIPT_ENGINE=gemini).',
        });
      }
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
        config: {
          systemInstruction: systemPrompt,
        },
      });
      enhancedText = response.text?.trim() || '';
    } else {
      enhancedText = await chatWithOllama(systemPrompt, userPrompt);
    }

    const enhancedScript = enhancedText || draftText;

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
    console.log(`   Voz: ${TTS_ENGINE} · Guion: ${SCRIPT_ENGINE === 'gemini' ? 'gemini' : `ollama ${ollamaModel()} en ${ollamaHost()}`}`);
  });
}

startServer();
