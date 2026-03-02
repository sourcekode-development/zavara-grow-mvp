// ============================================================================
// CHECKPOINTS REPOSITORY - Supabase Queries Only
// ============================================================================

import { supabase } from '@/shared/config/supabase';
import type {
  Checkpoint,
  CheckpointStatus,
  CheckpointsQueryFilters,
  CreateCheckpointRequest,
} from '../types';

/**
 * Fetch checkpoints with filters
 */
export const fetchCheckpoints = async (filters?: CheckpointsQueryFilters) => {
  let query = supabase
    .from('checkpoints')
    .select(`
      *,
      assessment:assessments(*),
      reviewer:user_profiles!checkpoints_assigned_reviewer_id_fkey(id, full_name),
      goal:goals(id, title),
      milestone:milestones(id, title)
    `);

  if (filters?.goal_id) {
    query = query.eq('goal_id', filters.goal_id);
  }

  if (filters?.status) {
    if (Array.isArray(filters.status)) {
      query = query.in('status', filters.status);
    } else {
      query = query.eq('status', filters.status);
    }
  }

  if (filters?.assigned_reviewer_id) {
    query = query.eq('assigned_reviewer_id', filters.assigned_reviewer_id);
  }

  if (filters?.type) {
    query = query.eq('type', filters.type);
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
 * Fetch checkpoint by ID with assessment
 */
export const fetchCheckpointById = async (checkpointId: string) => {
  return supabase
    .from('checkpoints')
    .select(`
      *,
      assessment:assessments(*),
      reviewer:user_profiles!checkpoints_assigned_reviewer_id_fkey(id, full_name),
      goal:goals(id, title, user_id)
    `)
    .eq('id', checkpointId)
    .single();
};

/**
 * Create a new checkpoint
 */
export const createCheckpoint = async (data: CreateCheckpointRequest) => {
  return supabase
    .from('checkpoints')
    .insert({
      goal_id: data.goal_id,
      milestone_id: data.milestone_id || null,
      title: data.title,
      description: data.description || null,
      trigger_type: data.trigger_type || null,
      trigger_config: data.trigger_config || null,
      scheduled_date: data.scheduled_date || null,
      type: data.type,
      status: 'PENDING',
      assigned_reviewer_id: data.assigned_reviewer_id || null,
    })
    .select()
    .single();
};

/**
 * Update checkpoint status
 */
export const updateCheckpointStatus = async (
  checkpointId: string,
  status: CheckpointStatus,
  additionalData?: Partial<Checkpoint>
) => {
  const updateData: Partial<Checkpoint> = {
    status,
    ...additionalData,
    updated_at: new Date().toISOString(),
  };

  if (status === 'REVIEW_IN_PROGRESS' && !updateData.review_started_at) {
    updateData.review_started_at = new Date().toISOString();
  }

  return supabase
    .from('checkpoints')
    .update(updateData)
    .eq('id', checkpointId)
    .select()
    .single();
};

/**
 * Assign reviewer to checkpoint
 */
export const assignReviewer = async (checkpointId: string, reviewerId: string) => {
  return supabase
    .from('checkpoints')
    .update({
      assigned_reviewer_id: reviewerId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', checkpointId)
    .select()
    .single();
};

/**
 * Delete a checkpoint
 */
export const deleteCheckpoint = async (checkpointId: string) => {
  return supabase
    .from('checkpoints')
    .delete()
    .eq('id', checkpointId);
};

/**
 * Bulk update checkpoint status by goal_id
 */
export const updateCheckpointStatusByGoalId = async (
  goalId: string,
  status: CheckpointStatus
) => {
  return supabase
    .from('checkpoints')
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq('goal_id', goalId)
    .select();
};
