import { prisma } from '@/lib/prisma';

type UpsertFlashcardInput = {
  userId: string;
  sourceText: string;
  translation?: string | null;
  sourceLang?: string;
  targetLang?: string;
};

export async function upsertFlashcard({
  userId,
  sourceText,
  translation,
  sourceLang = 'en',
  targetLang = 'vi',
}: UpsertFlashcardInput) {
  const trimmedSource = sourceText.trim();
  const trimmedTranslation = translation?.trim();

  if (!trimmedSource) {
    throw new Error('sourceText is required');
  }

  return await prisma.flashcard.upsert({
    where: {
      userId_sourceText: {
        userId,
        sourceText: trimmedSource,
      },
    },
    create: {
      userId,
      sourceText: trimmedSource,
      translation: trimmedTranslation || null,
      sourceLang,
      targetLang,
    },
    update: {
      translation: trimmedTranslation || undefined,
      sourceLang,
      targetLang,
    },
  });
}

export async function getUserFlashcards(userId: string) {
  return await prisma.flashcard.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
}
