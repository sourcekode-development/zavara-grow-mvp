// ============================================================================
// SESSIONS HOOKS - React Custom Hooks
// ============================================================================

import { useEffect } from 'react';
import { useSessionsStore } from '../store/sessions.store';
import type { SessionsQueryFilters } from '../types';

/**
 * Hook to fetch and manage sessions
 */
export const useSessions = (filters?: SessionsQueryFilters) => {
  const { sessions, isLoading, error, fetchSessions, clearError } = useSessionsStore();

  useEffect(() => {
    fetchSessions(filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters?.goal_id, filters?.milestone_id, filters?.status]);

  return {
    sessions,
    isLoading,
    error,
    refetch: () => fetchSessions(filters),
    clearError,
  };
};

/**
 * Hook to fetch today's sessions for the current user
 */
export const useTodaysSessions = (userId?: string) => {
  const { todaysSessions, isLoading, error, fetchTodaysSessions, clearError } = useSessionsStore();

  useEffect(() => {
    if (userId) {
      fetchTodaysSessions(userId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  return {
    todaysSessions,
    isLoading,
    error,
    refetch: () => userId && fetchTodaysSessions(userId),
    clearError,
  };
};

/**
 * Hook for session mutations
 */
export const useSessionMutations = () => {
  const {
    createSession,
    updateSession,
    startSession,
    completeSession,
    skipSession,
    deleteSession,
    isLoading,
    error,
    clearError,
  } = useSessionsStore();

  return {
    createSession,
    updateSession,
    startSession,
    completeSession,
    skipSession,
    deleteSession,
    isLoading,
    error,
    clearError,
  };
};
