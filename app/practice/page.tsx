'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Mistake {
  id: string;
  original: string;
  correction: string;
  explanation: string;
  createdAt: string;
  topic?: string;
}

interface PracticeState {
  input: string;
  checked: boolean;
}

export default function PracticePage() {
  const router = useRouter();
  const [mistakes, setMistakes] = useState<Mistake[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<string>('all');
  const [practiceState, setPracticeState] = useState<Record<string, PracticeState>>({});

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
        await fetchMistakes();
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

  const fetchMistakes = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/writing/history');
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/login');
          return;
        }
        throw new Error('Failed to load mistakes');
      }
      const data = await response.json();
      setMistakes(data.mistakes || []);
    } catch (error) {
      console.error('Error fetching mistakes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const groupedByTopic = useMemo(() => {
    const groups: Record<string, Mistake[]> = {};
    mistakes.forEach((mistake) => {
      const topic = mistake.topic || 'General';
      if (!groups[topic]) groups[topic] = [];
      groups[topic].push(mistake);
    });
    return groups;
  }, [mistakes]);

  const topics = useMemo(() => {
    return Object.keys(groupedByTopic).sort((a, b) => a.localeCompare(b));
  }, [groupedByTopic]);

  const handleInputChange = (id: string, value: string) => {
    setPracticeState((prev) => ({
      ...prev,
      [id]: {
        input: value,
        checked: prev[id]?.checked ?? false,
      },
    }));
  };

  const handleCheck = (id: string) => {
    setPracticeState((prev) => ({
      ...prev,
      [id]: {
        input: prev[id]?.input ?? '',
        checked: true,
      },
    }));
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      router.push('/login');
    }
  };

  const normalize = (value: string) =>
    value.trim().toLowerCase().replace(/\s+/g, ' ');

  const renderMistake = (mistake: Mistake) => {
    const state = practiceState[mistake.id];
    const input = state?.input ?? '';
    const isChecked = state?.checked ?? false;
    const isMatch =
      normalize(input) === normalize(mistake.correction || '');

    return (
      <div
        key={mistake.id}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6"
      >
        <div className="mb-3">
          <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
            Original sentence:
          </div>
          <div className="text-lg text-red-600 dark:text-red-400 line-through">
            {mistake.original}
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-semibold mb-1">
            Your corrected sentence
          </label>
          <input
            type="text"
            value={input}
            onChange={(event) => handleInputChange(mistake.id, event.target.value)}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            placeholder="Type your improved sentence..."
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => handleCheck(mistake.id)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
          >
            Check answer
          </button>
          {isChecked && (
            <span
              className={`text-sm font-semibold ${
                isMatch ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              }`}
            >
              {isMatch ? 'Correct!' : 'Not quite yet'}
            </span>
          )}
        </div>

        {isChecked && (
          <div className="mt-4 space-y-3">
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                Suggested correction:
              </div>
              <div className="text-lg text-green-600 dark:text-green-400 font-semibold">
                {mistake.correction}
              </div>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900 rounded-lg p-3">
              <div className="text-sm font-semibold mb-1">Explanation:</div>
              <div className="text-sm">{mistake.explanation}</div>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (!isAuthReady) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 p-4">
        <div className="max-w-5xl mx-auto text-center py-12">
          <div className="text-xl">Loading...</div>
        </div>
      </div>
    );
  }

  const visibleTopics =
    selectedTopic === 'all' ? topics : [selectedTopic].filter(Boolean);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <Link
            href="/"
            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 mb-4 inline-block"
          >
            Back to Home
          </Link>
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Practice by Topic
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Review your mistakes and practice corrections by topic.
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

        <div className="mb-6 flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedTopic('all')}
            className={`px-3 py-2 rounded-full text-sm font-semibold ${
              selectedTopic === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 dark:text-gray-200'
            }`}
          >
            All topics
          </button>
          {topics.map((topic) => (
            <button
              key={topic}
              onClick={() => setSelectedTopic(topic)}
              className={`px-3 py-2 rounded-full text-sm font-semibold ${
                selectedTopic === topic
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 dark:text-gray-200'
              }`}
            >
              {topic}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="text-xl">Loading...</div>
          </div>
        ) : mistakes.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
            <p className="text-xl mb-4">No mistakes recorded yet.</p>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Start practicing to build your mistake list first.
            </p>
            <Link
              href="/writing"
              className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
            >
              Start Writing Practice
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {visibleTopics.map((topic) => (
              <section key={topic} className="space-y-4">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                  {topic}
                </h2>
                <div className="space-y-4">
                  {groupedByTopic[topic]?.map(renderMistake)}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
