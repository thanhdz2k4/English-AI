import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { getUserFlashcards, upsertFlashcard } from '@/services/flashcardService';
import type {
  CreateFlashcardRequest,
  CreateFlashcardResponse,
  FlashcardsResponse,
} from '@/types';

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const flashcards = await getUserFlashcards(user.id);

    const response: FlashcardsResponse = {
      flashcards: flashcards.map((card) => ({
        id: card.id,
        sourceText: card.sourceText,
        translation: card.translation,
        sourceLang: card.sourceLang,
        targetLang: card.targetLang,
        createdAt: card.createdAt.toISOString(),
      })),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching flashcards:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = (await request.json()) as CreateFlashcardRequest;
    const text = typeof body?.text === 'string' ? body.text.trim() : '';
    if (!text) {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      );
    }

    const translation =
      typeof body?.translation === 'string' ? body.translation.trim() : undefined;
    const sourceLang =
      typeof body?.sourceLang === 'string' && body.sourceLang.trim()
        ? body.sourceLang.trim()
        : 'en';
    const targetLang =
      typeof body?.targetLang === 'string' && body.targetLang.trim()
        ? body.targetLang.trim()
        : 'vi';

    const flashcard = await upsertFlashcard({
      userId: user.id,
      sourceText: text,
      translation,
      sourceLang,
      targetLang,
    });

    const response: CreateFlashcardResponse = {
      flashcard: {
        id: flashcard.id,
        sourceText: flashcard.sourceText,
        translation: flashcard.translation,
        sourceLang: flashcard.sourceLang,
        targetLang: flashcard.targetLang,
        createdAt: flashcard.createdAt.toISOString(),
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error saving flashcard:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
