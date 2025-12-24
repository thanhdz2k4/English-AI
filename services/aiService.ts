import { getOpenAI } from '@/lib/openai';

const OPENAI_MODEL =
  process.env.OPENAI_MODEL ||
  process.env.VC_MODEL ||
  'gpt-4o-mini';

const DEBUG_AI_ERRORS = process.env.AI_DEBUG_ERRORS === 'true';

function formatAiError(error: unknown) {
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as { message?: unknown }).message || 'AI error');
  }
  return 'AI error';
}

export async function generateInitialQuestion(topic: string): Promise<string> {
  try {
    const openai = getOpenAI();
    const completion = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        {
          role: "system",
          content: `You are an English teacher helping students practice writing. Generate a simple, friendly opening question or statement related to the topic "${topic}" to start a conversation. Keep it natural and conversational.`
        },
        {
          role: "user",
          content: `Create an opening question about: ${topic}`
        }
      ],
      temperature: 0.8,
    });

    const content = completion.choices[0]?.message?.content?.trim();
    if (content) return content;
    if (DEBUG_AI_ERRORS) {
      const preview = JSON.stringify(completion.choices[0]?.message ?? completion);
      return `AI_EMPTY_RESPONSE: ${preview.slice(0, 300)}`;
    }
    return "Hi! Let's talk about this topic.";
  } catch (error) {
    console.error('Error generating initial question:', error);
    if (DEBUG_AI_ERRORS) {
      return `AI_ERROR: ${formatAiError(error)}`;
    }
    return "Hi! Let's talk about this topic.";
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
- If incorrect: Return JSON {"isCorrect": false, "error": "brief explanation in Vietnamese", "correction": "corrected sentence"}

Be strict about grammar but accept minor stylistic variations.`
        },
        {
          role: "user",
          content: sentence
        }
      ],
      temperature: 0.3,
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(completion.choices[0]?.message?.content || '{"isCorrect": true}');
    return result;
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
          content: "You are an English writing coach. Suggest a more natural, fluent, or sophisticated way to express the same idea. Keep the meaning intact but make it sound better."
        },
        {
          role: "user",
          content: `Improve this sentence: "${sentence}"`
        }
      ],
      temperature: 0.7,
    });

    const content = completion.choices[0]?.message?.content?.trim();
    if (content) return content;
    if (DEBUG_AI_ERRORS) {
      const preview = JSON.stringify(completion.choices[0]?.message ?? completion);
      return `AI_EMPTY_RESPONSE: ${preview.slice(0, 300)}`;
    }
    return sentence;
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
          content: `You are an English teacher having a conversation about "${topic}". Based on the previous messages, ask a natural follow-up question to continue the conversation. Keep it friendly and encouraging.`
        },
        {
          role: "user",
          content: `Previous conversation:\n${previousMessages.join('\n')}\n\nGenerate the next question:`
        }
      ],
      temperature: 0.8,
    });

    const content = completion.choices[0]?.message?.content?.trim();
    if (content) return content;
    if (DEBUG_AI_ERRORS) {
      const preview = JSON.stringify(completion.choices[0]?.message ?? completion);
      return `AI_EMPTY_RESPONSE: ${preview.slice(0, 300)}`;
    }
    return "What else would you like to share?";
  } catch (error) {
    console.error('Error generating next question:', error);
    if (DEBUG_AI_ERRORS) {
      return `AI_ERROR: ${formatAiError(error)}`;
    }
    return "What else would you like to share?";
  }
}
