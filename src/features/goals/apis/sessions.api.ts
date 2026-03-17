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
  if (request.session_effort !== undefined && request.session_effort <= 0) {
    throw new Error('Session planned effort must be greater than 0');
  }
  if (request.completed_effort !== undefined && request.completed_effort < 0) {
    throw new Error('Completed effort cannot be negative');
  }
  const { data: goal } = await goalsRepo.fetchGoalById(request.goal_id);
  if (!goal) {
    throw new Error('Goal not found');
  }
  if (!isGoalStartedForExecution(goal.status) && Number(request.completed_effort ?? 0) > 0) {
    throw new Error(
      'Goal is not started. Please start the goal before updating completed effort.'
    );
  }

  await validatePlannedEffortForCreate(request.goal_id, request.session_effort ?? 1);

  const { data, error } = await sessionsRepo.createSession(request);
  
  if (error) {
    throw new Error(error.message);
  }

  // Update goal's total_sessions count
  const stats = await sessionsRepo.getGoalSessionStats(request.goal_id);
  await goalsRepo.updateGoalSessionCounts(request.goal_id, stats.total, stats.completed);
  await syncGoalCompletedEffort(request.goal_id);
  if (Number(data?.completed_effort || 0) > 0) {
    await goalsRepo.applyGoalEffortStreak(request.goal_id);
  }

  return data;
};

const isGoalStartedForExecution = (status: string) => {
  const allowedStatuses = new Set(['IN_PROGRESS']);
  return allowedStatuses.has(status);
};

/**
 * Update session (status, summary, etc.)
 */
