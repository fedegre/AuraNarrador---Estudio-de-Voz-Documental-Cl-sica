"""Sintesis local con Kokoro (kokoro-onnx) para AuraNarrador.

server.ts lo llama asi:  python tts/kokoro_tts.py salida.wav < perfil.json
El JSON de entrada trae el texto y el perfil acustico:
  {"text": "...", "voz": "em_santa", "velocidad": 0.86, "tono": -2, "formantes": true,
   "pausas": [0.75, 1.0], "eq": "equalizer=...", "acento": "latam"}

Requisitos: pip install kokoro-onnx soundfile numpy, y ffmpeg (con rubberband) en el PATH.
Los archivos del modelo (kokoro-v1.0.onnx y voices-v1.0.bin) se buscan en KOKORO_MODELS_DIR.
"""
import json
import os
import re
import subprocess
import sys
import tempfile
from pathlib import Path

import numpy as np
import soundfile as sf
from kokoro_onnx import Kokoro

ACENTOS = {"latam": "es-419", "es": "es"}
LUFS_OBJETIVO = -16
MODELOS_POR_DEFECTO = Path(__file__).resolve().parent.parent / "modelos" / "kokoro"


def cargar_kokoro():
    carpeta = Path(os.environ.get("KOKORO_MODELS_DIR") or MODELOS_POR_DEFECTO)
    modelo, voces = carpeta / "kokoro-v1.0.onnx", carpeta / "voices-v1.0.bin"
    if not modelo.exists() or not voces.exists():
        sys.exit(f"Faltan kokoro-v1.0.onnx / voices-v1.0.bin en {carpeta} (configura KOKORO_MODELS_DIR)")
    return Kokoro(str(modelo), str(voces))


def sin_etiquetas(texto):
    """Quita marcas como <breath> para que Kokoro no las lea."""
    return " ".join(re.sub(r"<[^>]+>", " ", texto).split())


def resolver_voz(kokoro, voz):
    """'em_santa' -> nombre tal cual; 'ef_dora:0.6+if_sara:0.4' -> estilo mezclado."""
    if ":" not in voz and "+" not in voz:
        return voz
    mezcla = None
    for parte in voz.split("+"):
        nombre, _, peso = parte.partition(":")
        estilo = kokoro.get_voice_style(nombre.strip()) * float(peso or 1)
        mezcla = estilo if mezcla is None else mezcla + estilo
    return mezcla


def trozos(texto):
    """Corta tras '.', '!', '?' y tras '...'/'…' (pausa dramatica). Las comas las resuelve Kokoro."""
    return [(m[1].strip(), bool(m[2]) and m[2] in ("...", "…"))
            for m in re.finditer(r"(.+?(\.\.\.|…|[.!?]+)|.+$)(?=\s|$)", texto) if m[1].strip()]


def sintetizar(kokoro, perfil):
    # kokoro-onnx no aplica pausas dentro de un mismo bloque, asi que se insertan aqui
    pausa_frase, pausa_suspensivos = perfil["pausas"]
    voz = resolver_voz(kokoro, perfil["voz"])
    partes, sr = [], 24000
    fragmentos = trozos(sin_etiquetas(perfil["text"]))
    if not fragmentos:
        sys.exit("El texto esta vacio despues de limpiar etiquetas.")
    for i, (fragmento, suspensivo) in enumerate(fragmentos):
        audio, sr = kokoro.create(fragmento, voice=voz, speed=perfil["velocidad"], lang=ACENTOS[perfil["acento"]])
        partes.append(audio)
        if i < len(fragmentos) - 1:
            partes.append(np.zeros(int((pausa_suspensivos if suspensivo else pausa_frase) * sr), dtype=audio.dtype))
    return np.concatenate(partes), sr


def postproceso(origen, destino, sr, perfil):
    """Tono + ecualizacion del perfil y volumen a -16 LUFS."""
    filtros = []
    if perfil["tono"]:
        formantes = "shifted" if perfil["formantes"] else "preserved"
        filtros.append(f"rubberband=pitch={2 ** (perfil['tono'] / 12):.5f}:formant={formantes}")
    if perfil["eq"]:
        filtros.append(perfil["eq"])
    filtros.append(f"loudnorm=I={LUFS_OBJETIVO}:TP=-1.5:LRA=11")
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", str(origen), "-af", ",".join(filtros),
                    "-ar", str(sr), str(destino)], check=True)


def main():
    if len(sys.argv) != 2:
        sys.exit("Uso: python kokoro_tts.py salida.wav < perfil.json")
    perfil = {"velocidad": 1.0, "tono": 0, "formantes": False, "pausas": [0.35, 0.45], "eq": "",
              "acento": "latam", **json.load(sys.stdin)}
    if perfil["acento"] not in ACENTOS:
        sys.exit(f"Acento desconocido '{perfil['acento']}'. Opciones: {', '.join(ACENTOS)}")
    audio, sr = sintetizar(cargar_kokoro(), perfil)
    with tempfile.TemporaryDirectory() as tmp:
        crudo = Path(tmp) / "crudo.wav"
        sf.write(crudo, audio, sr)
        postproceso(crudo, sys.argv[1], sr, perfil)


if __name__ == "__main__":
    main()
