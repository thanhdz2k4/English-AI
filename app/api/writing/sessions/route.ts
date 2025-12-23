import { NextRequest, NextResponse } from 'next/server';
import { getUserSessions } from '@/services/writingService';
import type { SessionsResponse } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    const sessions = await getUserSessions(userId);

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
