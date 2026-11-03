export interface VoiceOption {
  id: string;
  name: string;
  gender: 'male' | 'female';
  tone: string;
  description: string;
  recommendedFor: string;
  pitchRange: string;
}

export interface AcousticParameters {
  stability: number; // 0 to 100
  clarity: number; // 0 to 100
  styleExaggeration: number; // 0 to 100
  pacing: 'slow' | 'slow-to-moderate' | 'moderate' | 'dramatic';
  voiceName: string;
}

export interface AudioTake {
  id: string;
  timestamp: number;
  text: string;
  audioUrl: string;
  audioBase64: string;
  mimeType: string;
  duration?: number;
  voiceName: string;
  parameters: AcousticParameters;
  title: string;
}

export interface ScriptPreset {
  id: string;
  title: string;
  category: 'Naturaleza y Fauna' | 'Historia y Arqueología' | 'Cosmos y Ciencia' | 'Filosofía y Tiempo';
  excerpt: string;
  fullText: string;
  suggestedPacing: 'slow' | 'slow-to-moderate' | 'dramatic';
}
