import React, { useState } from 'react';
import { Sliders, Mic2, HelpCircle, CheckCircle2, RotateCcw, Edit3, Volume2, Loader2, Sparkles } from 'lucide-react';
import { AcousticParameters, VoiceOption } from '../types';
import { VOICE_OPTIONS } from '../data/presets';

interface PersonaConfigPanelProps {
  parameters: AcousticParameters;
  onChange: (newParams: AcousticParameters) => void;
  customPersona: string;
  onCustomPersonaChange: (persona: string) => void;
  onPreviewSample: (voiceName: string) => Promise<void>;
  samplingVoice: string | null;
}

const VOICE_METADATA_MAP: Record<string, { role: string; title: string; desc: string; tag: string }> = {
  Fenrir: {
    role: 'Documental Rioplatense Clásico',
    title: 'Ernesto Frith & Pancho Ibáñez',
    desc: 'Barítono cavernoso con rica resonancia pectoral. Cadencia pausada, reverente y de gran peso histórico para documentales de gran escala.',
    tag: 'Barítono Bajo Cavernoso',
  },
  Charon: {
    role: 'Documental Arqueológico & Cósmico',
    title: 'Narrador Solemne & Enigmático',
    desc: 'Registro bajo y oscuro con pausas cargadas de misterio. Perfecto para cosmología, civilizaciones perdidas y enigmas de la antigüedad.',
    tag: 'Bajo Oscuro & Misterioso',
  },
  Puck: {
    role: 'Divulgación Científica & Biológica',
    title: 'Narrador Analítico & Articulado',
    desc: 'Dicción rápida, nítida y timbre inteligente. Diseñado para documentales sobre evolución, física cuántica y exploración de la naturaleza.',
    tag: 'Barítono Medio Científico',
  },
  Zephyr: {
    role: 'Ensayo Visual & Poético',
    title: 'Narrador Sereno & Filosófico',
    desc: 'Timbre cálido, suave y contemplativo. Transmite intimidad y comunión con los paisajes vírgenes y la soledad del viento.',
    tag: 'Barítono Suave & Cálido',
  },
  Kore: {
    role: 'Locución Institucional & Cultural',
    title: 'Narradora Solemne & Majestuosa',
    desc: 'Voz femenina de gran presencia, clara y envolvente. Ideal para antropología, memoria histórica y relatos de pueblos originarios.',
    tag: 'Mezzosoprano Documental Femenina',
  },
};

