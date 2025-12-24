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

  const startSession = async () => {
    if (!topic.trim()) {
      alert('Please enter a topic');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/writing/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic }),
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
        throw new Error('Failed to generate speech');
      }

      const data = await response.json();
      if (!data?.audio || !data?.mimeType) {
        throw new Error('Invalid speech response');
      }

      stopAudio();
      const audio = new Audio(
        `data:${data.mimeType};base64,${data.audio}`
      );
      audioRef.current = audio;
      await audio.play();
    } catch (error) {
      console.error('Error playing speech:', error);
    } finally {
      setIsSpeaking(false);
    }
  }, [router, stopAudio]);

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
    stopAudio();
    lastSpokenIndexRef.current = null;
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
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
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., daily life, hobbies, travel, food..."
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white mb-4"
              onKeyPress={(e) => e.key === 'Enter' && startSession()}
            />
            <button
              onClick={startSession}
              disabled={isLoading}
              className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-semibold transition-colors"
            >
              {isLoading ? 'Starting...' : 'Start Conversation'}
            </button>
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
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    placeholder="Type your response in English..."
                    className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    disabled={isLoading}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={isLoading || !userInput.trim()}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-semibold transition-colors"
                  >
                    {isLoading ? '...' : 'Send'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
