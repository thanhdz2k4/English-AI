import { prisma } from '@/lib/prisma';
import { Role, SessionStatus } from '@prisma/client';

export async function createSession(userId: string, topic: string) {
  return await prisma.writingSession.create({
    data: {
      userId,
      topic,
      status: SessionStatus.IN_PROGRESS,
    },
  });
}

export async function addMessage(
  sessionId: string,
  role: Role,
  content: string,
  order: number,
  isCorrect?: boolean,
  improved?: string
) {
  return await prisma.message.create({
    data: {
      sessionId,
      role,
      content,
      order,
      isCorrect,
      improved,
    },
  });
}

export async function addMistake(
  sessionId: string,
  original: string,
  correction: string,
  explanation: string
) {
  return await prisma.mistake.create({
    data: {
      sessionId,
      original,
      correction,
      explanation,
    },
  });
}

export async function getMessageCount(sessionId: string): Promise<number> {
  return await prisma.message.count({
    where: { sessionId },
  });
}

export async function getSessionMessages(sessionId: string) {
  return await prisma.message.findMany({
    where: { sessionId },
    orderBy: { order: 'asc' },
  });
}

export async function completeSession(sessionId: string) {
  return await prisma.writingSession.update({
    where: { id: sessionId },
    data: { status: SessionStatus.COMPLETED },
  });
}

export async function getUserMistakes(userId: string, reviewed: boolean = false) {
  return await prisma.mistake.findMany({
    where: {
      session: {
        userId,
      },
      reviewed,
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
}

export async function getUserSessions(userId: string) {
  return await prisma.writingSession.findMany({
    where: { userId },
    include: {
      _count: {
        select: { messages: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}
