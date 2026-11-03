import React, { useState } from 'react';
import { Radio, Info, X, Sparkles, Volume2, Film, ShieldCheck } from 'lucide-react';
import { DEFAULT_PERSONA_GUIDE } from '../data/presets';

export const Header: React.FC = () => {
  const [showInfo, setShowInfo] = useState(false);

  return (
    <>
      <header className="border-b border-zinc-800/80 bg-zinc-950/70 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          {/* Logo & Branding */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 via-amber-500 to-amber-400 p-0.5 shadow-lg shadow-amber-950/40">
              <div className="w-full h-full bg-zinc-950 rounded-[10px] flex items-center justify-center">
                <Radio className="w-5 h-5 text-amber-400 animate-pulse" />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-serif-doc text-lg sm:text-xl font-bold tracking-tight text-zinc-100">
                  AuraNarrador
                </h1>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono-tech uppercase tracking-widest bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  kokoro-local
                </span>
              </div>
              <p className="text-xs text-zinc-400 flex items-center gap-1.5">
                <span>Voz Documental Clásica</span>
                <span className="text-zinc-600">•</span>
                <span className="text-zinc-400 font-mono-tech text-[11px]">Homenaje a Pancho Ibáñez & Ernesto Frith</span>
              </p>
            </div>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-[11px] font-mono-tech text-zinc-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>24kHz Audio Studio Engine</span>
            </div>

            <button
              type="button"
              onClick={() => setShowInfo(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-amber-300 text-xs font-medium transition-colors"
            >
              <Info className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Guía de Persona & Acústica</span>
              <span className="sm:hidden">Info</span>
            </button>
          </div>
        </div>
      </header>

      {/* Info Modal */}
      {showInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-2xl bg-zinc-900 border border-amber-900/40 rounded-2xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setShowInfo(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                <Film className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-serif-doc text-lg font-bold text-zinc-100">
                  Especificación de Persona & Calibración de Voz
                </h3>
                <p className="text-xs text-zinc-400 font-mono-tech">
                  Kokoro (local) • Síntesis Barítona
                </p>
              </div>
            </div>

            <div className="space-y-4 text-xs text-zinc-300 leading-relaxed">
              <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800">
                <h4 className="font-bold text-amber-300 uppercase tracking-wider text-[11px] mb-1 font-mono-tech">
                  Role & Persona
                </h4>
                <p className="italic font-script-quote text-sm text-zinc-200">
                  "Una voz madura, cálida, profunda y autoritaria de narrador masculino, hablando en español latinoamericano estándar (estilo documental rioplatense / argentino, neutro y sin modismos para audiencias generales). Tono formal, solemne, serio, altamente profesional y evocador, reminiscente de Pancho Ibáñez y Ernesto Frith en 'La Aventura del Hombre'."
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-zinc-950/60 border border-zinc-800">
                  <span className="font-semibold text-zinc-200 block mb-0.5">Tono & Pitch:</span>
                  <span className="text-zinc-400">Barítono bajo con rica resonancia torácica y presencia sub-grave envolvente.</span>
                </div>
                <div className="p-3 rounded-lg bg-zinc-950/60 border border-zinc-800">
                  <span className="font-semibold text-zinc-200 block mb-0.5">Cadencia & Ritmo:</span>
                  <span className="text-zinc-400">Tempo lento a moderado, con pausas dramáticas deliberadas entre cláusulas para transmitir peso histórico y científico.</span>
                </div>
                <div className="p-3 rounded-lg bg-zinc-950/60 border border-zinc-800">
                  <span className="font-semibold text-zinc-200 block mb-0.5">Articulación:</span>
                  <span className="text-zinc-400">Dicción impecable y nítida, respiración natural suave (&lt;breath&gt;) y transiciones sin altibajos estridentes.</span>
                </div>
                <div className="p-3 rounded-lg bg-zinc-950/60 border border-zinc-800">
                  <span className="font-semibold text-zinc-200 block mb-0.5">Tono Emocional:</span>
                  <span className="text-zinc-400">Reverente, reflexivo, sabio y con solemne respeto por la naturaleza, el cosmos y la historia humana.</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-500/20">
                <h4 className="font-bold text-amber-300 text-xs mb-1.5 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Directivas Técnicas Aplicadas
                </h4>
                <ul className="list-disc list-inside space-y-1 text-zinc-300">
                  <li><strong>Estabilidad (70% - 85%):</strong> Mantiene la postura sobria evitando quiebres emocionales erráticos.</li>
                  <li><strong>Claridad / Fidelidad (75% - 90%):</strong> Maximiza la nitidez de la articulación barítona en frecuencias medias-bajas.</li>
                  <li><strong>Exageración de Estilo (10% - 25%):</strong> Locución natural de documental sin forzar teatralidad excesiva.</li>
                </ul>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-zinc-800 flex justify-end">
              <button
                type="button"
                onClick={() => setShowInfo(false)}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold text-xs rounded-xl transition-colors"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
