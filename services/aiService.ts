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
  
  // Join all lines with space (for multi-sentence responses)
  if (lines.length > 0) {
    normalized = lines.join(' ');
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

  // Keep full response - don't truncate
  // Just limit by max length to be safe
  if (normalized.length > 500) {
    normalized = normalized.substring(0, 500).trim();
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
          content: `You are a friendly English teacher helping students practice writing skills.

Your role:
- Share 1-2 sentences about yourself or your experience related to "${topic}" first
- Then ask a question about their experience
- Total response should be 15-30 words (2-3 sentences)
- Be warm and encouraging

REQUIRED format:
[Share something] + [Ask question with ?]

Examples:
- "I love reading books before bed. It helps me relax. What do you usually do before sleeping?"
- "I think breakfast is the most important meal. I always eat eggs and toast. What do you like to eat for breakfast?"
- "Working from home can be challenging. I miss talking to colleagues. How do you feel about your workplace?"

Requirements:
✓ 2-3 sentences total
✓ Share something personal first
✓ End with a question (?)
✓ Use simple vocabulary
✓ ASCII only

Topic: ${topic}`
        },
        {
          role: "user",
          content: `Start a conversation about: ${topic}`
        }
      ],
      temperature: 0.7,
      max_tokens: 120,
    });

    const content = completion.choices[0]?.message?.content;
    const fallback = "What do you want to share about this?";
    const sanitized = sanitizeEnglish(content, '');
    if (!sanitized) {
      if (DEBUG_AI_ERRORS) {
        const preview = JSON.stringify(completion.choices[0]?.message ?? completion);
        return `AI_EMPTY_RESPONSE: ${preview.slice(0, 300)}`;
      }
      return fallback;
    }
    
    const normalized = normalizeAiSentence(sanitized, fallback);
    
    // Simple validation - just check it's not empty
    if (!normalized || normalized === fallback) {
      if (DEBUG_AI_ERRORS) {
        console.warn('AI returned empty or fallback:', normalized);
      }
      return fallback;
    }
    
    return normalized;
  } catch (error) {
    console.error('Error generating initial question:', error);
    if (DEBUG_AI_ERRORS) {
      return `AI_ERROR: ${formatAiError(error)}`;
    }
    return "What do you want to share about this?";
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
          content: `You are an English grammar checker for intermediate learners.

IMPORTANT: Questions are COMPLETE SENTENCES if they have:
- Subject (I, we, you, etc.) + Verb (can, do, are, etc.) + Question mark (?)
- Examples of CORRECT questions:
  ✓ "Can we change to another topic?"
  ✓ "Do you like music?"
  ✓ "Are you ready?"
  ✓ "What time is it?"

Check these REAL grammar errors:
✓ Missing verb: "I happy" (need "I am happy")
✓ Wrong verb tense: "I go yesterday" (need "I went yesterday")
✓ Missing subject: "Go to school" (need "I go to school")
✓ Wrong word order: "Go I home" (need "I go home")
✓ Missing required preposition: "listen music" (need "listen to music")
✓ Wrong verb form: "I am go" (need "I go" or "I am going")

IGNORE these:
✗ Spelling: "listn" → OK
✗ Capitalization: "spotify" → OK
✗ Articles if meaning clear: "I go to school" → OK
✗ Perfect word choice: "random" vs "various" → OK
✗ Punctuation (except missing ? for questions)

CRITICAL RULES:
1. Questions with subject + auxiliary verb + main verb + ? are ALWAYS CORRECT
2. "Can we...", "Do you...", "Are you...", "What...", "How..." questions are CORRECT
3. Only mark incorrect if the sentence structure is fundamentally broken

Response (JSON only):
- Grammar acceptable: {"isCorrect": true}
- Real grammar error: {"isCorrect": false, "error": "explain", "correction": "fix"}

ASCII only.`
        },
        {
          role: "user",
          content: sentence
        }
      ],
      temperature: 0.15,
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
          content: `You are an English writing coach helping students improve their sentences.

Your task:
- Suggest a more natural or fluent way to say the same thing
- Keep the original meaning
- Make it sound more native-like
- Use appropriate vocabulary and grammar

IMPORTANT:
- Return ONLY the improved sentence
- No explanations, no comments, no prefixes like "You could say" or "A better way"
- Only use ASCII characters
- If the sentence is already very good, make minimal changes`
        },
        {
          role: "user",
          content: sentence
        }
      ],
      temperature: 0.5,
      max_tokens: 100,
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
    
    // Build conversation history for context - get all messages
    const conversationHistory = previousMessages.map(msg => {
      const [role, ...contentParts] = msg.split(': ');
      const content = contentParts.join(': ');
      return {
        role: role.toLowerCase() === 'user' ? 'user' as const : 'assistant' as const,
        content: content
      };
    });
    
    // Extract the LAST user message (most recent answer from student)
    const userMessages = conversationHistory.filter(m => m.role === 'user');
    const lastUserMessage = userMessages.length > 0 
      ? userMessages[userMessages.length - 1].content 
      : '';
    
    // Only keep last 6 messages for the actual conversation to avoid token limits
    const recentHistory = conversationHistory.slice(-6);
    
    const completion = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        {
          role: "system",
          content: `You are a friendly English teacher having a natural conversation with a student about "${topic}".

CRITICAL: The student just said: "${lastUserMessage}"

Your task - Create a natural conversational response (2-3 sentences, 20-35 words total):
1. React to what they said - share your thoughts, agreement, or a similar experience (1-2 sentences)
2. Then ask a follow-up question about a specific detail they mentioned (1 sentence with ?)

Format: [Your reaction/share] + [Question about specific detail?]

Examples:
Student: "I go to work by bus"
✓ Good: "That's a good way to save money and help the environment. I used to take the bus too. How long does your commute usually take?"
✗ Bad: "How long does it take?" (too short)

Student: "I like reading books"
✓ Good: "Reading is such a great hobby! I love mystery novels myself. What kind of books do you enjoy reading the most?"
✗ Bad: "What books?" (too short)

Student: "I wake up at 6am"
✓ Good: "Wow, that's quite early! I struggle to wake up before 7am. What helps you get up so early in the morning?"
✗ Bad: "Why so early?" (too short)

Requirements:
- Total 20-35 words (2-3 sentences)
- First part: React/share (show you're listening)
- Second part: Ask specific question with "?"
- Reference something from: "${lastUserMessage}"
- Make it conversational, not robotic
- ASCII only

Topic: ${topic}`
        },
        ...recentHistory,
      ],
      temperature: 0.8,
      max_tokens: 150,
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
    
    const normalized = normalizeAiSentence(sanitized, fallback);
    
    // Simple validation - check not empty
    if (!normalized || normalized === fallback) {
      if (DEBUG_AI_ERRORS) {
        console.warn('AI returned empty or fallback:', normalized);
      }
      return fallback;
    }
    
    return normalized;
  } catch (error) {
    console.error('Error generating next question:', error);
    if (DEBUG_AI_ERRORS) {
      return `AI_ERROR: ${formatAiError(error)}`;
    }
    return "What else would you like to share?";
  }
}

