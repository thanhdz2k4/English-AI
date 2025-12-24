import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { generateSpeech } from '@/services/ttsService';
import type { TtsRequest, TtsResponse } from '@/types';

const MAX_TEXT_LENGTH = 1000;

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body: TtsRequest = await request.json();
    const text = typeof body.text === 'string' ? body.text.trim() : '';
    const voiceName =
      typeof body.voiceName === 'string' ? body.voiceName.trim() : '';
    const languageCode =
      typeof body.languageCode === 'string' ? body.languageCode.trim() : '';

    if (!text) {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      );
    }

    if (text.length > MAX_TEXT_LENGTH) {
      return NextResponse.json(
        { error: 'Text is too long' },
        { status: 400 }
      );
    }

    const audio = await generateSpeech(text, {
      languageCode: languageCode || undefined,
      voiceName: voiceName || undefined,
    });

    const response: TtsResponse = audio;
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error generating speech:', error);
    const debugEnabled =
      process.env.TTS_DEBUG_ERRORS?.trim() === 'true'
      || process.env.NODE_ENV !== 'production';
    if (debugEnabled) {
      const message =
        error instanceof Error
          ? error.message
          : 'Internal server error';
      return NextResponse.json(
        { error: message },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
