import { GoogleGenAI } from '@google/genai';

const GEMINI_TTS_MODEL =
  process.env.GEMINI_TTS_MODEL ||
  process.env.GEMINI_MODEL ||
  'models/gemini-2.5-pro-preview-tts';

const FALLBACK_TTS_MODELS = [
  process.env.GEMINI_MODEL,
  'models/gemini-2.5-pro-preview-tts',
  'models/gemini-2.5-flash-preview-tts',
].filter(Boolean) as string[];

const DEFAULT_LANGUAGE = process.env.GEMINI_TTS_LANGUAGE || '';
const DEFAULT_VOICE = process.env.GEMINI_TTS_VOICE || '';
const GEMINI_API_VERSION = process.env.GEMINI_API_VERSION || 'v1alpha';

let geminiClient: GoogleGenAI | null = null;

function getGeminiClient() {
  const apiKey =
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw new Error('Missing GEMINI_API_KEY or GOOGLE_API_KEY');
  }
  if (!geminiClient) {
    geminiClient = new GoogleGenAI({
      apiKey,
      apiVersion: GEMINI_API_VERSION,
    });
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

function getTtsModelsToTry() {
  const models = [GEMINI_TTS_MODEL, ...FALLBACK_TTS_MODELS].filter(Boolean);
  return [...new Set(models)];
}

function extractAudio(response: {
  data?: string;
  candidates?: Array<{
    content?: {
      parts?: Array<{
        inlineData?: { data?: string; mimeType?: string };
      }>;
    };
  }>;
}) {
  const parts = response.candidates?.[0]?.content?.parts || [];
  const audioPart = parts.find((part) => {
    const mimeType = part.inlineData?.mimeType || '';
    return mimeType.startsWith('audio/');
  });

  const inlineData =
    audioPart?.inlineData
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

  return null;
}

function extractInteractionAudio(response: {
  outputs?: Array<{
    type?: string;
    data?: string;
    mime_type?: string;
  }>;
}) {
  const audioOutput = response.outputs?.find(
    (output) => output.type === 'audio' && output.data
  );
  if (!audioOutput?.data) return null;
  return {
    audio: audioOutput.data,
    mimeType: audioOutput.mime_type || 'audio/wav',
  };
}

async function generateSpeechWithInteractions(
  client: GoogleGenAI,
  model: string,
  text: string
) {
  const response = await client.interactions.create({
    model,
    input: text,
    response_modalities: ['audio'],
    system_instruction:
      'Read the input text aloud in English. Do not add or remove words.',
  });
  return extractInteractionAudio(response);
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

  const modelsToTry = getTtsModelsToTry();
  let lastError: Error | null = null;

  const speechConfigEnabled = Object.keys(speechConfig).length > 0;

  for (const model of modelsToTry) {
    try {
      const response = await client.models.generateContent({
        model,
        contents: [
          {
            role: 'user',
            parts: [{ text: trimmed }],
          },
        ],
        config: {
          responseModalities: ['audio'],
          speechConfig: speechConfigEnabled ? speechConfig : undefined,
          systemInstruction:
            'Read the input text aloud in English. Do not add or remove words.',
        },
      });

      const audio = extractAudio(response);
      if (audio) {
        return audio;
      }
      if (speechConfigEnabled) {
        const response = await client.models.generateContent({
          model,
          contents: [
            {
              role: 'user',
              parts: [{ text: trimmed }],
            },
          ],
          config: {
            responseModalities: ['audio'],
            systemInstruction:
              'Read the input text aloud in English. Do not add or remove words.',
          },
        });

        const fallbackAudio = extractAudio(response);
        if (fallbackAudio) {
          return fallbackAudio;
        }
      }
    } catch (error) {
      console.error(`Gemini TTS error for model ${model}:`, error);
      const message = error instanceof Error ? error.message : 'TTS error';
      lastError = new Error(`Model ${model}: ${message}`);
    }
  }

  for (const model of modelsToTry) {
    try {
      const audio = await generateSpeechWithInteractions(
        client,
        model,
        trimmed
      );
      if (audio) {
        return audio;
      }
    } catch (error) {
      console.error(
        `Gemini TTS interaction error for model ${model}:`,
        error
      );
      const message = error instanceof Error ? error.message : 'TTS error';
      lastError = new Error(`Model ${model}: ${message}`);
    }
  }

  if (lastError) {
    throw lastError;
  }
  throw new Error('No audio returned');
}
