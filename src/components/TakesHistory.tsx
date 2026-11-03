import React from 'react';
import { History, Play, Trash2, Download, Clock, Sliders, Waves } from 'lucide-react';
import { AudioTake } from '../types';

interface TakesHistoryProps {
  takes: AudioTake[];
  currentTakeId?: string;
  onSelectTake: (take: AudioTake) => void;
  onDeleteTake: (id: string) => void;
  onClearAll: () => void;
}

export const TakesHistory: React.FC<TakesHistoryProps> = ({
  takes,
  currentTakeId,
  onSelectTake,
  onDeleteTake,
  onClearAll,
}) => {
  if (takes.length === 0) return null;

  return (
    <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/50 p-5 backdrop-blur-md shadow-xl mt-6">
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-zinc-800/80">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-amber-400" />
          <h3 className="font-serif-doc text-sm font-semibold text-zinc-200">
            Historial de Tomas y Grabaciones
          </h3>
          <span className="text-[10px] font-mono-tech px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300">
            {takes.length} {takes.length === 1 ? 'toma' : 'tomas'}
          </span>
        </div>

        <button
          type="button"
          onClick={onClearAll}
          className="text-xs text-zinc-500 hover:text-rose-400 transition-colors"
        >
          Limpiar historial
        </button>
      </div>

      <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
        {takes.map((take) => {
          const isSelected = take.id === currentTakeId;
          const dateStr = new Date(take.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

          return (
            <div
              key={take.id}
              className={`p-3 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                isSelected
                  ? 'bg-amber-500/10 border-amber-500/50 shadow-xs'
                  : 'bg-zinc-950/40 border-zinc-800 hover:border-zinc-700'
              }`}
            >
              <div className="flex items-start gap-3 min-w-0">
                <button
                  type="button"
                  onClick={() => onSelectTake(take)}
                  className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-transform active:scale-95 ${
                    isSelected
                      ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-950/40'
                      : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200'
                  }`}
                  title="Cargar y escuchar esta toma"
                >
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                </button>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-zinc-200 truncate">
                      {take.title}
                    </span>
                    <span className="text-[10px] font-mono-tech text-amber-400/90 bg-amber-400/10 px-1.5 py-0.2 rounded border border-amber-400/20">
                      {take.voiceName}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 font-script-quote line-clamp-1 mt-0.5">
                    "{take.text}"
                  </p>
                  <div className="flex items-center gap-2 text-[10px] font-mono-tech text-zinc-500 mt-1">
                    <span>{dateStr}</span>
                    <span>•</span>
                    <span>Est: {take.parameters.stability}%</span>
                    <span>•</span>
                    <span>Cla: {take.parameters.clarity}%</span>
                    <span>•</span>
                    <span>Exag: {take.parameters.styleExaggeration}%</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                <a
                  href={take.audioUrl}
                  download={`${take.title.slice(0, 25)}_take.wav`}
                  className="p-1.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 transition-colors"
                  title="Descargar archivo WAV"
                >
                  <Download className="w-3.5 h-3.5" />
                </a>
                <button
                  type="button"
                  onClick={() => onDeleteTake(take.id)}
                  className="p-1.5 rounded-lg bg-zinc-800/80 hover:bg-rose-950/60 hover:text-rose-400 text-zinc-400 transition-colors"
                  title="Eliminar de la lista"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
