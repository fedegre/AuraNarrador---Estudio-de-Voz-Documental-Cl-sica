# AuraNarrador - Estudio de Voz Documental Clásica 🎙️

Estudio profesional de síntesis y modulación de voz (TTS) **100 % local**: la voz se genera con **[Kokoro](https://github.com/thewh1teagle/kokoro-onnx)** y la mejora de guiones con **[Ollama](https://ollama.com)**, sin claves ni costo por uso. Está calibrado para emular la locución solemne, profunda y barítona estilo documental latinoamericano (inspirado en **Pancho Ibáñez** y **Ernesto Frith** en *"La Aventura del Hombre"*).

---

## 🚀 Requisitos Previos

- [Node.js](https://nodejs.org/) (versión 18 o superior).
- [Python](https://www.python.org/) 3.10+ con `pip install kokoro-onnx soundfile numpy`.
- [FFmpeg](https://ffmpeg.org/) en el PATH, compilado con `rubberband` (las builds "full" lo traen).
- Modelo de Kokoro: descarga `kokoro-v1.0.onnx` y `voices-v1.0.bin` desde las [releases de kokoro-onnx](https://github.com/thewh1teagle/kokoro-onnx/releases) y ponlos en `modelos/kokoro/` (o indica otra carpeta en `KOKORO_MODELS_DIR`).
- [Ollama](https://ollama.com) abierto, con un modelo descargado: `ollama pull qwen2.5:7b`.
- *(Opcional)* Clave de API de Gemini, solo si quieres volver a usar Gemini TTS (`TTS_ENGINE=gemini`).
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
   Los valores por defecto ya usan Kokoro + Ollama. Ajusta si hace falta:
   ```env
   TTS_ENGINE="kokoro"          # o "gemini"
   SCRIPT_ENGINE="ollama"       # o "gemini"
   OLLAMA_MODEL="qwen2.5:7b"
   KOKORO_MODELS_DIR="./modelos/kokoro"
   PORT=3000
   ```

### Voces con Kokoro

Kokoro solo trae tres voces en español (`em_santa`, `em_alex`, `ef_dora`). Cada voz de la interfaz es un perfil construido sobre ellas, con tono, formantes, pausas y ecualización barítona (ver `server/kokoro.ts`):

| Voz en la interfaz | Base Kokoro | Carácter |
|---|---|---|
| Fenrir | em_santa, −2 semitonos | Barítono documental clásico |
| Charon | em_santa, −3 semitonos | Más grave y pausado |
| Puck | em_alex | Divulgación, ritmo ágil |
| Zephyr | mezcla santa + alex | Sereno, natural |
| Kore | mezcla dora + sara | Narradora femenina cálida |

El selector de cadencia ajusta velocidad y pausas. Estabilidad, claridad y exageración de estilo solo tienen efecto con `TTS_ENGINE=gemini`.

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
   - `server.ts`: Backend Express; elige el motor de voz y de guion según `.env`.
   - `server/kokoro.ts` + `tts/kokoro_tts.py`: síntesis local con Kokoro y postproceso con FFmpeg.
   - `server/ollama.ts`: mejora de guion con el modelo de Ollama configurado.
   - `src/App.tsx`: Interfaz interactiva de locución, presets y visualizador de espectro Web Audio.
   - `src/components/AudioMasteringPlayer.tsx`: Reproductor y ecualizador de calidez barítona (140Hz).
   - `src/components/PersonaConfigPanel.tsx`: Calibración de Estabilidad, Claridad, Exageración de estilo y cadencia.
