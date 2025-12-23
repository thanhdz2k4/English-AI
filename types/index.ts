export interface StartSessionRequest {
  topic: string;
  userId: string;
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
