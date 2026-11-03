const OLLAMA_TIMEOUT_MS = 5 * 60 * 1000;

export const ollamaHost = () => (process.env.OLLAMA_HOST || 'http://localhost:11434').replace(/\/$/, '');
export const ollamaModel = () => process.env.OLLAMA_MODEL || 'qwen2.5:7b';

export async function chatWithOllama(systemPrompt: string, userPrompt: string): Promise<string> {
  let response: Response;
  try {
    response = await fetch(`${ollamaHost()}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: ollamaModel(),
        stream: false,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        options: { temperature: 0.7 },
      }),
      signal: AbortSignal.timeout(OLLAMA_TIMEOUT_MS),
    });
  } catch (err: any) {
    throw new Error(`No se pudo conectar con Ollama en ${ollamaHost()}. ¿Está abierto? (${err.message})`);
  }

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Ollama respondió ${response.status} con el modelo "${ollamaModel()}": ${detail}`);
  }

  const data = (await response.json()) as { message?: { content?: string } };
  return data.message?.content?.trim() || '';
}
