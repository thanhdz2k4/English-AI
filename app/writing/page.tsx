'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Message {
  role: 'AI' | 'USER';
  content: string;
  isCorrect?: boolean;
  improvement?: string;
  error?: string;
  suggestion?: string;
}

const TOPIC_OPTIONS = [
  'Daily life',
  'Family',
  'Work',
  'School',
  'Hobbies',
  'Travel',
  'Food',
  'Health',
  'Technology',
  'Movies',
  'Sports',
  'Environment',
  'Shopping',
  'Future plans',
];

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

export default function WritingPage() {
  const router = useRouter();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [topic, setTopic] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSessionStarted, setIsSessionStarted] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [ttsError, setTtsError] = useState<string | null>(null);
  const [flashcardDraftIndex, setFlashcardDraftIndex] = useState<number | null>(null);
  const [flashcardText, setFlashcardText] = useState('');
  const [flashcardTranslation, setFlashcardTranslation] = useState('');
  const [flashcardStatus, setFlashcardStatus] = useState<
    Record<number, 'idle' | 'saving' | 'saved' | 'error'>
  >({});
  const [flashcardError, setFlashcardError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastSpokenIndexRef = useRef<number | null>(null);

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

  const startSession = async (selectedTopic?: string) => {
    const resolvedTopic = (selectedTopic ?? topic).trim();
    if (!resolvedTopic) {
      alert('Please choose a topic');
      return;
    }

    setTopic(resolvedTopic);
    setIsLoading(true);
    try {
      const response = await fetch('/api/writing/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: resolvedTopic }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          router.push('/login');
          return;
        }
        throw new Error('Failed to start session');
      }

      const data = await response.json();
      setSessionId(data.sessionId);
      setMessages([{ role: 'AI', content: data.aiMessage }]);
      setIsSessionStarted(true);
    } catch (error) {
      console.error('Error starting session:', error);
      alert('Failed to start session');
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!userInput.trim() || !sessionId) return;

    const userMessage = userInput.trim();
    setUserInput('');
    setIsLoading(true);

    // Add user message to UI immediately
    setMessages((prev) => [...prev, { role: 'USER', content: userMessage }]);

    try {
      const response = await fetch('/api/writing/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, userMessage }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          router.push('/login');
          return;
        }
        throw new Error('Failed to send message');
      }

      const data = await response.json();

      if (!data.isCorrect) {
        // Show error
        setMessages((prev) => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1] = {
            ...newMessages[newMessages.length - 1],
            isCorrect: false,
            error: data.error,
            suggestion: data.suggestion,
          };
          return newMessages;
        });
      } else {
        // Show improvement and next AI message
        setMessages((prev) => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1] = {
            ...newMessages[newMessages.length - 1],
            isCorrect: true,
            improvement: data.improvement,
          };
          return newMessages;
        });

        if (data.isCompleted) {
          setIsCompleted(true);
        } else if (data.aiMessage) {
          setMessages((prev) => [...prev, { role: 'AI', content: data.aiMessage }]);
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message');
    } finally {
      setIsLoading(false);
    }
  };

  const stopAudio = useCallback(() => {
    if (!audioRef.current) return;
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
    audioRef.current = null;
  }, []);

  const speakText = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    setIsSpeaking(true);
    setTtsError(null);
    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: trimmed }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          router.push('/login');
          return;
        }
        const errorData = await response.json().catch(() => null);
        setTtsError(
          errorData?.error
            ? `TTS error: ${errorData.error}`
            : `TTS request failed (${response.status})`
        );
        return;
      }

      const data = await response.json();
      if (!data?.audio || !data?.mimeType) {
        setTtsError('TTS returned no audio.');
        return;
      }

      stopAudio();
      const audio = new Audio(
        `data:${data.mimeType};base64,${data.audio}`
      );
      audioRef.current = audio;
      try {
        await audio.play();
      } catch (playError) {
        const message =
          playError instanceof DOMException
            && playError.name === 'NotAllowedError'
            ? 'Autoplay blocked. Tap Listen to play.'
            : 'Audio playback failed.';
        setTtsError(message);
      }
    } catch (error) {
      console.error('Error playing speech:', error);
      setTtsError('Audio playback failed.');
    } finally {
      setIsSpeaking(false);
    }
  }, [router, stopAudio]);

  const openFlashcardDraft = (index: number, message: string) => {
    const selection = window.getSelection()?.toString().trim();
    const draftText =
      selection && message.includes(selection) ? selection : message;
    setFlashcardDraftIndex(index);
    setFlashcardText(draftText);
    setFlashcardTranslation('');
    setFlashcardError(null);
  };

  const cancelFlashcardDraft = () => {
    setFlashcardDraftIndex(null);
    setFlashcardText('');
    setFlashcardTranslation('');
    setFlashcardError(null);
  };

  const saveFlashcard = async () => {
    if (flashcardDraftIndex === null) return;

    const text = flashcardText.trim();
    if (!text) {
      setFlashcardError('Please enter a phrase to save.');
      return;
    }

    const translation = flashcardTranslation.trim();
    setFlashcardError(null);
    setFlashcardStatus((prev) => ({
      ...prev,
      [flashcardDraftIndex]: 'saving',
    }));

    try {
      const response = await fetch('/api/flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          translation: translation || undefined,
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          router.push('/login');
          return;
        }
        const data = await response.json().catch(() => null);
        const message = data?.error
          ? String(data.error)
          : 'Failed to save flashcard.';
        setFlashcardError(message);
        setFlashcardStatus((prev) => ({
          ...prev,
          [flashcardDraftIndex]: 'error',
        }));
        return;
      }

      setFlashcardStatus((prev) => ({
        ...prev,
        [flashcardDraftIndex]: 'saved',
      }));
      cancelFlashcardDraft();
    } catch (error) {
      console.error('Error saving flashcard:', error);
      setFlashcardError('Failed to save flashcard.');
      setFlashcardStatus((prev) => ({
        ...prev,
        [flashcardDraftIndex]: 'error',
      }));
    }
  };

  useEffect(() => {
    if (!autoSpeak) return;
    if (messages.length === 0) {
      lastSpokenIndexRef.current = null;
      return;
    }

    const lastIndex = messages.length - 1;
    const lastMessage = messages[lastIndex];
    if (lastMessage.role !== 'AI') return;
    if (lastSpokenIndexRef.current === lastIndex) return;

    lastSpokenIndexRef.current = lastIndex;
    void speakText(lastMessage.content);
  }, [autoSpeak, messages, speakText]);

  const resetSession = () => {
    setSessionId(null);
    setTopic('');
    setMessages([]);
    setUserInput('');
    setIsSessionStarted(false);
    setIsCompleted(false);
    setTtsError(null);
    setFlashcardDraftIndex(null);
    setFlashcardText('');
    setFlashcardTranslation('');
    setFlashcardStatus({});
    setFlashcardError(null);
    stopAudio();
    lastSpokenIndexRef.current = null;
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      setTtsError(null);
      stopAudio();
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
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Writing Practice
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Practice your English writing with AI feedback
          </p>
          <div className="mt-4 flex items-center justify-center gap-3 text-sm">
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

        {!isSessionStarted ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
            <label className="block text-lg font-semibold mb-2">
              Choose a topic to start:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {TOPIC_OPTIONS.map((option) => (
                <button
                  key={option}
                  onClick={() => startSession(option)}
                  disabled={isLoading}
                  className="px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-semibold transition-colors"
                  type="button"
                >
                  {option}
                </button>
              ))}
            </div>
            {isLoading && (
              <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                Starting...
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Topic:</span>
                  <span className="ml-2 font-semibold">{topic}</span>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <label className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <input
                      type="checkbox"
                      checked={autoSpeak}
                      onChange={(e) => setAutoSpeak(e.target.checked)}
                      className="h-4 w-4"
                    />
                    Auto speak AI
                  </label>
                  {isSpeaking && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Speaking...
                    </span>
                  )}
                  {ttsError && (
                    <span className="text-xs text-red-600 dark:text-red-300">
                      {ttsError}
                    </span>
                  )}
                  <button
                    onClick={resetSession}
                    className="px-4 py-2 text-sm bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg transition-colors"
                  >
                    New Topic
                  </button>
                </div>
              </div>

              <div className="space-y-4 max-h-[500px] overflow-y-auto mb-4">
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.role === 'USER' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-4 ${
                        msg.role === 'AI'
                          ? 'bg-blue-100 dark:bg-blue-900'
                          : msg.isCorrect === false
                          ? 'bg-red-100 dark:bg-red-900'
                          : 'bg-green-100 dark:bg-green-900'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="font-semibold text-sm">
                          {msg.role === 'AI' ? 'AI Teacher' : 'You'}
                        </div>
                        {msg.role === 'AI' && (
                          <button
                            onClick={() => speakText(msg.content)}
                            className="px-2 py-1 text-xs rounded-md bg-white/70 hover:bg-white dark:bg-gray-700 dark:hover:bg-gray-600"
                            type="button"
                          >
                            Listen
                          </button>
                        )}
                      </div>
                      <div>{msg.content}</div>

                      <div className="mt-2 inline-flex flex-wrap items-center gap-2 rounded-md border border-gray-200 bg-white/70 px-2 py-1 text-xs text-gray-700 dark:border-gray-700 dark:bg-gray-800/60 dark:text-gray-200">
                        <a
                          href={buildTranslateUrl(msg.content)}
                          target="_blank"
                          rel="noreferrer"
                          className="font-semibold text-blue-700 hover:text-blue-800 dark:text-blue-300"
                        >
                          Translate
                        </a>
                        <button
                          onClick={() => openFlashcardDraft(idx, msg.content)}
                          disabled={flashcardStatus[idx] === 'saving'}
                          className="font-semibold text-amber-700 hover:text-amber-800 disabled:text-gray-400 dark:text-amber-300 dark:hover:text-amber-200"
                          type="button"
                        >
                          Add to list
                        </button>
                        {flashcardStatus[idx] === 'saving' && (
                          <span className="text-gray-500 dark:text-gray-400">
                            Saving...
                          </span>
                        )}
                        {flashcardStatus[idx] === 'saved' && (
                          <span className="text-green-700 dark:text-green-300">
                            Saved
                          </span>
                        )}
                        {flashcardStatus[idx] === 'error' && (
                          <span className="text-red-600 dark:text-red-300">
                            Failed
                          </span>
                        )}
                      </div>

                      {flashcardDraftIndex === idx && (
                        <div className="mt-3 rounded-md border border-blue-200 bg-white/80 p-3 text-xs dark:border-blue-800/60 dark:bg-gray-800/70">
                          <div className="mb-2">
                            <label className="block text-xs font-semibold mb-1">
                              Phrase
                            </label>
                            <input
                              type="text"
                              value={flashcardText}
                              onChange={(e) => setFlashcardText(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                              placeholder="Enter a word or phrase"
                            />
                          </div>
                          <div className="mb-3">
                            <label className="block text-xs font-semibold mb-1">
                              Meaning (optional)
                            </label>
                            <input
                              type="text"
                              value={flashcardTranslation}
                              onChange={(e) =>
                                setFlashcardTranslation(e.target.value)
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                              placeholder="Add your translation"
                            />
                          </div>
                          {flashcardError && (
                            <div className="mb-2 text-xs text-red-600 dark:text-red-300">
                              {flashcardError}
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <button
                              onClick={saveFlashcard}
                              className="px-3 py-1 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold"
                              type="button"
                            >
                              Save
                            </button>
                            <button
                              onClick={cancelFlashcardDraft}
                              className="px-3 py-1 rounded-md bg-gray-200 hover:bg-gray-300 text-xs font-semibold dark:bg-gray-700 dark:hover:bg-gray-600"
                              type="button"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}

                      {msg.isCorrect === false && (
                        <div className="mt-3 pt-3 border-t border-red-300 dark:border-red-700">
                          <div className="text-sm text-red-700 dark:text-red-300 mb-2">
                            Error: {msg.error}
                          </div>
                          <div className="text-sm">
                            <span className="font-semibold">Correction:</span> {msg.suggestion}
                          </div>
                        </div>
                      )}

                      {msg.isCorrect === true && msg.improvement && (
                        <div className="mt-3 pt-3 border-t border-green-300 dark:border-green-700">
                          <div className="text-sm">
                            <span className="font-semibold">Better way:</span>
                            <div className="mt-1 italic">{msg.improvement}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {isCompleted ? (
                <div className="text-center p-6 bg-gradient-to-r from-green-100 to-blue-100 dark:from-green-900 dark:to-blue-900 rounded-lg">
                  <h3 className="text-2xl font-bold mb-2">Congratulations!</h3>
                  <p className="mb-4">You've completed this writing session!</p>
                  <button
                    onClick={resetSession}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
                  >
                    Start New Session
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="text-sm text-gray-600 dark:text-gray-400 italic">
                    💡 Tip: Write 2-3 sentences to practice more! Share details, examples, or your feelings.
                  </div>
                  <div className="flex gap-2">
                    <textarea
                      value={userInput}
                      onChange={(e) => setUserInput(e.target.value)}
                      placeholder="Type your response in English... (Try to write at least 2-3 sentences)"
                      className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white resize-none"
                      rows={3}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          sendMessage();
                        }
                      }}
                      disabled={isLoading}
                    />
                    <button
                      onClick={sendMessage}
                      disabled={isLoading || !userInput.trim()}
                      className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-semibold transition-colors self-end"
                    >
                      {isLoading ? '...' : 'Send'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