export async function generateFillInBlank(topic: string): Promise<{
  sentence: string;
  answer: string;
  blankType: 'verb' | 'preposition' | 'phrase';
}> {
  try {
    const openai = getOpenAI();
    const completion = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        {
          role: "system",
          content: `You are an English teacher creating CHALLENGING fill-in-the-blank exercises about "${topic}".

DIFFICULTY LEVEL: INTERMEDIATE TO ADVANCED

Create diverse, complex sentences with ONE blank. Focus on:

1. Advanced Verbs & Phrasal Verbs (40%):
   - Phrasal verbs: "I need to ___ the deadline" (meet)
   - Perfect tenses: "I ___ this book three times" (have read)
   - Conditional: "If I had known, I ___ earlier" (would have come)
   - Passive: "The project ___ by the team yesterday" (was completed)

2. Complex Prepositions & Particles (30%):
   - Dependent prepositions: "She succeeded ___ her goals" (in achieving)
   - Phrasal verb particles: "Don't give ___ your dreams" (up on)
   - Fixed expressions: "I'm looking forward ___ you" (to meeting)

3. Advanced Phrases & Collocations (30%):
   - Idioms: "He burned the ___ working late" (midnight oil)
   - Collocations: "Make a ___ impression" (lasting)
   - Fixed phrases: "I took his criticism with a grain of ___" (salt)

REQUIREMENTS:
✓ 12-20 words per sentence (longer and more complex)
✓ Use varied vocabulary and structures
✓ Mix tenses (past perfect, conditionals, etc.)
✓ Include context that requires thinking
✓ NEVER repeat common patterns like "I listen to..."
✓ Use "___" for blank (3 underscores)
✓ Make it CHALLENGING - no obvious answers

FORBIDDEN (too easy/repetitive):
✗ "I ___ music" → too simple
✗ "I go to school ___ bus" → too common
✗ Basic present tense sentences
✗ Repeated sentence structures

Response format (JSON only):
{
  "sentence": "Complex sentence with ___",
  "answer": "challenging word/phrase",
  "blankType": "verb" or "preposition" or "phrase"
}

Examples of GOOD (challenging) exercises:
{"sentence": "Despite the difficulties, she managed to ___ her composure during the presentation", "answer": "maintain", "blankType": "verb"}
{"sentence": "The success of the project depends ___ the team's ability to collaborate effectively", "answer": "on", "blankType": "preposition"}
{"sentence": "He's been working on this assignment ___ but still hasn't finished it", "answer": "for hours", "blankType": "phrase"}

Topic: ${topic}
ASCII only.`
        },
        {
          role: "user",
          content: `Create a CHALLENGING and UNIQUE fill-in-the-blank exercise about: ${topic}`
        }
      ],
      temperature: 0.9,
      response_format: { type: "json_object" }
    });

    const parsed = JSON.parse(
      completion.choices[0]?.message?.content || '{"sentence": "I ___ music", "answer": "listen to", "blankType": "verb"}'
    );

    return {
      sentence: sanitizeEnglish(parsed.sentence, 'I ___ this book three times already'),
      answer: sanitizeEnglish(parsed.answer, 'have read'),
      blankType: parsed.blankType || 'verb',
    };
  } catch (error) {
    console.error('Error generating fill-in-blank:', error);
    return {
      sentence: 'Despite the challenges, I ___ to achieve my goals',
      answer: 'managed',
      blankType: 'verb',
    };
  }
}

