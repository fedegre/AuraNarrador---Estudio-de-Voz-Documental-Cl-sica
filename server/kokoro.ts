import { spawn } from 'child_process';
import { mkdtemp, readFile, rm } from 'fs/promises';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

const SCRIPT_PATH = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'tts', 'kokoro_tts.py');
const SYNTHESIS_TIMEOUT_MS = 10 * 60 * 1000;

// Baritone warmth chain, same one used for the "baritono" narrator profiles
const EQ_BARITONE = [
  'equalizer=f=110:t=q:w=0.9:g=4', // chest resonance
  'equalizer=f=300:t=q:w=1.2:g=-1.5', // less boxiness
  'equalizer=f=3200:t=q:w=1.4:g=2', // crisp diction
  'highshelf=f=9000:g=-2', // softer sibilance
  'acompressor=threshold=-22dB:ratio=2.5:attack=15:release=250:makeup=2',
].join(',');

interface KokoroProfile {
  voz: string; // Kokoro voice, or a blend like "ef_dora:0.6+if_sara:0.4"
  velocidad: number;
  tono: number; // semitones
  formantes: boolean; // true = also lowers the voice "size" (more chest)
  pausas: [number, number]; // seconds after "." and after "..."
  eq: string;
}

// Kokoro only ships 3 Spanish voices (em_santa, em_alex, ef_dora); each UI voice becomes a profile
export const KOKORO_PROFILES: Record<string, KokoroProfile> = {
  Fenrir: { voz: 'em_santa', velocidad: 0.86, tono: -2, formantes: true, pausas: [0.75, 1.0], eq: EQ_BARITONE },
  Charon: { voz: 'em_santa', velocidad: 0.84, tono: -3, formantes: true, pausas: [0.85, 1.1], eq: EQ_BARITONE },
  Puck: { voz: 'em_alex', velocidad: 0.98, tono: -1, formantes: false, pausas: [0.45, 0.6], eq: EQ_BARITONE },
  Zephyr: { voz: 'em_santa:0.7+em_alex:0.3', velocidad: 0.88, tono: -2, formantes: false, pausas: [0.7, 0.9], eq: EQ_BARITONE },
  Kore: { voz: 'ef_dora:0.6+if_sara:0.4', velocidad: 0.93, tono: -1, formantes: false, pausas: [0.6, 0.85], eq: '' },
};

// UI pacing -> speed multiplier and pause multiplier
const PACING_ADJUSTMENTS: Record<string, { speed: number; pauses: number }> = {
  slow: { speed: 0.93, pauses: 1.25 },
  'slow-to-moderate': { speed: 1, pauses: 1 },
  moderate: { speed: 1.07, pauses: 0.8 },
  dramatic: { speed: 0.96, pauses: 1.5 },
};

function runPython(outputPath: string, payload: object): Promise<void> {
  return new Promise((resolve, reject) => {
    const python = process.env.PYTHON_BIN || (process.platform === 'win32' ? 'python' : 'python3');
    const child = spawn(python, [SCRIPT_PATH, outputPath], { env: process.env });
    let stderr = '';
    const timer = setTimeout(() => {
      child.kill();
      reject(new Error('Kokoro tardó demasiado en sintetizar el audio.'));
    }, SYNTHESIS_TIMEOUT_MS);

    child.stderr.on('data', (chunk) => (stderr += chunk));
    child.on('error', (err) => {
      clearTimeout(timer);
      reject(new Error(`No se pudo ejecutar "${python}" (configura PYTHON_BIN): ${err.message}`));
    });
    child.on('close', (code) => {
      clearTimeout(timer);
      if (code === 0) resolve();
      else reject(new Error(`Kokoro falló (código ${code}): ${stderr.trim() || 'sin detalles'}`));
    });

    child.stdin.end(JSON.stringify(payload));
  });
}

export async function synthesizeWithKokoro(text: string, voiceName: string, pacing = 'slow-to-moderate') {
  const profile = KOKORO_PROFILES[voiceName] || KOKORO_PROFILES.Fenrir;
  const adjustment = PACING_ADJUSTMENTS[pacing] || PACING_ADJUSTMENTS['slow-to-moderate'];
  const payload = {
    ...profile,
    text,
    velocidad: profile.velocidad * adjustment.speed,
    pausas: profile.pausas.map((p) => p * adjustment.pauses),
    acento: process.env.KOKORO_ACCENT || 'latam',
  };

  const workDir = await mkdtemp(path.join(os.tmpdir(), 'auranarrador-'));
  try {
    const outputPath = path.join(workDir, 'locucion.wav');
    await runPython(outputPath, payload);
    const audio = await readFile(outputPath);
    return { audioBase64: audio.toString('base64'), mimeType: 'audio/wav' };
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }
}
