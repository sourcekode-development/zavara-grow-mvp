// ============================================================================
// GOALS REPOSITORY - Supabase Queries Only
// ============================================================================
// This file contains ONLY direct database operations using Supabase client.
// NO business logic should exist here.
// ============================================================================

import { supabase } from '@/shared/config/supabase';
import type {
  Goal,
  GoalStatus,
  GoalsQueryFilters,
  CreateGoalRequest,
  UpdateGoalRequest,
} from '../types';

/**
 * Fetch goals with optional filters and joins
 */
export const fetchGoals = async (filters?: GoalsQueryFilters) => {
  let query = supabase
    .from('goals')
    .select(`
      *,
      creator:user_profiles!goals_created_by_fkey(id, full_name),
      assignee:user_profiles!goals_user_id_fkey(id, full_name),
      reviewer:user_profiles!goals_reviewed_by_fkey(id, full_name)
    `);

  if (filters?.user_id) {
    query = query.eq('user_id', filters.user_id);
  }

  if (filters?.created_by) {
    query = query.eq('created_by', filters.created_by);
  }

  if (filters?.status) {
    if (Array.isArray(filters.status)) {
      query = query.in('status', filters.status);
    } else {
      query = query.eq('status', filters.status);
    }
  }

  if (filters?.is_public !== undefined) {
    query = query.eq('is_public', filters.is_public);
  }

  if (filters?.search) {
    query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
  }

  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  if (filters?.offset) {
    query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
  }

  query = query.order('created_at', { ascending: false });

  return query;
};

/**
 * Fetch a single goal by ID with all related data
 */
export const fetchGoalById = async (goalId: string) => {
  return supabase
    .from('goals')
    .select(`
      *,
      creator:user_profiles!goals_created_by_fkey(id, full_name),
      assignee:user_profiles!goals_user_id_fkey(id, full_name),
      reviewer:user_profiles!goals_reviewed_by_fkey(id, full_name),
      milestones(*),
      checkpoints(*),
      active_sessions:cadence_sessions(*)
    `)
    .eq('id', goalId)
    .single();
};

/**
 * Create a new goal
 */
export const createGoal = async (userId: string, data: CreateGoalRequest) => {
  return supabase
    .from('goals')
    .insert({
      created_by: userId,
      user_id: userId,
      title: data.title,
      description: data.description || null,
      template_id: data.template_id || null,
      duplicated_from: data.duplicated_from || null,
      status: 'DRAFT',
      current_streak: 0,
      longest_streak: 0,
      total_sessions: 0,
      completed_sessions: 0,
      is_public: false,
      duplication_count: 0,
    })
    .select()
    .single();
};

/**
 * Update an existing goal
 */
export const updateGoal = async (goalId: string, data: UpdateGoalRequest) => {
  return supabase
    .from('goals')
    .update({
      ...data,
      updated_at: new Date().toISOString(),
    })
    .eq('id', goalId)
    .select()
    .single();
};

/**
 * Update goal status
 */
export const updateGoalStatus = async (goalId: string, status: GoalStatus, additionalData?: Partial<Goal>) => {
  return supabase
    .from('goals')
    .update({
      status,
      ...additionalData,
      updated_at: new Date().toISOString(),
    })
    .eq('id', goalId)
    .select()
    .single();
};

/**
 * Update goal streak data
 */
export const updateGoalStreak = async (
  goalId: string,
  currentStreak: number,
  longestStreak: number,
) => {
  return supabase
    .from('goals')
    .update({
      current_streak: currentStreak,
      longest_streak: longestStreak,
      updated_at: new Date().toISOString(),
    })
    .eq('id', goalId)
    .select()
    .single();
};

/**
 * Update goal session counts
 */
export const updateGoalSessionCounts = async (
  goalId: string,
  totalSessions: number,
  completedSessions: number,
) => {
  return supabase
    .from('goals')
    .update({
      total_sessions: totalSessions,
      completed_sessions: completedSessions,
      updated_at: new Date().toISOString(),
    })
    .eq('id', goalId)
    .select()
    .single();
};

/**
 * Increment goal duplication count
 */
export const incrementDuplicationCount = async (goalId: string) => {
  return supabase.rpc('increment_goal_duplication_count', { goal_id: goalId });
};

/**
 * Soft delete goal (set to ABANDONED)
 */
export const deleteGoal = async (goalId: string) => {
  return updateGoalStatus(goalId, 'ABANDONED');
};
