/**
 * Audio Engine using Web Audio API for playback, spectrum analysis,
 * baritone warmth EQ filter, and real-time visualization data.
 */

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private audioEl: HTMLAudioElement | null = null;
  private sourceNode: MediaElementAudioSourceNode | null = null;
  private analyserNode: AnalyserNode | null = null;
  private bassBoostNode: BiquadFilterNode | null = null;
  private gainNode: GainNode | null = null;
  private isConnected = false;

  private initContext() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioContextClass();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public attachAudio(audioElement: HTMLAudioElement) {
    this.audioEl = audioElement;
    this.initContext();

    if (!this.isConnected && this.ctx && this.audioEl) {
      try {
        this.sourceNode = this.ctx.createMediaElementSource(this.audioEl);

        // Analyser for visualizer
        this.analyserNode = this.ctx.createAnalyser();
        this.analyserNode.fftSize = 256;
        this.analyserNode.smoothingTimeConstant = 0.8;

        // Warmth / Baritone Chest Resonance Filter (peaking around 140Hz)
        this.bassBoostNode = this.ctx.createBiquadFilter();
        this.bassBoostNode.type = 'peaking';
        this.bassBoostNode.frequency.value = 140; // Warm chest fundamental
        this.bassBoostNode.Q.value = 1.2;
        this.bassBoostNode.gain.value = 0; // default flat

        // Gain node for master volume
        this.gainNode = this.ctx.createGain();
        this.gainNode.gain.value = 1.0;

        // Connect graph: Source -> BassFilter -> Gain -> Analyser -> Destination
        this.sourceNode.connect(this.bassBoostNode);
        this.bassBoostNode.connect(this.gainNode);
        this.gainNode.connect(this.analyserNode);
        this.analyserNode.connect(this.ctx.destination);

        this.isConnected = true;
      } catch (err) {
        console.warn('AudioContext already connected or blocked:', err);
      }
    }
  }

  public setWarmthBoost(enable: boolean) {
    if (this.bassBoostNode && this.ctx) {
      // +4 dB at 140Hz gives rich analogue documentary warmth
      const targetGain = enable ? 4.5 : 0;
      this.bassBoostNode.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.05);
    }
  }

  public setVolume(volume: number) {
    if (this.gainNode && this.ctx) {
      this.gainNode.gain.setTargetAtTime(Math.max(0, Math.min(1, volume)), this.ctx.currentTime, 0.02);
    }
  }

  public getFrequencyData(array: Uint8Array): void {
    if (this.analyserNode) {
      this.analyserNode.getByteFrequencyData(array as any);
    }
  }

  public getTimeDomainData(array: Uint8Array): void {
    if (this.analyserNode) {
      this.analyserNode.getByteTimeDomainData(array as any);
    }
  }

  public resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }
}

export const globalAudioEngine = new AudioEngine();
