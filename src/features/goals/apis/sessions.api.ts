// ============================================================================
// SESSIONS API - Business Logic Layer
// ============================================================================

import type {
  SessionsQueryFilters,
  CreateSessionRequest,
  UpdateSessionRequest,
} from '../types';
import * as sessionsRepo from '../repository/sessions.repository';
import * as goalsRepo from '../repository/goals.repository';

/**
 * Get sessions with filters
 */
export const getSessions = async (filters?: SessionsQueryFilters) => {
  const { data, error } = await sessionsRepo.fetchSessions(filters);
  
  if (error) {
    throw new Error(error.message);
  }

  return data || [];
};

/**
 * Get today's sessions for a user
 */
export const getTodaysSessions = async (userId: string) => {
  const { data, error } = await sessionsRepo.fetchTodaysSessions(userId);
  
  if (error) {
    throw new Error(error.message);
  }

  return data || [];
};

/**
 * Get session by ID
 */
export const getSessionById = async (sessionId: string) => {
  const { data, error } = await sessionsRepo.fetchSessionById(sessionId);
  
  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error('Session not found');
  }

  return data;
};

/**
 * Create a new session
 */
export const createSession = async (request: CreateSessionRequest) => {
  const { data, error } = await sessionsRepo.createSession(request);
  
  if (error) {
    throw new Error(error.message);
  }

  // Update goal's total_sessions count
  const stats = await sessionsRepo.getGoalSessionStats(request.goal_id);
  await goalsRepo.updateGoalSessionCounts(request.goal_id, stats.total, stats.completed);

  return data;
};

/**
 * Update session (status, summary, etc.)
 */
export const updateSession = async (sessionId: string, request: UpdateSessionRequest) => {
  const { data: session, error: fetchError } = await sessionsRepo.fetchSessionById(sessionId);
  
  if (fetchError || !session) {
    throw new Error('Session not found');
  }

  const previousStatus = session.status;
  const { data, error } = await sessionsRepo.updateSession(sessionId, request);
  
  if (error) {
    throw new Error(error.message);
  }

  // If status changed, update goal stats
  if (request.status && request.status !== previousStatus) {
    const stats = await sessionsRepo.getGoalSessionStats(session.goal_id);
    await goalsRepo.updateGoalSessionCounts(session.goal_id, stats.total, stats.completed);

    // If status changed to COMPLETED, update streak
    if (request.status === 'COMPLETED') {
      await updateGoalStreak(session.goal_id);
    }
  }

  return data;
};

/**
 * Start a session (TO_DO → IN_PROGRESS)
 */
export const startSession = async (sessionId: string) => {
  return updateSession(sessionId, { status: 'IN_PROGRESS' });
};

/**
 * Complete a session (IN_PROGRESS → COMPLETED)
 */
export const completeSession = async (sessionId: string, summaryText?: string) => {
  return updateSession(sessionId, {
    status: 'COMPLETED',
    summary_text: summaryText,
  });
};

/**
 * Skip a session
 */
export const skipSession = async (sessionId: string, reason?: string) => {
  return updateSession(sessionId, {
    status: 'SKIPPED',
    skip_reason: reason,
  });
};

/**
 * Delete a session
 */
export const deleteSession = async (sessionId: string) => {
  const { data: session } = await sessionsRepo.fetchSessionById(sessionId);
  
  if (!session) {
    throw new Error('Session not found');
  }

  // Can only delete if not completed
  if (session.status === 'COMPLETED') {
    throw new Error('Cannot delete completed sessions');
  }

  const { error } = await sessionsRepo.deleteSession(sessionId);
  
  if (error) {
    throw new Error(error.message);
  }

  // Update goal's total_sessions count
  const stats = await sessionsRepo.getGoalSessionStats(session.goal_id);
  await goalsRepo.updateGoalSessionCounts(session.goal_id, stats.total, stats.completed);

  return true;
};

/**
 * Get session stats for a goal
 */
export const getSessionStats = async (goalId: string) => {
  return sessionsRepo.getGoalSessionStats(goalId);
};

/**
 * Update goal streak (called after session completion)
 */
const updateGoalStreak = async (goalId: string) => {
  // Get all completed sessions for this goal, ordered by scheduled_date descending
  const { data: sessions } = await sessionsRepo.fetchSessions({
    goal_id: goalId,
    status: 'COMPLETED',
  });

  if (!sessions || sessions.length === 0) {
    // No completed sessions, reset streak
    await goalsRepo.updateGoalStreak(goalId, 0, 0);
    return;
  }

  // Sort by scheduled_date descending (most recent first)
  const sortedSessions = sessions.sort((a, b) => 
    new Date(b.scheduled_date).getTime() - new Date(a.scheduled_date).getTime()
  );

  let currentStreak = 0;
  let previousDate: Date | null = null;

  // Calculate current consecutive streak
  for (const session of sortedSessions) {
    const sessionDate = new Date(session.scheduled_date);
    
    if (previousDate === null) {
      // First session in the loop (most recent completed session)
      currentStreak = 1;
      previousDate = sessionDate;
    } else {
      // Calculate days difference
      const daysDiff = Math.floor(
        (previousDate.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysDiff === 1) {
        // Consecutive day, continue streak
        currentStreak++;
        previousDate = sessionDate;
      } else if (daysDiff > 1) {
        // Gap found, streak breaks
        break;
      }
      // If daysDiff === 0 (same day), skip but don't break streak
    }
  }

  // Get current goal data to compare with longest_streak
  const { data: goal } = await goalsRepo.fetchGoalById(goalId);
  if (goal) {
    const longestStreak = Math.max(currentStreak, goal.longest_streak);
    await goalsRepo.updateGoalStreak(goalId, currentStreak, longestStreak);
  }
};
