import React, { useState } from 'react';
import { Mic, Wand2, BookOpen, Clock, FileText, CornerDownLeft, Sparkles, Loader2, AlertCircle } from 'lucide-react';
import { SCRIPT_PRESETS } from '../data/presets';
import { ScriptPreset } from '../types';

interface ScriptEditorProps {
  text: string;
  onChange: (val: string) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  onSelectPreset: (preset: ScriptPreset) => void;
  selectedPresetId?: string;
  error?: string | null;
  activeVoiceName?: string;
}

export const ScriptEditor: React.FC<ScriptEditorProps> = ({
  text,
  onChange,
  onGenerate,
  isGenerating,
  onSelectPreset,
  selectedPresetId,
  error,
  activeVoiceName = 'Fenrir',
}) => {
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [enhanceSuccess, setEnhanceSuccess] = useState(false);

  // Approximate reading speed for solemn documentary: ~105 words/min
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const chars = text.length;
  const estimatedSeconds = Math.ceil((words / 105) * 60);

  const insertCue = (cue: string) => {
    onChange(`${text} ${cue} `);
  };

  const handleEnhanceWithAI = async () => {
    if (!text.trim() || isEnhancing || isGenerating) return;
    setIsEnhancing(true);
    setEnhanceSuccess(false);

    try {
      const res = await fetch('/api/script/enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draftText: text }),
      });
      const data = await res.json();
      if (data.enhancedScript) {
        onChange(data.enhancedScript);
        setEnhanceSuccess(true);
        setTimeout(() => setEnhanceSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Enhancement error:', err);
    } finally {
      setIsEnhancing(false);
    }
  };

  return (
    <div className="rounded-2xl border border-zinc-800/90 bg-zinc-900/60 p-5 backdrop-blur-md shadow-xl flex flex-col justify-between">
      <div>
        {/* Presets Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-zinc-300 font-serif-doc flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-amber-400" />
              Guiones Clásicos de Archivo Documental
            </span>
            <span className="text-[10px] font-mono-tech text-zinc-500">
              Selecciona un extracto
            </span>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1.5 scrollbar-thin">
            {SCRIPT_PRESETS.map((p) => {
              const isSelected = selectedPresetId === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onSelectPreset(p)}
                  className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap transition-all border shrink-0 ${
                    isSelected
                      ? 'bg-amber-500/20 text-amber-200 border-amber-500/60 shadow-sm'
                      : 'bg-zinc-950/40 text-zinc-400 border-zinc-800 hover:border-zinc-700 hover:text-zinc-200'
                  }`}
                >
                  <span className="font-medium">{p.title}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Textarea Label & Insertion Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-zinc-200 font-serif-doc flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-amber-400" />
              <span>Texto para Locución</span>
            </label>
            <span className="text-[10px] font-mono-tech px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30">
              Voz: <strong>{activeVoiceName}</strong>
            </span>
          </div>

          {/* Quick Top 'Sintetizar Locución' Button */}
          <button
            type="button"
            onClick={onGenerate}
            disabled={isGenerating || !text.trim()}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-zinc-950 font-bold text-xs flex items-center gap-2 shadow-md shadow-amber-950/40 ring-2 ring-amber-400/40 transition-all cursor-pointer active:scale-95 disabled:opacity-40 disabled:pointer-events-none"
            title="Sintetizar locución con Gemini 3.8 Flash TTS"
          >
            {isGenerating ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Mic className="w-3.5 h-3.5 fill-current text-zinc-950" />
            )}
            <span>Sintetizar Locución</span>
          </button>
        </div>

        {/* Quick Vocal Cues Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-1.5 mb-2 text-[11px] font-mono-tech bg-zinc-950/60 p-2 rounded-xl border border-zinc-800/80">
          <span className="text-zinc-500 text-[10px] hidden sm:inline">INSERTAR EFECTOS VOCALES:</span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => insertCue('...')}
              className="px-2 py-0.5 rounded bg-zinc-800/80 hover:bg-zinc-700 text-amber-300 border border-zinc-700 transition-colors"
              title="Inserta una pausa dramática reflexiva"
            >
              + [Pausa ...]
            </button>
            <button
              type="button"
              onClick={() => insertCue('<breath>')}
              className="px-2 py-0.5 rounded bg-zinc-800/80 hover:bg-zinc-700 text-amber-300 border border-zinc-700 transition-colors"
              title="Inserta un respiro humano sutil"
            >
              + &lt;breath&gt;
            </button>
            <button
              type="button"
              onClick={handleEnhanceWithAI}
              disabled={isEnhancing || isGenerating || !text.trim()}
              className="flex items-center gap-1 px-2.5 py-0.5 rounded bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 transition-all disabled:opacity-40"
              title="Reescribe el texto con el estilo de narración de La Aventura del Hombre"
            >
              {isEnhancing ? (
                <Loader2 className="w-3 h-3 animate-spin text-amber-400" />
              ) : (
                <Wand2 className="w-3 h-3 text-amber-400" />
              )}
              <span>{isEnhancing ? 'Optimizando...' : 'Estilo Documental (IA)'}</span>
            </button>
          </div>
        </div>

        {/* Text Input Area */}
        <div className="relative">
          <textarea
            value={text}
            onChange={(e) => onChange(e.target.value)}
            rows={7}
            placeholder="Escribe o pega aquí el guion que deseas sintetizar con la voz solemne del narrador..."
            className="w-full rounded-xl bg-zinc-950/80 border border-zinc-800 p-4 text-sm sm:text-base text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/80 focus:ring-1 focus:ring-amber-500/30 transition-all font-script-quote leading-relaxed shadow-inner"
          />

          {enhanceSuccess && (
            <div className="absolute top-3 right-4 px-2 py-1 rounded bg-amber-500/90 text-zinc-950 text-xs font-mono-tech font-bold animate-in fade-in">
              ✨ Guion adaptado al estilo documental
            </div>
          )}
        </div>

        {/* Word count and pacing telemetry */}
        <div className="flex items-center justify-between text-xs font-mono-tech text-zinc-400 mt-2 px-1">
          <div className="flex items-center gap-3">
            <span>{words} palabras</span>
            <span className="text-zinc-600">•</span>
            <span>{chars} caracteres</span>
          </div>
          <div className="flex items-center gap-1.5 text-amber-400/90">
            <Clock className="w-3.5 h-3.5" />
            <span>Duración est.: ~{estimatedSeconds}s (a 105 ppm)</span>
          </div>
        </div>

        {/* Error notification if any */}
        {error && (
          <div className="mt-3 p-3 rounded-xl bg-red-950/50 border border-red-500/40 text-red-300 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="leading-relaxed">{error}</div>
          </div>
        )}
      </div>

      {/* Synthesis Primary Action (Highlighted Broadcast Studio Style) */}
      <div className="mt-5 pt-4 border-t border-zinc-800/80">
        <div className="p-1 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 shadow-xl shadow-amber-950/60 ring-2 ring-amber-400/50 animate-pulse">
          <button
            type="button"
            onClick={onGenerate}
            disabled={isGenerating || !text.trim()}
            className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-zinc-950 font-black text-base sm:text-lg tracking-wide uppercase flex flex-col sm:flex-row items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin text-zinc-950" />
                <span>Sintetizando Locución con {activeVoiceName}...</span>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-red-600 animate-ping"></span>
                  <Mic className="w-6 h-6 text-zinc-950 fill-current" />
                  <span>Sintetizar Locución</span>
                </div>
                <span className="text-xs font-mono-tech normal-case font-bold bg-black/20 px-2.5 py-1 rounded-lg text-zinc-950 border border-black/10">
                  Voz: {activeVoiceName} • 24kHz WAV
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
