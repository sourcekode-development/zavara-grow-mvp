// ============================================================================
// SESSIONS STORE - Zustand State Management
// ============================================================================

import { create } from 'zustand';
import type {
  CadenceSession,
  SessionsQueryFilters,
  CreateSessionRequest,
  UpdateSessionRequest,
} from '../types';
import * as sessionsApi from '../apis/sessions.api';

interface SessionsState {
  // State
  sessions: CadenceSession[];
  todaysSessions: CadenceSession[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchSessions: (filters?: SessionsQueryFilters) => Promise<void>;
  fetchTodaysSessions: (userId: string) => Promise<void>;
  createSession: (data: CreateSessionRequest) => Promise<CadenceSession | null>;
  updateSession: (sessionId: string, data: Partial<CadenceSession>) => Promise<boolean>;
  startSession: (sessionId: string) => Promise<string | null>;
  completeSession: (sessionId: string, summary?: string) => Promise<string | null>;
  skipSession: (sessionId: string, reason?: string) => Promise<void>;
  deleteSession: (sessionId: string) => Promise<void>;
  clearError: () => void;
}

export const useSessionsStore = create<SessionsState>((set, get) => ({
  // Initial State
  sessions: [],
  todaysSessions: [],
  isLoading: false,
  error: null,

  // Fetch sessions with filters
  fetchSessions: async (filters?: SessionsQueryFilters) => {
    set({ isLoading: true, error: null });
    try {
      const sessions = await sessionsApi.getSessions(filters);
      set({ sessions, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch sessions',
        isLoading: false,
      });
    }
  },

  // Fetch today's sessions for a user
  fetchTodaysSessions: async (userId: string) => {
    set({ isLoading: true, error: null });
    try {
      const todaysSessions = await sessionsApi.getTodaysSessions(userId);
      set({ todaysSessions, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch today\'s sessions',
        isLoading: false,
      });
    }
  },

  // Create a new session
  createSession: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const newSession = await sessionsApi.createSession(data);
      
      // Refresh sessions
      if (get().sessions.length > 0) {
        await get().fetchSessions({ goal_id: data.goal_id });
      }
      
      set({ isLoading: false });
      return newSession;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to create session',
        isLoading: false,
      });
      return null;
    }
  },

  // Update session
  updateSession: async (sessionId: string, data) => {
    set({ isLoading: true, error: null });
    try {
      await sessionsApi.updateSession(sessionId, data as UpdateSessionRequest);
      
      // Update local state
      set((state) => ({
        sessions: state.sessions.map((s) =>
          s.id === sessionId ? { ...s, ...data } : s
        ),
        todaysSessions: state.todaysSessions.map((s) =>
          s.id === sessionId ? { ...s, ...data } : s
        ),
        isLoading: false,
      }));
      return true;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to update session',
        isLoading: false,
      });
      return false;
    }
  },

  // Start session
  startSession: async (sessionId: string) => {
    set({ isLoading: true, error: null });
    try {
      await sessionsApi.startSession(sessionId);
      
      // Update local state
      set((state) => ({
        sessions: state.sessions.map((s) =>
          s.id === sessionId ? { ...s, status: 'IN_PROGRESS' as const } : s
        ),
        todaysSessions: state.todaysSessions.map((s) =>
          s.id === sessionId ? { ...s, status: 'IN_PROGRESS' as const } : s
        ),
        isLoading: false,
      }));
      return null;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to start session';
      set({
        error: message,
        isLoading: false,
      });
      return message;
    }
  },

  // Complete session
  completeSession: async (sessionId: string, summary?: string) => {
    set({ isLoading: true, error: null });
    try {
      await sessionsApi.completeSession(sessionId, summary);
      
      // Update local state
      set((state) => ({
        sessions: state.sessions.map((s) =>
          s.id === sessionId
            ? { ...s, status: 'COMPLETED' as const, summary_text: summary || s.summary_text }
            : s
        ),
        todaysSessions: state.todaysSessions.map((s) =>
          s.id === sessionId
            ? { ...s, status: 'COMPLETED' as const, summary_text: summary || s.summary_text }
            : s
        ),
        isLoading: false,
      }));
      return null;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to complete session';
      set({
        error: message,
        isLoading: false,
      });
      return message;
    }
  },

  // Skip session
  skipSession: async (sessionId: string, reason?: string) => {
    set({ isLoading: true, error: null });
    try {
      await sessionsApi.skipSession(sessionId, reason);
      
      // Update local state
      set((state) => ({
        sessions: state.sessions.map((s) =>
          s.id === sessionId
            ? { ...s, status: 'SKIPPED' as const, skip_reason: reason || s.skip_reason }
            : s
        ),
        todaysSessions: state.todaysSessions.map((s) =>
          s.id === sessionId
            ? { ...s, status: 'SKIPPED' as const, skip_reason: reason || s.skip_reason }
            : s
        ),
        isLoading: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to skip session',
        isLoading: false,
      });
    }
  },

  // Delete session
  deleteSession: async (sessionId: string) => {
    set({ isLoading: true, error: null });
    try {
      await sessionsApi.deleteSession(sessionId);
      
      // Remove from local state
      set((state) => ({
        sessions: state.sessions.filter((s) => s.id !== sessionId),
        todaysSessions: state.todaysSessions.filter((s) => s.id !== sessionId),
        isLoading: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to delete session',
        isLoading: false,
      });
    }
  },

  // Clear error
  clearError: () => set({ error: null }),
}));
