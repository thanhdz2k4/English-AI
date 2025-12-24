import { GoogleGenAI } from '@google/genai';

const GEMINI_MODEL =
  process.env.GEMINI_TTS_MODEL ||
  process.env.GEMINI_MODEL ||
  'gemini-2.0-flash-exp';

const DEFAULT_LANGUAGE = process.env.GEMINI_TTS_LANGUAGE || 'en-US';
const DEFAULT_VOICE = process.env.GEMINI_TTS_VOICE || '';

let geminiClient: GoogleGenAI | null = null;

function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Missing GEMINI_API_KEY');
  }
  if (!geminiClient) {
    geminiClient = new GoogleGenAI({ apiKey });
  }
  return geminiClient;
}

function buildSpeechConfig(languageCode?: string, voiceName?: string) {
  const speechConfig: {
    languageCode?: string;
    voiceConfig?: {
      prebuiltVoiceConfig?: {
        voiceName?: string;
      };
    };
  } = {};

  const resolvedLanguage = languageCode || DEFAULT_LANGUAGE;
  if (resolvedLanguage) {
    speechConfig.languageCode = resolvedLanguage;
  }

  const resolvedVoice = voiceName || DEFAULT_VOICE;
  if (resolvedVoice) {
    speechConfig.voiceConfig = {
      prebuiltVoiceConfig: {
        voiceName: resolvedVoice,
      },
    };
  }

  return speechConfig;
}

export async function generateSpeech(
  text: string,
  options?: { languageCode?: string; voiceName?: string }
) {
  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error('Text is required');
  }

  const client = getGeminiClient();
  const speechConfig = buildSpeechConfig(
    options?.languageCode,
    options?.voiceName
  );

  const response = await client.models.generateContent({
    model: GEMINI_MODEL,
    contents: trimmed,
    config: {
      responseModalities: ['audio'],
      speechConfig: Object.keys(speechConfig).length ? speechConfig : undefined,
      systemInstruction:
        'Read the input text aloud in English. Do not add or remove words.',
    },
  });

  const parts = response.candidates?.[0]?.content?.parts || [];
  const audioPart = parts.find((part) => {
    const mimeType = part.inlineData?.mimeType || '';
    return mimeType.startsWith('audio/');
  });

  const inlineData = audioPart?.inlineData
    ?? parts.find((part) => part.inlineData?.data)?.inlineData
    ?? null;

  if (inlineData?.data) {
    return {
      audio: inlineData.data,
      mimeType: inlineData.mimeType || 'audio/wav',
    };
  }

  if (response.data) {
    return {
      audio: response.data,
      mimeType: 'audio/wav',
    };
  }

  throw new Error('No audio returned');
}
