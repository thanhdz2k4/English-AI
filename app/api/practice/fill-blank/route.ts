import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { generateFillInBlank, checkFillInBlank } from '@/services/aiService';

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, topic, userAnswer, correctAnswer } = body;

    if (action === 'generate') {
      if (!topic) {
        return NextResponse.json(
          { error: 'Topic is required' },
          { status: 400 }
        );
      }

      const exercise = await generateFillInBlank(topic);
      return NextResponse.json(exercise);
    }

    if (action === 'check') {
      if (!userAnswer || !correctAnswer) {
        return NextResponse.json(
          { error: 'userAnswer and correctAnswer are required' },
          { status: 400 }
        );
      }

      const result = await checkFillInBlank(userAnswer, correctAnswer);
      return NextResponse.json(result);
    }

    return NextResponse.json(
      { error: 'Invalid action. Use "generate" or "check"' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error in fill-blank API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
