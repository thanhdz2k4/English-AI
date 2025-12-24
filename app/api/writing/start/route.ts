import { NextRequest, NextResponse } from 'next/server';
import { createSession, addMessage } from '@/services/writingService';
import { generateInitialQuestion } from '@/services/aiService';
import { Role } from '@prisma/client';
import type { StartSessionRequest, StartSessionResponse } from '@/types';
import { getUserFromRequest } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body: StartSessionRequest = await request.json();
    const { topic } = body;
    const trimmedTopic = typeof topic === 'string' ? topic.trim() : '';

    if (!trimmedTopic) {
      return NextResponse.json(
        { error: 'Topic is required' },
        { status: 400 }
      );
    }

    // Create new session
    const session = await createSession(user.id, trimmedTopic);

    // Generate initial AI question
    const aiMessage = await generateInitialQuestion(trimmedTopic);

    // Save AI message
    await addMessage(session.id, Role.AI, aiMessage, 1);

    const response: StartSessionResponse = {
      sessionId: session.id,
      aiMessage,
      messageCount: 1,
    };

    if (process.env.AI_DEBUG_ERRORS === 'true') {
      return NextResponse.json({
        ...response,
        debug: {
          model: process.env.OPENAI_MODEL || process.env.VC_MODEL || null,
          baseURL: process.env.OPENAI_BASE_URL || process.env.VC_BASE_URL || null,
          hasApiKey: Boolean(process.env.OPENAI_API_KEY || process.env.VC_API_KEY),
          timeoutMs: process.env.OPENAI_TIMEOUT_MS || null,
          maxRetries: process.env.OPENAI_MAX_RETRIES || null,
          debugFlag: process.env.AI_DEBUG_ERRORS || null,
        },
      });
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error starting session:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
