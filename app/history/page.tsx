'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Mistake {
  id: string;
  original: string;
  correction: string;
  explanation: string;
  createdAt: string;
}

export default function HistoryPage() {
  const [userId] = useState('demo_user_123');
  const [mistakes, setMistakes] = useState<Mistake[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/writing/history?userId=${userId}`);
      const data = await response.json();
      setMistakes(data.mistakes || []);
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link
            href="/"
            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 mb-4 inline-block"
          >
            ← Back to Home
          </Link>
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Mistakes History
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Review your past mistakes to improve
          </p>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="text-xl">Loading...</div>
          </div>
        ) : mistakes.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
            <p className="text-xl mb-4">No mistakes recorded yet! 🎉</p>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Start practicing to see your mistakes here
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
            {mistakes.map((mistake) => (
              <div
                key={mistake.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6"
              >
                <div className="flex items-start gap-4">
                  <div className="text-3xl">❌</div>
                  <div className="flex-1">
                    <div className="mb-3">
                      <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                        Your sentence:
                      </div>
                      <div className="text-lg text-red-600 dark:text-red-400 line-through">
                        {mistake.original}
                      </div>
                    </div>

                    <div className="mb-3">
                      <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                        Correction:
                      </div>
                      <div className="text-lg text-green-600 dark:text-green-400 font-semibold">
                        {mistake.correction}
                      </div>
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-900 rounded-lg p-3">
                      <div className="text-sm font-semibold mb-1">
                        💡 Explanation:
                      </div>
                      <div className="text-sm">{mistake.explanation}</div>
                    </div>

                    <div className="mt-3 text-xs text-gray-400">
                      {new Date(mistake.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
