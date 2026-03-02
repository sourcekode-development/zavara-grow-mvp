// ============================================================================
// MILESTONES REPOSITORY - Supabase Queries Only
// ============================================================================

import { supabase } from '@/shared/config/supabase';
import type {
  Milestone,
  MilestoneStatus,
  CreateMilestoneRequest,
  UpdateMilestoneRequest,
} from '../types';

/**
 * Fetch milestones for a goal
 */
export const fetchMilestonesByGoalId = async (goalId: string) => {
  return supabase
    .from('milestones')
    .select('*')
    .eq('goal_id', goalId)
    .order('order_index', { ascending: true });
};

/**
 * Fetch milestone with sessions
 */
export const fetchMilestoneWithSessions = async (milestoneId: string) => {
  return supabase
    .from('milestones')
    .select(`
      *,
      sessions:cadence_sessions(*)
    `)
    .eq('id', milestoneId)
    .single();
};

/**
 * Create a new milestone
 */
export const createMilestone = async (data: CreateMilestoneRequest) => {
  return supabase
    .from('milestones')
    .insert({
      goal_id: data.goal_id,
      title: data.title,
      description: data.description || null,
      order_index: data.order_index,
      duration_days: data.duration_days || null,
      estimated_sessions: null,
      status: 'PENDING',
    })
    .select()
    .single();
};

/**
 * Update a milestone
 */
export const updateMilestone = async (milestoneId: string, data: UpdateMilestoneRequest) => {
  return supabase
    .from('milestones')
    .update({
      ...data,
      updated_at: new Date().toISOString(),
    })
    .eq('id', milestoneId)
    .select()
    .single();
};

/**
 * Update milestone status
 */
export const updateMilestoneStatus = async (
  milestoneId: string,
  status: MilestoneStatus,
  additionalData?: Partial<Milestone>
) => {
  return supabase
    .from('milestones')
    .update({
      status,
      ...additionalData,
      updated_at: new Date().toISOString(),
    })
    .eq('id', milestoneId)
    .select()
    .single();
};

/**
 * Reorder milestones
 */
export const reorderMilestones = async (updates: { id: string; order_index: number }[]) => {
  const promises = updates.map((update) =>
    supabase
      .from('milestones')
      .update({
        order_index: update.order_index,
        updated_at: new Date().toISOString(),
      })
      .eq('id', update.id)
  );

  return Promise.all(promises);
};

/**
 * Delete a milestone
 */
export const deleteMilestone = async (milestoneId: string) => {
  return supabase
    .from('milestones')
    .delete()
    .eq('id', milestoneId);
};
