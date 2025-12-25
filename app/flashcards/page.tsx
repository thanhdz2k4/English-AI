'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Flashcard {
  id: string;
  sourceText: string;
  translation?: string | null;
  sourceLang: string;
  targetLang: string;
  createdAt: string;
}

const buildTranslateUrl = (
  text: string,
  sourceLang = 'en',
  targetLang = 'vi'
) =>
  `https://translate.google.com/?sl=${encodeURIComponent(
    sourceLang
  )}&tl=${encodeURIComponent(targetLang)}&text=${encodeURIComponent(
    text
  )}&op=translate`;

export default function FlashcardsPage() {
  const router = useRouter();
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const loadUser = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (!response.ok) {
          router.push('/login');
          return;
        }
        const data = await response.json();
        const user = data.user;
        setDisplayName(user?.name || user?.email || null);
        await fetchFlashcards();
      } catch (error) {
        console.error('Error loading user:', error);
        router.push('/login');
        return;
      } finally {
        setIsAuthReady(true);
      }
    };

    loadUser();
  }, [router]);

  const fetchFlashcards = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/flashcards');
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/login');
          return;
        }
        throw new Error('Failed to load flashcards');
      }
      const data = await response.json();
      setFlashcards(data.flashcards || []);
    } catch (error) {
      console.error('Error fetching flashcards:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleReveal = (id: string) => {
    setRevealed((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      router.push('/login');
    }
  };

  if (!isAuthReady) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 p-4">
        <div className="max-w-4xl mx-auto text-center py-12">
          <div className="text-xl">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link
            href="/"
            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 mb-4 inline-block"
          >
            Back to Home
          </Link>
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Flashcards
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Save phrases from your chats and practice them later.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
            {displayName && (
              <span className="text-gray-500 dark:text-gray-400">
                Signed in as {displayName}
              </span>
            )}
            <button
              onClick={handleLogout}
              className="px-3 py-1 rounded-md bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
            >
              Sign out
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="text-xl">Loading...</div>
          </div>
        ) : flashcards.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
            <p className="text-xl mb-4">No flashcards saved yet.</p>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Save phrases from the writing chat to build your list.
            </p>
            <Link
              href="/writing"
              className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
            >
              Start Writing Practice
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {flashcards.map((card) => {
              const isRevealed = revealed[card.id];
              const translationText = card.translation?.trim()
                ? card.translation
                : 'No translation yet.';

              return (
                <div
                  key={card.id}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="text-lg font-semibold">
                      {card.sourceText}
                    </div>
                    <button
                      onClick={() => toggleReveal(card.id)}
                      className="px-3 py-1 rounded-md text-xs font-semibold bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/50 dark:text-blue-200"
                      type="button"
                    >
                      {isRevealed ? 'Hide meaning' : 'Show meaning'}
                    </button>
                  </div>

                  <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                    Meaning
                  </div>
                  <div className="text-base">
                    {isRevealed ? translationText : 'Hidden'}
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                    <a
                      href={buildTranslateUrl(
                        card.sourceText,
                        card.sourceLang,
                        card.targetLang
                      )}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 hover:text-blue-700 dark:text-blue-300"
                    >
                      Open in Google Translate
                    </a>
                    <span>
                      {new Date(card.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
