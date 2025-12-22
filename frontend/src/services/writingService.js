import api from './api';

export const writingService = {
  // Start a new writing session
  startSession: async (topic) => {
    const response = await api.post('/sessions', { topic });
    return response.data;
  },

  // Get session details
  getSession: async (sessionId) => {
    const response = await api.get(`/sessions/${sessionId}`);
    return response.data;
  },

  // Submit user response
  submitResponse: async (sessionId, userResponse) => {
    const response = await api.post(`/sessions/${sessionId}/respond`, {
      userResponse,
    });
    return response.data;
  },

  // Complete session
  completeSession: async (sessionId) => {
    const response = await api.post(`/sessions/${sessionId}/complete`);
    return response.data;
  },

  // Get conversation history
  getHistory: async (sessionId) => {
    const response = await api.get(`/sessions/${sessionId}/history`);
    return response.data;
  },

  // Get user mistakes
  getMistakes: async (filters = {}) => {
    const response = await api.get('/mistakes', { params: filters });
    return response.data;
  },

  // Mark mistake as reviewed
  reviewMistake: async (mistakeId) => {
    const response = await api.put(`/mistakes/${mistakeId}/review`);
    return response.data;
  },
};

export default writingService;
