import React, { useEffect, useRef, useState } from 'react';
import { globalAudioEngine } from '../utils/audioEngine';

interface AudioVisualizerProps {
  isPlaying: boolean;
  mode?: 'frequency' | 'oscilloscope';
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ isPlaying, mode = 'frequency' }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const [currentMode, setCurrentMode] = useState<'frequency' | 'oscilloscope'>(mode);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dataArray = new Uint8Array(128);

    const render = () => {
      animFrameRef.current = requestAnimationFrame(render);

      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      // Background subtle gradient
      const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
      bgGrad.addColorStop(0, '#0a0d14');
      bgGrad.addColorStop(1, '#0e121b');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Grid lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.lineWidth = 1;
      for (let y = 0; y < height; y += 20) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      if (currentMode === 'frequency') {
        globalAudioEngine.getFrequencyData(dataArray);

        const barCount = 48;
        const barWidth = (width / barCount) - 2;
        const step = Math.floor(dataArray.length / barCount);

        for (let i = 0; i < barCount; i++) {
          let val = isPlaying ? dataArray[i * step] || 0 : (Math.sin(Date.now() / 300 + i * 0.2) * 4 + 6);
          // Scale bar height
          const barHeight = Math.max(3, (val / 255) * (height - 12));

          const x = i * (barWidth + 2);
          const y = height - barHeight;

          // Vintage Warm Amber / Gold / Copper gradient
          const grad = ctx.createLinearGradient(0, height, 0, y);
          grad.addColorStop(0, '#b45309'); // deep amber
          grad.addColorStop(0.5, '#f59e0b'); // bright gold
          grad.addColorStop(1, '#fde68a'); // luminous cream

          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.roundRect(x, y, barWidth, barHeight, [2, 2, 0, 0]);
          ctx.fill();

          // Peak cap highlight
          if (val > 40) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(x, Math.max(0, y - 2), barWidth, 1.5);
          }
        }
      } else {
        // Oscilloscope mode
        globalAudioEngine.getTimeDomainData(dataArray);

        ctx.lineWidth = 2.5;
        ctx.strokeStyle = '#38bdf8';
        ctx.shadowColor = '#0284c7';
        ctx.shadowBlur = 8;

        ctx.beginPath();
        const sliceWidth = width / dataArray.length;
        let x = 0;

        for (let i = 0; i < dataArray.length; i++) {
          const v = isPlaying ? dataArray[i] / 128.0 : 1 + Math.sin(Date.now() / 400 + i * 0.1) * 0.04;
          const y = (v * height) / 2;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
          x += sliceWidth;
        }

        ctx.lineTo(width, height / 2);
        ctx.stroke();
        ctx.shadowBlur = 0;
      }
    };

    render();

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isPlaying, currentMode]);

  return (
    <div className="relative rounded-xl border border-amber-950/40 bg-zinc-950 p-2 overflow-hidden shadow-inner">
      <div className="absolute top-2 right-3 z-10 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setCurrentMode(currentMode === 'frequency' ? 'oscilloscope' : 'frequency')}
          className="text-[10px] font-mono-tech tracking-wider uppercase px-2 py-0.5 rounded bg-zinc-800/80 hover:bg-zinc-700 text-amber-300 border border-amber-500/20 transition-colors"
        >
          {currentMode === 'frequency' ? 'Vista: Espectro' : 'Vista: Osciloscopio'}
        </button>
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-black/60 border border-zinc-800 text-[10px] font-mono-tech text-zinc-400">
          <span className={`w-1.5 h-1.5 rounded-full ${isPlaying ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-600'}`}></span>
          {isPlaying ? 'REC-OUT 24kHz' : 'STANDBY'}
        </div>
      </div>

      <canvas
        ref={canvasRef}
        width={700}
        height={90}
        className="w-full h-20 md:h-24 rounded-lg block"
      />
    </div>
  );
};
