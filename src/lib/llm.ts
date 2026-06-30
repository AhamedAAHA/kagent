import OpenAI from 'openai';

/** Exa provides an OpenAI-compatible API; Band key is stored for platform integration. */
export function getLLMClient(): OpenAI | null {
  if (process.env.EXA_API_KEY) {
    return new OpenAI({
      baseURL: 'https://api.exa.ai',
      apiKey: process.env.EXA_API_KEY,
    });
  }
  if (process.env.OPENAI_API_KEY) {
    return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return null;
}

export function getLLMModel(): string {
  if (process.env.EXA_API_KEY) return 'exa';
  return process.env.OPENAI_API_KEY ? 'gpt-4' : 'exa';
}

export function hasLLMConfigured(): boolean {
  return Boolean(process.env.EXA_API_KEY || process.env.OPENAI_API_KEY);
}

export function getLLMProviderLabel(): string {
  if (process.env.EXA_API_KEY) return 'Exa';
  if (process.env.OPENAI_API_KEY) return 'OpenAI';
  return 'local';
}
