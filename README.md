# AuraNarrador - Estudio de Voz Documental Clásica 🎙️

Estudio profesional de síntesis y modulación de voz (TTS) con **Gemini 3.8 Flash TTS** (`gemini-3.8-flash-tts`), calibrado para emular la locución solemne, profunda y barítona estilo documental latinoamericano (inspirado en **Pancho Ibáñez** y **Ernesto Frith** en *"La Aventura del Hombre"*).

---

## 🚀 Requisitos Previos

- [Node.js](https://nodejs.org/) (versión 18 o superior).
- Clave de API de Gemini ([Obtener en Google AI Studio](https://aistudio.google.com/app/apikey)).
- [Claude Code](https://docs.anthropic.com/en/docs/agents-and-tools/claude-code) instalado en tu terminal (opcional, para desarrollo asistido).

---

## 📦 Instalación Local

1. **Clonar o descargar el repositorio**:
   ```bash
   git clone <URL_DE_TU_REPOSITORIO>
   cd auranarrador
   ```

2. **Instalar dependencias**:
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**:
   Copia el archivo `.env.example` como `.env`:
   ```bash
   cp .env.example .env
   ```
   Abre `.env` y agrega tu clave de Gemini:
   ```env
   GEMINI_API_KEY="AIzaSy..."
   PORT=3000
   ```

4. **Iniciar en modo desarrollo**:
   ```bash
   npm run dev
   ```
   Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

5. **Compilar para producción**:
   ```bash
   npm run build
   npm start
   ```

---

## 🤖 Uso con Claude Code

Para trabajar en este proyecto utilizando **Claude Code**:

1. Abre tu terminal y sitúate en la raíz del proyecto:
   ```bash
   cd ruta/a/auranarrador
   ```

2. Inicia la sesión de Claude Code:
   ```bash
   claude
   ```

3. Claude Code reconocerá automáticamente la arquitectura:
   - `server.ts`: Backend Express con la integración server-side de `@google/genai` (`gemini-3.8-flash-tts`).
   - `src/App.tsx`: Interfaz interactiva de locución, presets y visualizador de espectro Web Audio.
   - `src/components/AudioMasteringPlayer.tsx`: Reproductor y ecualizador de calidez barítona (140Hz).
   - `src/components/PersonaConfigPanel.tsx`: Calibración de Estabilidad, Claridad, Exageración de estilo y cadencia.
