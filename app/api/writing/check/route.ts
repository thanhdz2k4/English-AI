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
import { getUserFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const MAX_MESSAGES = 30000;

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body: CheckMessageRequest = await request.json();
    const { sessionId, userMessage } = body;

    if (!sessionId || !userMessage) {
      return NextResponse.json(
        { error: 'SessionId and userMessage are required' },
        { status: 400 }
      );
    }

    const session = await prisma.writingSession.findUnique({
      where: { id: sessionId },
      select: { userId: true, topic: true },
    });

    if (!session || session.userId !== user.id) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Get current message count
    const currentCount = await getMessageCount(sessionId);
    const userOrder = currentCount + 1;

    // Check grammar
    const grammarCheck = await checkGrammar(userMessage);

    if (grammarCheck.fallback) {
      await addMessage(
        sessionId,
        Role.USER,
        userMessage,
        userOrder,
        true
      );

      const newCount = userOrder;
      const isCompleted = newCount >= MAX_MESSAGES;

      if (isCompleted) {
        await completeSession(sessionId);

        const response: CheckMessageResponse = {
          isCorrect: true,
          messageCount: newCount,
          isCompleted: true,
        };

        return NextResponse.json(response);
      }

      const fallbackTopic = session.topic || 'this topic';
      const aiMessage = `Thanks! Can you share more about ${fallbackTopic}?`;
      await addMessage(sessionId, Role.AI, aiMessage, newCount + 1);

      const response: CheckMessageResponse = {
        isCorrect: true,
        aiMessage,
        messageCount: newCount + 1,
        isCompleted: false,
      };

      return NextResponse.json(response);
    }

    if (!grammarCheck.isCorrect) {
      // Check if correction is same as original - means AI made a mistake
      const cleanOriginal = userMessage.trim().toLowerCase();
      const cleanCorrection = (grammarCheck.correction || '').trim().toLowerCase();
      
      if (cleanOriginal === cleanCorrection) {
        // AI bắt nhầm - treat as correct
        console.log('Grammar check false positive - correction same as original');
        grammarCheck.isCorrect = true;
      } else {
        // Real error - save it
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
    }

    // Message is correct (or false positive)
    const isCompleted = userOrder >= MAX_MESSAGES;

    const messages = await getSessionMessages(sessionId);
    const messageContents = messages.map(
      (m) => `${m.role}: ${m.content}`
    );
    messageContents.push(`USER: ${userMessage}`);

    const improvementPromise = generateImprovement(userMessage);
    const nextQuestionPromise = isCompleted
      ? null
      : generateNextQuestion(session.topic, messageContents);

    const improvement = await improvementPromise;

    // Save user message
    await addMessage(
      sessionId,
      Role.USER,
      userMessage,
      userOrder,
      true,
      improvement
    );

    if (isCompleted) {
      await completeSession(sessionId);

      const response: CheckMessageResponse = {
        isCorrect: true,
        improvement,
        messageCount: userOrder,
        isCompleted: true,
      };

      return NextResponse.json(response);
    }

    const aiMessage = await nextQuestionPromise!;

    // Save AI message
    await addMessage(sessionId, Role.AI, aiMessage, userOrder + 1);

    const response: CheckMessageResponse = {
      isCorrect: true,
      aiMessage,
      improvement,
      messageCount: userOrder + 1,
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
