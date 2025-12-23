import { NextRequest, NextResponse } from 'next/server';
import { createSession, addMessage } from '@/services/writingService';
import { generateInitialQuestion } from '@/services/aiService';
import { Role } from '@prisma/client';
import type { StartSessionRequest, StartSessionResponse } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body: StartSessionRequest = await request.json();
    const { topic, userId } = body;

    if (!topic || !userId) {
      return NextResponse.json(
        { error: 'Topic and userId are required' },
        { status: 400 }
      );
    }

    // Create new session
    const session = await createSession(userId, topic);

    // Generate initial AI question
    const aiMessage = await generateInitialQuestion(topic);

    // Save AI message
    await addMessage(session.id, Role.AI, aiMessage, 1);

    const response: StartSessionResponse = {
      sessionId: session.id,
      aiMessage,
      messageCount: 1,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error starting session:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
