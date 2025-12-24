'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const TOPICS = [
  'Daily life',
  'Work',
  'School',
  'Family',
  'Food',
  'Travel',
  'Hobbies',
  'Health',
  'Shopping',
  'Technology',
];

interface Exercise {
  sentence: string;
  answer: string;
  blankType: 'verb' | 'preposition' | 'phrase';
}

export default function FillBlankPage() {
  const router = useRouter();
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [topic, setTopic] = useState('Daily life');
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    isCorrect: boolean;
    feedback?: string;
  } | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  useEffect(() => {
    const loadUser = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (!response.ok) {
          router.push('/login');
          return;
        }
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

  const generateExercise = async () => {
    setIsLoading(true);
    setResult(null);
    setUserAnswer('');
    
    try {
      const response = await fetch('/api/practice/fill-blank', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate', topic }),
      });

      if (!response.ok) throw new Error('Failed to generate exercise');

      const data = await response.json();
      setExercise(data);
    } catch (error) {
      console.error('Error generating exercise:', error);
      alert('Failed to generate exercise. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const checkAnswer = async () => {
    if (!exercise || !userAnswer.trim()) return;

    setIsChecking(true);
    try {
      const response = await fetch('/api/practice/fill-blank', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'check',
          userAnswer: userAnswer.trim(),
          correctAnswer: exercise.answer,
        }),
      });

      if (!response.ok) throw new Error('Failed to check answer');

      const data = await response.json();
      setResult(data);
      
      setScore((prev) => ({
        correct: prev.correct + (data.isCorrect ? 1 : 0),
        total: prev.total + 1,
      }));
    } catch (error) {
      console.error('Error checking answer:', error);
      alert('Failed to check answer. Please try again.');
    } finally {
      setIsChecking(false);
    }
  };

  if (!isAuthReady) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white dark:from-gray-900 dark:to-gray-800 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold text-indigo-600 dark:text-indigo-400">
            Fill in the Blank
          </h1>
          <Link
            href="/"
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg transition-colors"
          >
            Back to Home
          </Link>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 space-y-6">
          {/* Score */}
          <div className="flex justify-between items-center p-4 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
            <div className="text-lg font-semibold">
              Score: {score.correct} / {score.total}
              {score.total > 0 && (
                <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                  ({Math.round((score.correct / score.total) * 100)}%)
                </span>
              )}
            </div>
          </div>

          {/* Topic Selection */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Choose Topic:
            </label>
            <select
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
              disabled={isLoading}
            >
              {TOPICS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Generate Button */}
          {!exercise && (
            <button
              onClick={generateExercise}
              disabled={isLoading}
              className="w-full px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white rounded-lg font-semibold transition-colors"
            >
              {isLoading ? 'Generating...' : 'Generate Exercise'}
            </button>
          )}

          {/* Exercise */}
          {exercise && (
            <div className="space-y-6">
              <div className="p-6 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Type: {exercise.blankType}
                </div>
                <div className="text-2xl font-medium text-gray-800 dark:text-gray-200 leading-relaxed">
                  {exercise.sentence}
                </div>
              </div>

              {!result && (
                <div className="space-y-4">
                  <input
                    type="text"
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    placeholder="Type your answer here..."
                    className="w-full px-4 py-3 border-2 border-indigo-300 dark:border-indigo-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white text-lg"
                    onKeyPress={(e) => e.key === 'Enter' && checkAnswer()}
                    disabled={isChecking}
                    autoFocus
                  />
                  <button
                    onClick={checkAnswer}
                    disabled={isChecking || !userAnswer.trim()}
                    className="w-full px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white rounded-lg font-semibold transition-colors"
                  >
                    {isChecking ? 'Checking...' : 'Check Answer'}
                  </button>
                </div>
              )}

              {result && (
                <div
                  className={`p-6 rounded-lg ${
                    result.isCorrect
                      ? 'bg-green-100 dark:bg-green-900/30 border-2 border-green-500'
                      : 'bg-red-100 dark:bg-red-900/30 border-2 border-red-500'
                  }`}
                >
                  <div className="text-xl font-semibold mb-2">
                    {result.isCorrect ? '✅ Correct!' : '❌ Incorrect'}
                  </div>
                  <div className="text-lg mb-2">
                    <strong>Your answer:</strong> {userAnswer}
                  </div>
                  <div className="text-lg mb-2">
                    <strong>Correct answer:</strong> {exercise.answer}
                  </div>
                  {result.feedback && (
                    <div className="text-sm text-gray-700 dark:text-gray-300 mt-2">
                      {result.feedback}
                    </div>
                  )}
                  <button
                    onClick={generateExercise}
                    className="mt-4 w-full px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-colors"
                  >
                    Next Exercise
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
