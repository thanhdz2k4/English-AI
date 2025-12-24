import { NextRequest, NextResponse } from 'next/server';
import { getUserSessions } from '@/services/writingService';
import type { SessionsResponse } from '@/types';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const sessions = await getUserSessions(user.id);

    const response: SessionsResponse = {
      sessions: sessions.map((s) => ({
        id: s.id,
        topic: s.topic,
        status: s.status,
        messageCount: s._count.messages,
        createdAt: s.createdAt.toISOString(),
      })),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
