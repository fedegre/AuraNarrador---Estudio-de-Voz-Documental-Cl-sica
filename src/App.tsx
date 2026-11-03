import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { ScriptEditor } from './components/ScriptEditor';
import { PersonaConfigPanel } from './components/PersonaConfigPanel';
import { AudioMasteringPlayer } from './components/AudioMasteringPlayer';
import { TakesHistory } from './components/TakesHistory';
import { AcousticParameters, AudioTake, ScriptPreset } from './types';
import { SCRIPT_PRESETS } from './data/presets';
import { Radio, Mic, Award, Compass, Sparkles, Loader2 } from 'lucide-react';

const LOCAL_STORAGE_KEY = 'auranarrador_takes_v1';

export default function App() {
  const [text, setText] = useState<string>(SCRIPT_PRESETS[0].fullText);
  const [selectedPresetId, setSelectedPresetId] = useState<string>(SCRIPT_PRESETS[0].id);
  const [parameters, setParameters] = useState<AcousticParameters>({
    stability: 80,
    clarity: 85,
    styleExaggeration: 15,
    pacing: 'slow-to-moderate',
    voiceName: 'Fenrir',
  });
  const [customPersona, setCustomPersona] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [samplingVoice, setSamplingVoice] = useState<string | null>(null);
  const [currentTake, setCurrentTake] = useState<AudioTake | null>(null);
  const [takes, setTakes] = useState<AudioTake[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Load takes from local storage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Re-generate blob URLs for stored takes if base64 is available
          const restored = parsed.map((take: any) => {
            if (take.audioBase64) {
              const byteCharacters = atob(take.audioBase64);
              const byteNumbers = new Array(byteCharacters.length);
              for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
              }
              const byteArray = new Uint8Array(byteNumbers);
              const blob = new Blob([byteArray], { type: take.mimeType || 'audio/wav' });
              return {
                ...take,
                audioUrl: URL.createObjectURL(blob),
              };
            }
            return take;
          });
          setTakes(restored);
          setCurrentTake(restored[0]);
        }
      }
    } catch (e) {
      console.warn('Error reading from localStorage:', e);
    }
  }, []);

  // Save takes to localStorage (saving metadata & base64, omitting transient blob URL)
  useEffect(() => {
    try {
      const serializable = takes.slice(0, 10).map((t) => ({
        id: t.id,
        timestamp: t.timestamp,
        text: t.text,
        audioBase64: t.audioBase64,
        mimeType: t.mimeType,
        voiceName: t.voiceName,
        parameters: t.parameters,
        title: t.title,
      }));
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(serializable));
    } catch (e) {
      console.warn('Error saving to localStorage:', e);
    }
  }, [takes]);

  const handleSelectPreset = (preset: ScriptPreset) => {
    setSelectedPresetId(preset.id);
    setText(preset.fullText);
    if (preset.suggestedPacing) {
      setParameters((prev) => ({
        ...prev,
        pacing: preset.suggestedPacing,
      }));
    }
  };

  const handlePreviewSample = async (voiceName: string) => {
    setSamplingVoice(voiceName);
    setError(null);
    try {
      const res = await fetch(`/api/tts/sample/${voiceName}`);
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Error al obtener la muestra de voz');
      }

      const base64Data = data.audioBase64;
      const mimeType = data.mimeType || 'audio/wav';
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const audioBlob = new Blob([byteArray], { type: mimeType });
      const audioUrl = URL.createObjectURL(audioBlob);

      const sampleTake: AudioTake = {
        id: `sample_${voiceName}_${Date.now()}`,
        timestamp: Date.now(),
        text: data.sampleText,
        audioUrl,
        audioBase64: base64Data,
        mimeType,
        voiceName: voiceName,
        parameters: { ...parameters, voiceName },
        title: `Muestra Acústica: ${voiceName}`,
      };

      setCurrentTake(sampleTake);
    } catch (err: any) {
      console.error('Error in sample preview:', err);
      setError(`No se pudo reproducir la muestra de ${voiceName}: ${err.message}`);
    } finally {
      setSamplingVoice(null);
    }
  };

  const handleGenerateTTS = async () => {
    if (!text.trim() || isGenerating) return;

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/tts/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text.trim(),
          voiceName: parameters.voiceName,
          customPersona: customPersona.trim() || undefined,
          stability: parameters.stability,
          clarity: parameters.clarity,
          styleExaggeration: parameters.styleExaggeration,
          pacing: parameters.pacing,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Error al generar la síntesis de voz.');
      }

      // Convert returned base64 WAV into Blob and Object URL
      const base64Data = data.audioBase64;
      const mimeType = data.mimeType || 'audio/wav';
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const audioBlob = new Blob([byteArray], { type: mimeType });
      const audioUrl = URL.createObjectURL(audioBlob);

      // Determine a clean title based on preset or text snippet
      const matchingPreset = SCRIPT_PRESETS.find((p) => p.id === selectedPresetId);
      const title = matchingPreset
        ? matchingPreset.title
        : text.slice(0, 36).replace(/\n/g, ' ') + (text.length > 36 ? '...' : '');

      const newTake: AudioTake = {
        id: `take_${Date.now()}`,
        timestamp: Date.now(),
        text: text.trim(),
        audioUrl,
        audioBase64: base64Data,
        mimeType,
        voiceName: parameters.voiceName,
        parameters: { ...parameters },
        title,
      };

      setCurrentTake(newTake);
      setTakes((prev) => [newTake, ...prev]);
    } catch (err: any) {
      console.error('Synthesis failed:', err);
      setError(err?.message || 'Error desconocido al sintetizar la locución.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeleteTake = (id: string) => {
    setTakes((prev) => prev.filter((t) => t.id !== id));
    if (currentTake?.id === id) {
      const remaining = takes.filter((t) => t.id !== id);
      setCurrentTake(remaining.length > 0 ? remaining[0] : null);
    }
  };

  const handleClearHistory = () => {
    setTakes([]);
    setCurrentTake(null);
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  };

  return (
    <div className="min-h-screen bg-[#0a0c10] text-zinc-100 flex flex-col font-sans selection:bg-amber-500 selection:text-black subtle-grid-bg">
      {/* Studio Header */}
      <Header />

      {/* Main Studio Canvas */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Editorial Hero Announcement Banner */}
        <section className="relative overflow-hidden rounded-2xl border border-amber-900/30 bg-gradient-to-r from-zinc-950 via-zinc-900/80 to-zinc-950 p-6 sm:p-7 shadow-2xl">
          <div className="absolute -top-12 -right-12 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="max-w-3xl">
              <div className="flex items-center gap-2 mb-2.5">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono-tech bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  <Compass className="w-3.5 h-3.5" />
                  Archivo Documental & Síntesis Barítona
                </span>
                <span className="text-xs font-mono-tech text-zinc-400">
                  Resonancia Pectoral Calibrada
                </span>
              </div>
              <h2 className="font-serif-doc text-xl sm:text-2xl md:text-3xl font-extrabold text-zinc-100 tracking-tight leading-tight">
                La Voz de la Aventura y el Tiempo
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-zinc-300 leading-relaxed font-script-quote">
                Generador de locución con el timbre, la cadencia y el porte solemne de los grandes narradores de documentales de la televisión latinoamericana. Tonos graves, silencios reflexivos y rigor científico evocador impulsado por <strong>Gemini 3.8 Flash TTS</strong>.
              </p>
            </div>

            {/* Quick Badge Stats */}
            <div className="flex flex-wrap lg:flex-col gap-2.5 shrink-0 text-xs font-mono-tech">
              <div className="px-3.5 py-2 rounded-xl bg-zinc-900/90 border border-zinc-800 flex items-center gap-2.5">
                <div className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></div>
                <div>
                  <div className="text-[10px] text-zinc-500">PITCH</div>
                  <div className="font-bold text-zinc-200">Barítono Bajo + Armónicos</div>
                </div>
              </div>
              <div className="px-3.5 py-2 rounded-xl bg-zinc-900/90 border border-zinc-800 flex items-center gap-2.5">
                <Award className="w-4 h-4 text-amber-400" />
                <div>
                  <div className="text-[10px] text-zinc-500">FORMATO</div>
                  <div className="font-bold text-zinc-200">24kHz RIFF WAV Puro</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Studio Workspace Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Console: Script Editor + Audio Player + Takes (8 cols) */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-6">
            {/* Script Input & Generator */}
            <ScriptEditor
              text={text}
              onChange={(val) => {
                setText(val);
                setSelectedPresetId('');
              }}
              onGenerate={handleGenerateTTS}
              isGenerating={isGenerating}
              onSelectPreset={handleSelectPreset}
              selectedPresetId={selectedPresetId}
              error={error}
              activeVoiceName={parameters.voiceName}
            />

            {/* Realtime Audio Mastering & Monitoring */}
            <AudioMasteringPlayer
              currentTake={currentTake}
              activeVoiceName={parameters.voiceName}
            />

            {/* Takes History */}
            <TakesHistory
              takes={takes}
              currentTakeId={currentTake?.id}
              onSelectTake={(take) => {
                setCurrentTake(take);
                setText(take.text);
                setParameters({ ...take.parameters });
              }}
              onDeleteTake={handleDeleteTake}
              onClearAll={handleClearHistory}
            />
          </div>

          {/* Right Console: Acoustic & Persona Parameter Calibration (5 cols) */}
          <div className="lg:col-span-5 xl:col-span-4 space-y-6">
            <PersonaConfigPanel
              parameters={parameters}
              onChange={setParameters}
              customPersona={customPersona}
              onCustomPersonaChange={setCustomPersona}
              onPreviewSample={handlePreviewSample}
              samplingVoice={samplingVoice}
            />
          </div>
        </div>
      </main>

      {/* Sticky Bottom Control Dock for Instant Synthesis Access */}
      <div className="sticky bottom-0 z-40 bg-zinc-950/95 backdrop-blur-xl border-t border-amber-500/40 py-3 px-4 shadow-2xl shadow-black">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
              <span className="text-xs font-mono-tech text-zinc-300">
                VOZ ACTIVA: <strong className="text-amber-400 font-bold">{parameters.voiceName}</strong>
              </span>
            </div>
            <span className="text-zinc-600 hidden sm:inline">•</span>
            <span className="text-xs text-zinc-400 hidden sm:inline font-mono-tech">
              {text.trim() ? text.trim().split(/\s+/).length : 0} palabras
            </span>
            <span className="text-zinc-600 hidden sm:inline">•</span>
            <span className="text-xs text-zinc-400 hidden sm:inline font-mono-tech">
              Gemini 3.8 Flash TTS
            </span>
          </div>

          <button
            type="button"
            onClick={handleGenerateTTS}
            disabled={isGenerating || !text.trim()}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-zinc-950 font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2.5 shadow-lg shadow-amber-950/60 ring-2 ring-amber-400/50 cursor-pointer active:scale-95 transition-all disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-zinc-950" />
                <span>Sintetizando con {parameters.voiceName}...</span>
              </>
            ) : (
              <>
                <Mic className="w-4 h-4 fill-current text-zinc-950" />
                <span>Sintetizar Locución</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Solemn Documentary Archive Footer */}
      <footer className="border-t border-zinc-900 bg-zinc-950/80 py-6 text-center text-xs text-zinc-500 font-mono-tech">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="font-script-quote italic text-zinc-400">
            «El hombre, en su constante travesía hacia lo desconocido... continúa buscando su lugar en el cosmos.»
          </p>
          <div className="flex items-center gap-2 text-[11px]">
            <span>AuraNarrador Studio</span>
            <span>•</span>
            <span className="text-amber-500/80">Gemini 3.8 Flash TTS</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
