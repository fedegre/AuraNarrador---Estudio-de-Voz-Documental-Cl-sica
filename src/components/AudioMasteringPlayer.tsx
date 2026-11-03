import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, Download, Volume2, VolumeX, Sparkles, Sliders, Waves, Check } from 'lucide-react';
import { AudioTake } from '../types';
import { AudioVisualizer } from './AudioVisualizer';
import { globalAudioEngine } from '../utils/audioEngine';

interface AudioMasteringPlayerProps {
  currentTake: AudioTake | null;
  onWarmthChange?: (active: boolean) => void;
}

export const AudioMasteringPlayer: React.FC<AudioMasteringPlayerProps> = ({ currentTake }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [volume, setVolume] = useState(0.9);
  const [isMuted, setIsMuted] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [warmthActive, setWarmthActive] = useState(true);
  const [copied, setCopied] = useState(false);

  // Initialize and attach Web Audio Engine
  useEffect(() => {
    if (audioRef.current) {
      globalAudioEngine.attachAudio(audioRef.current);
      globalAudioEngine.setWarmthBoost(warmthActive);
      globalAudioEngine.setVolume(isMuted ? 0 : volume);
    }
  }, [audioRef.current]);

  // Handle new take
  useEffect(() => {
    if (currentTake && audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
      setIsPlaying(true);
      globalAudioEngine.resume();
      audioRef.current.play().catch((err) => {
        console.log('Playback prevented by browser autoplay policy:', err);
        setIsPlaying(false);
      });
    }
  }, [currentTake?.id]);

  const togglePlay = () => {
    if (!audioRef.current || !currentTake) return;
    globalAudioEngine.resume();
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(err => {
        console.error('Play error:', err);
      });
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      if (audioRef.current.duration && !isNaN(audioRef.current.duration)) {
        setDuration(audioRef.current.duration);
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleRateChange = (rate: number) => {
    setPlaybackRate(rate);
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
    }
  };

  const toggleWarmth = () => {
    const nextVal = !warmthActive;
    setWarmthActive(nextVal);
    globalAudioEngine.setWarmthBoost(nextVal);
  };

  const toggleMute = () => {
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    if (audioRef.current) {
      audioRef.current.muted = nextMute;
    }
    globalAudioEngine.setVolume(nextMute ? 0 : volume);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    setVolume(v);
    setIsMuted(false);
    if (audioRef.current) {
      audioRef.current.muted = false;
    }
    globalAudioEngine.setVolume(v);
  };

  const handleDownload = () => {
    if (!currentTake) return;
    const a = document.createElement('a');
    a.href = currentTake.audioUrl;
    const cleanTitle = currentTake.title
      ? currentTake.title.toLowerCase().replace(/[^a-z0-9]/gi, '_').slice(0, 30)
      : 'narracion_documental';
    a.download = `${cleanTitle}_gemini38_baritono.wav`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs)) return '00:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (!currentTake) {
    return (
      <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-6 backdrop-blur-md text-center">
        <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
          <Waves className="w-7 h-7 stroke-[1.5]" />
        </div>
        <h3 className="font-serif-doc text-lg font-semibold text-zinc-200 mb-1">
          Monitor de Masterización y Salida
        </h3>
        <p className="text-sm text-zinc-400 max-w-md mx-auto">
          Genera una toma de locución o selecciona un guion de archivo para escuchar la síntesis con la acústica barítona en tiempo real.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-amber-900/30 bg-gradient-to-b from-zinc-900/90 to-zinc-950/90 p-5 backdrop-blur-xl shadow-2xl relative overflow-hidden">
      {/* Subtle Warm ambient glow */}
      <div className="absolute top-0 right-1/4 w-72 h-32 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Hidden audio element for Web Audio graph */}
      <audio
        ref={audioRef}
        src={currentTake.audioUrl}
        loop={isLooping}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleTimeUpdate}
        onEnded={() => setIsPlaying(false)}
        crossOrigin="anonymous"
      />

      {/* Header Info */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-zinc-800/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono-tech uppercase tracking-wider bg-amber-500/15 text-amber-300 border border-amber-500/30">
              Master WAV (24kHz Mono 16-bit)
            </span>
            <span className="text-xs text-zinc-400 font-mono-tech">
              Voz: <strong className="text-zinc-200">{currentTake.voiceName}</strong>
            </span>
          </div>
          <h3 className="text-base font-semibold text-zinc-100 mt-1 font-serif-doc line-clamp-1">
            {currentTake.title}
          </h3>
        </div>

        <div className="flex items-center gap-2">
          {/* Warmth EQ toggle */}
          <button
            type="button"
            onClick={toggleWarmth}
            title="Activar/Desactivar realce de resonancia torácica barítona analógica (140Hz)"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
              warmthActive
                ? 'bg-amber-500/20 text-amber-200 border-amber-500/50 shadow-sm shadow-amber-500/20'
                : 'bg-zinc-800/60 text-zinc-400 border-zinc-700 hover:text-zinc-200'
            }`}
          >
            <Sparkles className={`w-3.5 h-3.5 ${warmthActive ? 'text-amber-400 fill-amber-400/30' : ''}`} />
            <span>Calidez Barítono</span>
            <span className={`text-[10px] font-mono-tech px-1 rounded ${warmthActive ? 'bg-amber-400/20 text-amber-300' : 'bg-zinc-700 text-zinc-400'}`}>
              {warmthActive ? '+4.5dB' : 'FLAT'}
            </span>
          </button>

          {/* Download Button */}
          <button
            type="button"
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-zinc-300" />
            <span>Exportar WAV</span>
          </button>
        </div>
      </div>

      {/* Visualizer */}
      <div className="my-3">
        <AudioVisualizer isPlaying={isPlaying} />
      </div>

      {/* Progress timeline */}
      <div className="space-y-1 my-3">
        <div className="relative">
          <input
            type="range"
            min={0}
            max={duration || 100}
            step={0.01}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-500 hover:accent-amber-400 transition-all"
          />
        </div>
        <div className="flex justify-between text-[11px] font-mono-tech text-zinc-400 px-0.5">
          <span className="text-amber-400 font-medium">{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-zinc-800/60">
        {/* Play/Pause & Transport */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={togglePlay}
            className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 flex items-center justify-center shadow-lg shadow-amber-950/60 transition-transform active:scale-95"
            aria-label={isPlaying ? 'Pausar' : 'Reproducir'}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 fill-current" />
            ) : (
              <Play className="w-5 h-5 fill-current ml-0.5" />
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              if (audioRef.current) {
                audioRef.current.currentTime = 0;
                setCurrentTime(0);
              }
            }}
            title="Reiniciar reproducción"
            className="p-2 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setIsLooping(!isLooping)}
            title="Bucle continuo"
            className={`px-2 py-1 rounded text-[11px] font-mono-tech border transition-colors ${
              isLooping
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'text-zinc-400 border-zinc-800 hover:text-zinc-200'
            }`}
          >
            LOOP
          </button>
        </div>

        {/* Speed presets */}
        <div className="flex items-center gap-1 bg-zinc-950/70 p-1 rounded-lg border border-zinc-800">
          <span className="text-[10px] text-zinc-500 px-1.5 font-mono-tech">CADENCIA:</span>
          {[0.8, 0.9, 1.0, 1.1].map((rate) => (
            <button
              key={rate}
              type="button"
              onClick={() => handleRateChange(rate)}
              className={`px-2 py-0.5 rounded text-[11px] font-mono-tech transition-all ${
                playbackRate === rate
                  ? 'bg-amber-500 text-zinc-950 font-semibold shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {rate === 1.0 ? '1.0x' : `${rate}x`}
            </button>
          ))}
        </div>

        {/* Volume */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleMute}
            className="text-zinc-400 hover:text-zinc-200"
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="w-4 h-4 text-rose-400" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.02}
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            className="w-18 h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
          />
        </div>
      </div>
    </div>
  );
};
