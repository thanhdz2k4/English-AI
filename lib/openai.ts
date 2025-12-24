import OpenAI from 'openai';

let openaiInstance: OpenAI | null = null;

const DEFAULT_OPENAI_TIMEOUT_MS = 5000;
const DEFAULT_OPENAI_MAX_RETRIES = 1;

export function getOpenAI(): OpenAI {
  if (!openaiInstance) {
    const apiKey = process.env.OPENAI_API_KEY || process.env.VC_API_KEY;
    if (!apiKey) {
      throw new Error('Missing OPENAI_API_KEY or VC_API_KEY environment variable');
    }
    const baseURL = process.env.OPENAI_BASE_URL || process.env.VC_BASE_URL;
    const timeoutMs = Number(
      process.env.OPENAI_TIMEOUT_MS ?? DEFAULT_OPENAI_TIMEOUT_MS
    );
    const maxRetries = Number(
      process.env.OPENAI_MAX_RETRIES ?? DEFAULT_OPENAI_MAX_RETRIES
    );
    const safeTimeout =
      Number.isFinite(timeoutMs) && timeoutMs > 0
        ? timeoutMs
        : DEFAULT_OPENAI_TIMEOUT_MS;
    const safeRetries =
      Number.isFinite(maxRetries) && maxRetries >= 0
        ? maxRetries
        : DEFAULT_OPENAI_MAX_RETRIES;
    openaiInstance = new OpenAI({
      apiKey,
      ...(baseURL ? { baseURL } : {}),
      timeout: safeTimeout,
      maxRetries: safeRetries,
    });
  }
  return openaiInstance;
}
