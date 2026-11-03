import { VoiceOption, ScriptPreset } from '../types';

export const VOICE_OPTIONS: VoiceOption[] = [
  {
    id: 'Fenrir',
    name: 'Fenrir',
    gender: 'male',
    tone: 'Barítono Profundo & Resonante',
    description: 'Voz cavernosa con armónicos graves envolventes y presencia torácica. Ideal para documentales de gran escala.',
    recommendedFor: 'La Aventura del Hombre, documentales de naturaleza e historia épica',
    pitchRange: 'Barítono Bajo (Chest Resonance)',
  },
  {
    id: 'Charon',
    name: 'Charon',
    gender: 'male',
    tone: 'Grave, Solemne & Enigmático',
    description: 'Cadencia pausada y misteriosa, perfecta para arqueología, civilizaciones perdidas y el cosmos.',
    recommendedFor: 'Misterios arqueológicos, cosmología y crónicas del pasado',
    pitchRange: 'Bajo / Barítono',
  },
  {
    id: 'Puck',
    name: 'Puck',
    gender: 'male',
    tone: 'Articulado, Firme & Científico',
    description: 'Dicción impecable con un timbre analítico y educativo pero accesible.',
    recommendedFor: 'Divulgación científica, geología y biología evolutiva',
    pitchRange: 'Barítono Medio',
  },
  {
    id: 'Zephyr',
    name: 'Zephyr',
    gender: 'male',
    tone: 'Sereno, Cálido & Filosófico',
    description: 'Tono reflexivo y sosegado, transmite intimidad con la inmensidad del paisaje.',
    recommendedFor: 'Ensayos visuales, travesías solitarias y filosofía natural',
    pitchRange: 'Barítono Suave',
  },
  {
    id: 'Kore',
    name: 'Kore',
    gender: 'female',
    tone: 'Cálida, Majestuosa & Clara',
    description: 'Alternativa femenina de corte documental clásico, sobria y envolvente.',
    recommendedFor: 'Narraciones antropológicas y relatos orales',
    pitchRange: 'Mezzosoprano Calmo',
  },
];

export const SCRIPT_PRESETS: ScriptPreset[] = [
  {
    id: 'patagonia-viento',
    title: 'La Vastedad Patagónica (Estilo Pancho Ibáñez)',
    category: 'Naturaleza y Fauna',
    suggestedPacing: 'slow-to-moderate',
    excerpt: 'En los confines australes del continente, donde el viento no cesa jamás...',
    fullText: `En los confines australes del continente... donde el viento no cesa jamás... la estepa patagónica despliega su silencio milenario. <breath> Aquí, el tiempo no se mide en horas, sino en la erosión paciente de las rocas... y en el vuelo solitario del cóndor que vigila las cumbres heladas desde el principio de los tiempos.`,
  },
  {
    id: 'aventura-hombre',
    title: 'El Origen del Fuego (Homenaje a Ernesto Frith)',
    category: 'Historia y Arqueología',
    suggestedPacing: 'dramatic',
    excerpt: 'El hombre primitivo contemplaba la noche con el asombro del primer cazador...',
    fullText: `El hombre primitivo contemplaba la noche con el asombro del primer cazador. <breath> Frente a la tormenta implacable... una chispa furtiva rasgó la penumbra de la caverna. Con el dominio del fuego, no sólo conquistó el calor y la noche... sino que encendió la llama inextinguible de la civilización humana.`,
  },
  {
    id: 'cosmos-origen',
    title: 'El Eco del Big Bang y el Abismo Cósmico',
    category: 'Cosmos y Ciencia',
    suggestedPacing: 'slow',
    excerpt: 'Si pudiéramos escuchar el susurro primordial del universo...',
    fullText: `Si pudiéramos escuchar el susurro primordial del universo... hallaríamos una sinfonía nacida hace trece mil ochocientos millones de años. <breath> Somos polvo de estrellas condensado en conciencia... mirando hacia el abismo eterno para descifrar de dónde venimos... y hacia qué silencios nos dirigimos.`,
  },
  {
    id: 'machu-picchu',
    title: 'Machu Picchu: La Ciudad entre las Nubes',
    category: 'Historia y Arqueología',
    suggestedPacing: 'slow-to-moderate',
    excerpt: 'Erigida sobre crestas de granito impenetrable...',
    fullText: `Erigida sobre crestas de granito impenetrable... entre los velos flotantes de la niebla andina, descansa la fortaleza incaica de Machu Picchu. <breath> Cada piedra tallada con precisión milimétrica desafía los siglos... guardando para siempre los secretos de una civilización que tocó el cielo con sus manos.`,
  },
  {
    id: 'abismo-marino',
    title: 'Las Criaturas de la Fosa Abisal',
    category: 'Naturaleza y Fauna',
    suggestedPacing: 'slow',
    excerpt: 'A diez mil metros bajo la superficie, donde la luz del sol se extingue...',
    fullText: `A diez mil metros bajo la superficie del océano... donde la luz del sol se extingue por completo y la presión aplastaría cualquier intento humano... la vida encuentra una forma insospechada de florecer. Criaturas bioluminiscentes flotan en la negrura absoluta... como constelaciones submarinas de un mundo aún por descubrir.`,
  },
];

export const DEFAULT_PERSONA_GUIDE = {
  role: 'Narrador Documental Clásico',
  reference: 'Pancho Ibáñez y Ernesto Frith ("La Aventura del Hombre")',
  idiom: 'Español Latinoamericano Neutro (Rioplatense / Culto Documental sin giros vulgares)',
  pitch: 'Barítono profundo con rica resonancia pectoral y frecuencias sub-graves cálidas.',
  pacing: 'Lento a moderado, con pausas dramáticas reflexivas y silencios cargados de significado.',
  articulation: 'Dicción límpida, control sutil de aire (<breath>), transiciones armónicas sin estridencias.',
  emotion: 'Solemne, reverente, sabio, evocador y profundamente profesional.',
};