export const updateSession = async (sessionId: string, request: UpdateSessionRequest) => {
  if (request.session_effort !== undefined && request.session_effort <= 0) {
    throw new Error('Session planned effort must be greater than 0');
  }
  if (request.completed_effort !== undefined && request.completed_effort < 0) {
    throw new Error('Completed effort cannot be negative');
  }

  const { data: session, error: fetchError } = await sessionsRepo.fetchSessionById(sessionId);
  
  if (fetchError || !session) {
    throw new Error('Session not found');
  }
  const { data: goal } = await goalsRepo.fetchGoalById(session.goal_id);
  if (!goal) {
    throw new Error('Goal not found');
  }

  const attemptsProgressUpdate =
    request.status !== undefined || request.completed_effort !== undefined;
  if (attemptsProgressUpdate && !isGoalStartedForExecution(goal.status)) {
    throw new Error(
      'Goal is not started. Please start the goal before updating session status or completed effort.'
    );
  }

  const nextStatus = request.status ?? session.status;
  if (nextStatus === 'COMPLETED') {
    const nextCompletedEffort = Number(request.completed_effort ?? session.completed_effort ?? 0);
    const plannedEffort = Number(session.session_effort || 0);
    validateCompletionEffort(nextCompletedEffort, plannedEffort);
  }

  await validatePlannedEffortForUpdate(session.goal_id, session, request);
  await validateCompletedEffortForUpdate(session.goal_id, session, request);
  const previousCompletedEffort = Number(session.completed_effort || 0);
  const nextCompletedEffort =
    request.completed_effort !== undefined
      ? Number(request.completed_effort)
      : previousCompletedEffort;

  const previousStatus = session.status;
  const { data, error } = await sessionsRepo.updateSession(sessionId, request);
  
  if (error) {
    throw new Error(error.message);
  }

  // If status or effort fields changed, update goal stats and goal effort progress
  if (
    (request.status && request.status !== previousStatus) ||
    request.session_effort !== undefined ||
    request.completed_effort !== undefined
  ) {
    const stats = await sessionsRepo.getGoalSessionStats(session.goal_id);
    await goalsRepo.updateGoalSessionCounts(session.goal_id, stats.total, stats.completed);
    await syncGoalCompletedEffort(session.goal_id);
  }
  if (nextCompletedEffort > previousCompletedEffort) {
    await goalsRepo.applyGoalEffortStreak(session.goal_id);
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
  const session = await getSessionById(sessionId);
  const currentCompletedEffort = Number(session.completed_effort || 0);
  const plannedEffort = Number(session.session_effort || 0);
  validateCompletionEffort(currentCompletedEffort, plannedEffort);

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
  await syncGoalCompletedEffort(session.goal_id);

  return true;
};

/**
 * Get session stats for a goal
 */
export const getSessionStats = async (goalId: string) => {
  return sessionsRepo.getGoalSessionStats(goalId);
};

const syncGoalCompletedEffort = async (goalId: string) => {
  const completedEffort = await sessionsRepo.getGoalCompletedEffort(goalId);
  const { data: goal } = await goalsRepo.fetchGoalById(goalId);
  if (!goal) {
    throw new Error('Goal not found');
  }
  const totalEffort = Number(goal.effort ?? 0);

  if (totalEffort > 0 && completedEffort > totalEffort) {
    throw new Error('Completed effort cannot exceed total effort');
  }

  await goalsRepo.updateGoal(goalId, {
    completed_effort: completedEffort,
  });
};

const validateCompletedEffortForUpdate = async (
  goalId: string,
  currentSession: Awaited<ReturnType<typeof sessionsRepo.fetchSessionById>>['data'],
  request: UpdateSessionRequest
) => {
  const { data: goal } = await goalsRepo.fetchGoalById(goalId);
  const totalEffort = Number(goal?.effort ?? 0);
  if (!goal || totalEffort <= 0) {
    return;
  }

  const currentTotalCompletedEffort = await sessionsRepo.getGoalCompletedEffort(goalId);
  const currentSessionCompletedEffort = Number(currentSession?.completed_effort || 0);
  const nextSessionCompletedEffort = Number(request.completed_effort ?? currentSessionCompletedEffort);
  const currentStatus = currentSession?.status;
  const nextStatus = request.status ?? currentStatus;
  const currentIncluded = currentStatus === 'COMPLETED' ? currentSessionCompletedEffort : 0;
  const nextIncluded = nextStatus === 'COMPLETED' ? nextSessionCompletedEffort : 0;

  const projectedCompletedEffort = Number(
    (currentTotalCompletedEffort - currentIncluded + nextIncluded).toFixed(2)
  );
  if (projectedCompletedEffort > totalEffort) {
    throw new Error('Completed effort cannot exceed total effort');
  }
};

const validateCompletionEffort = (completedEffort: number, plannedEffort: number) => {
  if (!Number.isFinite(completedEffort) || completedEffort <= 0) {
    throw new Error(
      'Please enter the effort completed for this session before marking it as completed.'
    );
  }

  if (!Number.isFinite(plannedEffort) || plannedEffort <= 0) {
    throw new Error('Session planned effort is invalid.');
  }

  // Completion requires full planned effort to be finished.
  const normalizedCompleted = Number(completedEffort.toFixed(2));
  const normalizedPlanned = Number(plannedEffort.toFixed(2));
  if (normalizedCompleted !== normalizedPlanned) {
    throw new Error(
      'Completed effort must be exactly equal to the planned effort for this session before marking it as completed.'
    );
  }
};

const validatePlannedEffortForCreate = async (
  goalId: string,
  newSessionEffort: number
) => {
  const { data: goal } = await goalsRepo.fetchGoalById(goalId);
  const totalEffort = Number(goal?.effort ?? 0);
  if (!goal || totalEffort <= 0) {
    return;
  }

  const currentPlannedEffort = await sessionsRepo.getGoalPlannedEffort(goalId);
  const projected = Number((currentPlannedEffort + newSessionEffort).toFixed(2));
  if (projected > totalEffort) {
    throw new Error(
      `Total session effort (${projected}) cannot exceed goal effort (${totalEffort})`
    );
  }
};

const validatePlannedEffortForUpdate = async (
  goalId: string,
  currentSession: Awaited<ReturnType<typeof sessionsRepo.fetchSessionById>>['data'],
  request: UpdateSessionRequest
) => {
  const { data: goal } = await goalsRepo.fetchGoalById(goalId);
  const totalEffort = Number(goal?.effort ?? 0);
  if (!goal || totalEffort <= 0) {
    return;
  }

  if (request.session_effort === undefined) {
    return;
  }

  const currentPlannedEffort = await sessionsRepo.getGoalPlannedEffort(goalId);
  const currentEffort = Number(currentSession?.session_effort || 0);
  const nextEffort = Number(request.session_effort);

  const projected = Number((currentPlannedEffort - currentEffort + nextEffort).toFixed(2));
  if (projected > totalEffort) {
    throw new Error(
      `Total session effort (${projected}) cannot exceed goal effort (${totalEffort})`
    );
  }
};
