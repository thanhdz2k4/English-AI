import { NextRequest, NextResponse } from 'next/server';
import { getUserMistakes } from '@/services/writingService';
import type { HistoryResponse } from '@/types';

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

    const mistakes = await getUserMistakes(userId, false);

    const response: HistoryResponse = {
      mistakes: mistakes.map((m) => ({
        id: m.id,
        original: m.original,
        correction: m.correction,
        explanation: m.explanation,
        createdAt: m.createdAt.toISOString(),
      })),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching history:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