export const PersonaConfigPanel: React.FC<PersonaConfigPanelProps> = ({
  parameters,
  onChange,
  customPersona,
  onCustomPersonaChange,
  onPreviewSample,
  samplingVoice,
}) => {
  const [showPersonaEditor, setShowPersonaEditor] = useState(false);

  const resetToDefaults = () => {
    onChange({
      stability: 80,
      clarity: 85,
      styleExaggeration: 15,
      pacing: 'slow-to-moderate',
      voiceName: 'Fenrir',
    });
  };

  const selectedVoice = VOICE_OPTIONS.find((v) => v.id === parameters.voiceName) || VOICE_OPTIONS[0];
  const activeMeta = VOICE_METADATA_MAP[selectedVoice.id] || VOICE_METADATA_MAP['Fenrir'];

  const handleVoiceSelect = async (voiceId: string) => {
    onChange({ ...parameters, voiceName: voiceId });
    // Also trigger sample preview so user immediately hears what the new voice sounds like!
    await onPreviewSample(voiceId);
  };

  return (
    <div className="rounded-2xl border border-zinc-800/90 bg-zinc-900/60 p-5 backdrop-blur-md shadow-xl flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-zinc-800/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-serif-doc text-base font-bold text-zinc-100 flex items-center gap-2">
                Parámetros Acústicos
                <span className="text-[10px] font-mono-tech font-normal px-1.5 py-0.5 rounded bg-zinc-800 text-amber-300 border border-zinc-700">
                  kokoro-local
                </span>
              </h2>
              <p className="text-xs text-zinc-400">Calibración de timbre, cadencia y directivas</p>
            </div>
          </div>

          <button
            type="button"
            onClick={resetToDefaults}
            title="Restablecer valores recomendados del prompt"
            className="flex items-center gap-1 text-[11px] font-mono-tech text-zinc-400 hover:text-amber-300 px-2 py-1 rounded bg-zinc-800/60 hover:bg-zinc-800 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        </div>

        {/* Dynamic Selected Persona Card */}
        <div className="rounded-xl border border-amber-900/30 bg-gradient-to-r from-amber-950/20 via-zinc-900/90 to-zinc-900/80 p-3.5 mb-5 relative transition-all">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="text-[10px] font-mono-tech uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Persona Activa: {activeMeta.role}
              </div>
              <h3 className="text-sm font-semibold text-zinc-100 mt-1 flex items-center gap-2">
                <span>{activeMeta.title}</span>
                <span className="text-[10px] font-mono-tech text-amber-300/90 px-1.5 py-0.5 rounded bg-amber-400/10 border border-amber-500/20 font-normal">
                  {selectedVoice.id}
                </span>
              </h3>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                {activeMeta.desc}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowPersonaEditor(!showPersonaEditor)}
              className="text-xs text-amber-300 hover:text-amber-200 p-1.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-800 border border-amber-500/20 transition-colors flex items-center gap-1 shrink-0"
              title="Ver o personalizar directiva completa de persona"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Prompt</span>
            </button>
          </div>

          {/* Raw Prompt Inspector Dropdown */}
          {showPersonaEditor && (
            <div className="mt-3 pt-3 border-t border-zinc-800/80 animate-in fade-in duration-200">
              <label className="block text-[11px] font-mono-tech text-zinc-300 mb-1">
                Directiva Completa de Estilo y Persona (speechMetadata.style):
              </label>
              <textarea
                value={customPersona}
                onChange={(e) => onCustomPersonaChange(e.target.value)}
                rows={5}
                className="w-full text-xs font-mono-tech p-2.5 rounded-lg bg-black/60 border border-zinc-700 text-zinc-300 focus:outline-none focus:border-amber-500 transition-colors"
                placeholder="Personaliza las directivas acústicas de la voz..."
              />
              <div className="flex justify-end gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => onCustomPersonaChange('')}
                  className="text-[11px] text-zinc-400 hover:text-zinc-200"
                >
                  Restaurar Original
                </button>
                <button
                  type="button"
                  onClick={() => setShowPersonaEditor(false)}
                  className="px-2.5 py-1 text-xs bg-amber-500 hover:bg-amber-400 text-zinc-950 font-medium rounded"
                >
                  Listo
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Voice Selector Grid with Instant Audio Preview Button */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-zinc-300 font-serif-doc">
              Timbre de Voz Base
            </label>
            <span className="text-[10px] font-mono-tech text-zinc-400">
              Haz clic para seleccionar y oír muestra
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {VOICE_OPTIONS.map((voice) => {
              const isSelected = voice.id === parameters.voiceName;
              const isSampling = samplingVoice === voice.id;

              return (
                <div
                  key={voice.id}
                  className={`p-2.5 rounded-xl border transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'bg-amber-500/15 border-amber-500/70 shadow-sm shadow-amber-500/20 ring-1 ring-amber-500/30'
                      : 'bg-zinc-950/40 border-zinc-800/80 hover:border-zinc-700'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <button
                        type="button"
                        onClick={() => handleVoiceSelect(voice.id)}
                        className="text-left font-bold text-xs flex items-center gap-1.5 cursor-pointer flex-1"
                      >
                        <span className={isSelected ? 'text-amber-300' : 'text-zinc-200'}>
                          {voice.name}
                        </span>
                        {voice.gender === 'female' ? (
                          <span className="text-[9px] font-mono-tech px-1 rounded bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/30">
                            FEM
                          </span>
                        ) : (
                          <span className="text-[9px] font-mono-tech px-1 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                            MASC
                          </span>
                        )}
                      </button>

                      {/* Explicit Play Sample Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleVoiceSelect(voice.id);
                        }}
                        disabled={isSampling}
                        title={`Escuchar muestra rápida de ${voice.name}`}
                        className={`p-1 rounded-lg text-[10px] font-mono-tech flex items-center gap-1 transition-all ${
                          isSelected
                            ? 'bg-amber-500 text-zinc-950 font-bold shadow-xs hover:bg-amber-400'
                            : 'bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300'
                        }`}
                      >
                        {isSampling ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Volume2 className="w-3 h-3" />
                        )}
                        <span className="hidden sm:inline">Oír</span>
                      </button>
                    </div>

                    <div className="text-[11px] text-zinc-400 leading-snug line-clamp-2">
                      {voice.tone}
                    </div>
                  </div>

                  <div className="mt-2 pt-1.5 border-t border-zinc-800/60 flex items-center justify-between text-[10px] font-mono-tech text-zinc-500">
                    <span className="truncate">{voice.pitchRange}</span>
                    {isSelected && (
                      <span className="text-amber-400 font-bold text-[9px]">ACTIVA</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Technical Slider 1: Stability */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <div className="flex items-center gap-1.5 text-zinc-200 font-medium">
              <span>Estabilidad (Stability)</span>
              <span className="text-[10px] text-zinc-500 font-mono-tech">(70% - 85%)</span>
            </div>
            <span className="font-mono-tech font-bold text-amber-400 text-xs">
              {parameters.stability}%
            </span>
          </div>
          <input
            type="range"
            min={50}
            max={100}
            step={1}
            value={parameters.stability}
            onChange={(e) => onChange({ ...parameters, stability: parseInt(e.target.value) })}
            className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
          />
          <div className="flex justify-between text-[10px] text-zinc-500 mt-1 font-mono-tech">
            <span>Fluctuante</span>
            <span className="text-amber-400/80">Rango Óptimo</span>
            <span>Rígido</span>
          </div>
        </div>

        {/* Technical Slider 2: Clarity / Similarity */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <div className="flex items-center gap-1.5 text-zinc-200 font-medium">
              <span>Claridad / Fidelidad (Clarity)</span>
              <span className="text-[10px] text-zinc-500 font-mono-tech">(75% - 90%)</span>
            </div>
            <span className="font-mono-tech font-bold text-amber-400 text-xs">
              {parameters.clarity}%
            </span>
          </div>
          <input
            type="range"
            min={60}
            max={100}
            step={1}
            value={parameters.clarity}
            onChange={(e) => onChange({ ...parameters, clarity: parseInt(e.target.value) })}
            className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
          />
          <div className="flex justify-between text-[10px] text-zinc-500 mt-1 font-mono-tech">
            <span>Suave</span>
            <span className="text-amber-400/80">Articulación Barítona Alta</span>
            <span>Ultra Nítida</span>
          </div>
        </div>

        {/* Technical Slider 3: Style Exaggeration */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <div className="flex items-center gap-1.5 text-zinc-200 font-medium">
              <span>Exageración de Estilo</span>
              <span className="text-[10px] text-zinc-500 font-mono-tech">(10% - 25%)</span>
            </div>
            <span className="font-mono-tech font-bold text-amber-400 text-xs">
              {parameters.styleExaggeration}%
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={50}
            step={1}
            value={parameters.styleExaggeration}
            onChange={(e) => onChange({ ...parameters, styleExaggeration: parseInt(e.target.value) })}
            className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
          />
          <div className="flex justify-between text-[10px] text-zinc-500 mt-1 font-mono-tech">
            <span>0% Neutro</span>
            <span className="text-amber-400/80">15% Natural Documental</span>
            <span>50% Teatral</span>
          </div>
        </div>

        {/* Pacing & Cadencia */}
        <div className="mb-2">
          <label className="block text-xs font-semibold text-zinc-300 mb-2 font-serif-doc">
            Cadencia & Pausas Dramáticas
          </label>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {[
              { id: 'slow', label: 'Lento & Reflexivo', desc: 'Pausas cósmicas profundas' },
              { id: 'slow-to-moderate', label: 'Lento a Moderado', desc: 'Estándar Pancho Ibáñez' },
              { id: 'moderate', label: 'Moderado Solemne', desc: 'Ritmo documental continuo' },
              { id: 'dramatic', label: 'Dramático Enérgico', desc: 'Tensión histórica y clímax' },
            ].map((p) => {
              const isSelected = parameters.pacing === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onChange({ ...parameters, pacing: p.id as any })}
                  className={`p-2 rounded-lg border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-amber-500/20 border-amber-500 text-zinc-100 font-medium'
                      : 'bg-zinc-950/40 border-zinc-800/80 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  <div className="text-xs font-medium">{p.label}</div>
                  <div className="text-[10px] text-zinc-500">{p.desc}</div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Acoustic compliance footer */}
      <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-400 font-mono-tech">
        <span className="flex items-center gap-1.5 text-emerald-400">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Perfil Acústico Óptimo
        </span>
        <span className="text-zinc-500">24kHz RIFF WAV</span>
      </div>
    </div>
  );
};
