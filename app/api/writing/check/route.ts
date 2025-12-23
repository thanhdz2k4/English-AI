import { NextRequest, NextResponse } from 'next/server';
import {
  addMessage,
  addMistake,
  getMessageCount,
  getSessionMessages,
  completeSession,
} from '@/services/writingService';
import {
  checkGrammar,
  generateImprovement,
  generateNextQuestion,
} from '@/services/aiService';
import { Role } from '@prisma/client';
import type { CheckMessageRequest, CheckMessageResponse } from '@/types';

const MAX_MESSAGES = 8;

export async function POST(request: NextRequest) {
  try {
    const body: CheckMessageRequest = await request.json();
    const { sessionId, userMessage } = body;

    if (!sessionId || !userMessage) {
      return NextResponse.json(
        { error: 'SessionId and userMessage are required' },
        { status: 400 }
      );
    }

    // Get current message count
    const currentCount = await getMessageCount(sessionId);
    const userOrder = currentCount + 1;

    // Check grammar
    const grammarCheck = await checkGrammar(userMessage);

    if (!grammarCheck.isCorrect) {
      // Save user message as incorrect
      await addMessage(
        sessionId,
        Role.USER,
        userMessage,
        userOrder,
        false
      );

      // Save mistake
      await addMistake(
        sessionId,
        userMessage,
        grammarCheck.correction || '',
        grammarCheck.error || 'Grammar error'
      );

      const response: CheckMessageResponse = {
        isCorrect: false,
        error: grammarCheck.error,
        suggestion: grammarCheck.correction,
      };

      return NextResponse.json(response);
    }

    // Message is correct
    // Generate improvement suggestion
    const improvement = await generateImprovement(userMessage);

    // Save user message
    await addMessage(
      sessionId,
      Role.USER,
      userMessage,
      userOrder,
      true,
      improvement
    );

    // Check if we've reached the message limit
    const newCount = await getMessageCount(sessionId);
    const isCompleted = newCount >= MAX_MESSAGES;

    if (isCompleted) {
      await completeSession(sessionId);

      const response: CheckMessageResponse = {
        isCorrect: true,
        improvement,
        messageCount: newCount,
        isCompleted: true,
      };

      return NextResponse.json(response);
    }

    // Generate next AI question
    const messages = await getSessionMessages(sessionId);
    const messageContents = messages.map(
      (m) => `${m.role}: ${m.content}`
    );

    const session = await prisma.writingSession.findUnique({
      where: { id: sessionId },
    });

    const aiMessage = await generateNextQuestion(
      session?.topic || '',
      messageContents
    );

    // Save AI message
    await addMessage(sessionId, Role.AI, aiMessage, newCount + 1);

    const response: CheckMessageResponse = {
      isCorrect: true,
      aiMessage,
      improvement,
      messageCount: newCount + 1,
      isCompleted: false,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error checking message:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Import prisma for the session lookup
import { prisma } from '@/lib/prisma';
