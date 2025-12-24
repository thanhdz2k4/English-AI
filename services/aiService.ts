import { getOpenAI } from '@/lib/openai';

const OPENAI_MODEL =
  process.env.OPENAI_MODEL ||
  process.env.VC_MODEL ||
  'gpt-4o-mini';

const DEBUG_AI_ERRORS = process.env.AI_DEBUG_ERRORS === 'true';
const NON_ASCII_REGEX = /[^\x00-\x7F]/;

function formatAiError(error: unknown) {
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as { message?: unknown }).message || 'AI error');
  }
  return 'AI error';
}

function sanitizeEnglish(
  text: string | null | undefined,
  fallback: string
) {
  if (!text) return fallback;
  const trimmed = text.trim();
  if (!trimmed) return fallback;
  if (NON_ASCII_REGEX.test(trimmed)) return fallback;
  return trimmed;
}

function normalizeAiSentence(text: string, fallback: string) {
  let normalized = text.trim();
  if (!normalized) return fallback;

  const lines = normalized
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length > 0) {
    normalized = lines[0];
  }

  normalized = normalized
    .replace(/^[\"'`]+|[\"'`]+$/g, '')
    .replace(
      /^(?:here(?:'s| is)\s+(?:a|the)\s+(?:question|prompt)\s*[:\-]?\s*)/i,
      ''
    )
    .replace(/^(?:question|prompt|answer)\s*:\s*/i, '')
    .replace(/^(?:sure|of course|okay)[,.\s]+/i, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!normalized) return fallback;

  const sentenceMatch = normalized.match(/^[^.!?]*[.!?]/);
  if (sentenceMatch) {
    normalized = sentenceMatch[0].trim();
  }

  return normalized || fallback;
}

function sanitizeGrammarResult(
  result: { isCorrect: boolean; error?: string; correction?: string },
  sentence: string
) {
  if (result.isCorrect) {
    return { isCorrect: true };
  }

  const error = sanitizeEnglish(
    result.error ?? '',
    'Grammar needs improvement.'
  );
  const correction = sanitizeEnglish(
    result.correction ?? '',
    sanitizeEnglish(sentence, 'Please revise this sentence.')
  );

  return {
    isCorrect: false,
    error,
    correction,
  };
}

export async function generateInitialQuestion(topic: string): Promise<string> {
  try {
    const openai = getOpenAI();
    const completion = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        {
          role: "system",
          content: `You are an English teacher helping students practice writing. Respond only in English using ASCII characters. Generate one simple, friendly opening sentence related to the topic "${topic}" to start a conversation. Keep it natural and conversational. Return only the sentence without any prefix or explanation.`
        },
        {
          role: "user",
          content: `Create an opening sentence about: ${topic}. Return only the sentence.`
        }
      ],
      temperature: 0.8,
    });

    const content = completion.choices[0]?.message?.content;
    const fallback = "Let's talk about this topic.";
    const sanitized = sanitizeEnglish(content, '');
    if (!sanitized) {
      if (DEBUG_AI_ERRORS) {
        const preview = JSON.stringify(completion.choices[0]?.message ?? completion);
        return `AI_EMPTY_RESPONSE: ${preview.slice(0, 300)}`;
      }
      return fallback;
    }
    return normalizeAiSentence(sanitized, fallback);
  } catch (error) {
    console.error('Error generating initial question:', error);
    if (DEBUG_AI_ERRORS) {
      return `AI_ERROR: ${formatAiError(error)}`;
    }
    return "Let's talk about this topic.";
  }
}

export async function checkGrammar(sentence: string): Promise<{
  isCorrect: boolean;
  error?: string;
  correction?: string;
  fallback?: boolean;
}> {
  try {
    const openai = getOpenAI();
    const completion = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        {
          role: "system",
          content: `You are an English grammar checker. Analyze the sentence and determine if it's grammatically correct.

Response format:
- If correct: Return JSON {"isCorrect": true}
- If incorrect: Return JSON {"isCorrect": false, "error": "brief explanation in English", "correction": "corrected sentence in English"}

Be strict about grammar but accept minor stylistic variations.
Respond only in English using ASCII characters. Return only valid JSON.`
        },
        {
          role: "user",
          content: sentence
        }
      ],
      temperature: 0.3,
      response_format: { type: "json_object" }
    });

    const parsed = JSON.parse(
      completion.choices[0]?.message?.content || '{"isCorrect": true}'
    );
    const result = {
      isCorrect: typeof parsed.isCorrect === 'boolean' ? parsed.isCorrect : true,
      error: typeof parsed.error === 'string' ? parsed.error : undefined,
      correction: typeof parsed.correction === 'string' ? parsed.correction : undefined,
    };
    return sanitizeGrammarResult(result, sentence);
  } catch (error) {
    console.error('Error checking grammar:', error);
    if (DEBUG_AI_ERRORS) {
      return {
        isCorrect: true,
        fallback: true,
        error: formatAiError(error),
      };
    }
    return { isCorrect: true, fallback: true };
  }
}

export async function generateImprovement(sentence: string): Promise<string> {
  try {
    const openai = getOpenAI();
    const completion = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        {
          role: "system",
          content: "You are an English writing coach. Respond only in English using ASCII characters. Suggest a more natural, fluent, or sophisticated way to express the same idea. Keep the meaning intact but return only the improved sentence."
        },
        {
          role: "user",
          content: `Improve this sentence: "${sentence}"`
        }
      ],
      temperature: 0.7,
    });

    const content = completion.choices[0]?.message?.content;
    const fallback = sanitizeEnglish(sentence, 'Please rephrase this sentence.');
    const sanitized = sanitizeEnglish(content, fallback);
    if (sanitized) return sanitized;
    if (DEBUG_AI_ERRORS) {
      const preview = JSON.stringify(completion.choices[0]?.message ?? completion);
      return `AI_EMPTY_RESPONSE: ${preview.slice(0, 300)}`;
    }
    return fallback;
  } catch (error) {
    console.error('Error generating improvement:', error);
    if (DEBUG_AI_ERRORS) {
      return `AI_ERROR: ${formatAiError(error)}`;
    }
    return sentence;
  }
}

export async function generateNextQuestion(topic: string, previousMessages: string[]): Promise<string> {
  try {
    const openai = getOpenAI();
    const completion = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        {
          role: "system",
          content: `You are an English teacher having a conversation about "${topic}". Respond only in English using ASCII characters. Based on the previous messages, ask one natural follow-up sentence to continue the conversation. Keep it friendly and encouraging. Return only the sentence without any prefix or explanation.`
        },
        {
          role: "user",
          content: `Previous conversation:\n${previousMessages.join('\n')}\n\nGenerate the next sentence:`
        }
      ],
      temperature: 0.8,
    });

    const content = completion.choices[0]?.message?.content;
    const fallback = "What else would you like to share?";
    const sanitized = sanitizeEnglish(content, '');
    if (!sanitized) {
      if (DEBUG_AI_ERRORS) {
        const preview = JSON.stringify(completion.choices[0]?.message ?? completion);
        return `AI_EMPTY_RESPONSE: ${preview.slice(0, 300)}`;
      }
      return fallback;
    }
    return normalizeAiSentence(sanitized, fallback);
  } catch (error) {
    console.error('Error generating next question:', error);
    if (DEBUG_AI_ERRORS) {
      return `AI_ERROR: ${formatAiError(error)}`;
    }
    return "What else would you like to share?";
  }
}
