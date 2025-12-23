import { getOpenAI } from '@/lib/openai';

export async function generateInitialQuestion(topic: string): Promise<string> {
  const openai = getOpenAI();
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
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

  return completion.choices[0]?.message?.content || "Hi! Let's talk about this topic.";
}

export async function checkGrammar(sentence: string): Promise<{
  isCorrect: boolean;
  error?: string;
  correction?: string;
}> {
  const openai = getOpenAI();
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
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
}

export async function generateImprovement(sentence: string): Promise<string> {
  const openai = getOpenAI();
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
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

  return completion.choices[0]?.message?.content || sentence;
}

export async function generateNextQuestion(topic: string, previousMessages: string[]): Promise<string> {
  const openai = getOpenAI();
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
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

  return completion.choices[0]?.message?.content || "What else would you like to share?";
}