export async function checkFillInBlank(userAnswer: string, correctAnswer: string): Promise<{
  isCorrect: boolean;
  feedback?: string;
}> {
  const cleanUser = userAnswer.trim().toLowerCase();
  const cleanCorrect = correctAnswer.trim().toLowerCase();

  // Exact match
  if (cleanUser === cleanCorrect) {
    return { isCorrect: true };
  }

  // Check if answer is acceptable alternative
  try {
    const openai = getOpenAI();
    const completion = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        {
          role: "system",
          content: `You are an English teacher checking a fill-in-the-blank answer.

Expected answer: "${correctAnswer}"
Student answer: "${userAnswer}"

Task: Determine if the student's answer is acceptable.

Accept if:
✓ Same meaning: "listen to" vs "hear" for music context
✓ Different form but correct: "listening to" vs "listen to"
✓ Synonym that fits context

Reject if:
✗ Wrong meaning or grammar
✗ Doesn't fit the sentence

Response (JSON only):
{"isCorrect": true or false, "feedback": "brief explanation if wrong"}

ASCII only.`
        },
        {
          role: "user",
          content: `Expected: "${correctAnswer}", Student: "${userAnswer}"`
        }
      ],
      temperature: 0.2,
      response_format: { type: "json_object" }
    });

    const parsed = JSON.parse(
      completion.choices[0]?.message?.content || '{"isCorrect": false, "feedback": "Try again"}'
    );

    return {
      isCorrect: parsed.isCorrect === true,
      feedback: parsed.feedback,
    };
  } catch (error) {
    console.error('Error checking fill-in-blank:', error);
    return {
      isCorrect: false,
      feedback: 'Unable to check answer. Please try again.',
    };
  }
}
