import { NextRequest, NextResponse } from 'next/server';
import { getUserMistakes } from '@/services/writingService';
import type { HistoryResponse } from '@/types';
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

    const mistakes = await getUserMistakes(user.id, false);

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
