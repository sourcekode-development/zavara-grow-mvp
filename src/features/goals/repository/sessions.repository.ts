// ============================================================================
// CADENCE SESSIONS REPOSITORY - Supabase Queries Only
// ============================================================================

import { supabase } from '@/shared/config/supabase';
import type {
  CadenceSession,
  SessionsQueryFilters,
  CreateSessionRequest,
  UpdateSessionRequest,
} from '../types';

/**
 * Fetch sessions with filters
 */
export const fetchSessions = async (filters?: SessionsQueryFilters) => {
  let query = supabase
    .from('cadence_sessions')
    .select('*');

  if (filters?.goal_id) {
    query = query.eq('goal_id', filters.goal_id);
  }

  if (filters?.milestone_id) {
    query = query.eq('milestone_id', filters.milestone_id);
  }

  if (filters?.status) {
    if (Array.isArray(filters.status)) {
      query = query.in('status', filters.status);
    } else {
      query = query.eq('status', filters.status);
    }
  }

  if (filters?.scheduled_date) {
    query = query.eq('scheduled_date', filters.scheduled_date);
  }

  if (filters?.scheduled_date_from) {
    query = query.gte('scheduled_date', filters.scheduled_date_from);
  }

  if (filters?.scheduled_date_to) {
    query = query.lte('scheduled_date', filters.scheduled_date_to);
  }

  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  if (filters?.offset) {
    query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
  }

  query = query.order('scheduled_date', { ascending: true });

  return query;
};

/**
 * Fetch today's sessions for a user's goals
 */
export const fetchTodaysSessions = async (userId: string) => {
  const today = new Date().toISOString().split('T')[0];
  
  return supabase
    .from('cadence_sessions')
    .select(`
      *,
      goal:goals!cadence_sessions_goal_id_fkey(id, title, user_id)
    `)
    .eq('scheduled_date', today)
    .eq('goals.user_id', userId)
    .in('status', ['TO_DO', 'IN_PROGRESS']);
};

/**
 * Fetch session by ID
 */
export const fetchSessionById = async (sessionId: string) => {
  return supabase
    .from('cadence_sessions')
    .select('*')
    .eq('id', sessionId)
    .single();
};

/**
 * Create a new session
 */
export const createSession = async (data: CreateSessionRequest) => {
  // Get the next session_index for this goal
  const { count } = await supabase
    .from('cadence_sessions')
    .select('*', { count: 'exact', head: true })
    .eq('goal_id', data.goal_id);

  return supabase
    .from('cadence_sessions')
    .insert({
      goal_id: data.goal_id,
      milestone_id: data.milestone_id || null,
      session_index: (count || 0) + 1,
      title: data.title || null,
      description: data.description || null,
      scheduled_date: data.scheduled_date || null,
      duration_minutes: data.duration_minutes || 60,
      status: 'TO_DO',
      is_auto_generated: false,
    })
    .select()
    .single();
};

/**
 * Bulk create sessions (for auto-generation)
 */
export const bulkCreateSessions = async (sessions: Omit<CadenceSession, 'id' | 'created_at' | 'updated_at'>[]) => {
  return supabase
    .from('cadence_sessions')
    .insert(sessions)
    .select();
};

/**
 * Update a session
 */
export const updateSession = async (sessionId: string, data: UpdateSessionRequest) => {
  const updateData: Partial<CadenceSession> = {
    ...data,
    updated_at: new Date().toISOString(),
  };

  // Set timestamps based on status
  if (data.status === 'IN_PROGRESS' && !updateData.started_at) {
    updateData.started_at = new Date().toISOString();
  }

  if (data.status === 'COMPLETED' && !updateData.completed_at) {
    updateData.completed_at = new Date().toISOString();
  }

  return supabase
    .from('cadence_sessions')
    .update(updateData)
    .eq('id', sessionId)
    .select()
    .single();
};

/**
 * Mark sessions as DUE or MISSED (cron job helper)
 */
export const updateOverdueSessions = async () => {
  const today = new Date().toISOString().split('T')[0];
  
  return supabase
    .from('cadence_sessions')
    .update({ status: 'MISSED', updated_at: new Date().toISOString() })
    .lt('scheduled_date', today)
    .in('status', ['TO_DO', 'DUE']);
};

/**
 * Delete a session
 */
export const deleteSession = async (sessionId: string) => {
  return supabase
    .from('cadence_sessions')
    .delete()
    .eq('id', sessionId);
};

/**
 * Get session stats for a goal
 */
export const getGoalSessionStats = async (goalId: string) => {
  const { data, error } = await supabase
    .from('cadence_sessions')
    .select('status')
    .eq('goal_id', goalId);

  if (error) return { total: 0, completed: 0, inProgress: 0, toDo: 0, missed: 0 };

  const stats = {
    total: data.length,
    completed: data.filter(s => s.status === 'COMPLETED').length,
    inProgress: data.filter(s => s.status === 'IN_PROGRESS').length,
    toDo: data.filter(s => s.status === 'TO_DO').length,
    missed: data.filter(s => s.status === 'MISSED').length,
  };

  return stats;
};
