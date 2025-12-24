export interface StartSessionRequest {
  topic: string;
}

export interface StartSessionResponse {
  sessionId: string;
  aiMessage: string;
  messageCount: number;
}

export interface CheckMessageRequest {
  sessionId: string;
  userMessage: string;
}

export interface CheckMessageResponse {
  isCorrect: boolean;
  error?: string;
  suggestion?: string;
  aiMessage?: string;
  improvement?: string;
  messageCount?: number;
  isCompleted?: boolean;
}

export interface HistoryResponse {
  mistakes: {
    id: string;
    original: string;
    correction: string;
    explanation: string;
    createdAt: string;
    topic?: string;
  }[];
}

export interface SessionsResponse {
  sessions: {
    id: string;
    topic: string;
    status: string;
    messageCount: number;
    createdAt: string;
  }[];
}

export interface GoalSettings {
  weeklySessionGoal: number;
  reminderEnabled: boolean;
  reminderTime: string;
  reminderTimezone?: string | null;
}

export interface GoalProgress {
  weeklyCompleted: number;
  streakDays: number;
  lastCompletedAt: string | null;
  weekStart: string;
  weekEnd: string;
}

export interface GoalsResponse {
  goal: GoalSettings;
  progress: GoalProgress;
}

export interface TtsRequest {
  text: string;
  voiceName?: string;
  languageCode?: string;
}

export interface TtsResponse {
  audio: string;
  mimeType: string;
}
