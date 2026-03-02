// ============================================================================
// MILESTONES API - Business Logic Layer
// ============================================================================

import type {
  CreateMilestoneRequest,
  UpdateMilestoneRequest,
} from '../types';
import * as milestonesRepo from '../repository/milestones.repository';
import * as goalsRepo from '../repository/goals.repository';

/**
 * Get milestones for a goal
 */
export const getMilestonesByGoalId = async (goalId: string) => {
  const { data, error } = await milestonesRepo.fetchMilestonesByGoalId(goalId);
  
  if (error) {
    throw new Error(error.message);
  }

  return data || [];
};

/**
 * Get milestone with sessions
 */
export const getMilestoneWithSessions = async (milestoneId: string) => {
  const { data, error } = await milestonesRepo.fetchMilestoneWithSessions(milestoneId);
  
  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error('Milestone not found');
  }

  return data;
};

/**
 * Create a new milestone
 */
export const createMilestone = async (request: CreateMilestoneRequest) => {
  // Validate goal is in editable state
  const { data: goal } = await goalsRepo.fetchGoalById(request.goal_id);
  
  if (!goal) {
    throw new Error('Goal not found');
  }

  if (goal.status !== 'DRAFT' && goal.status !== 'CHANGES_REQUESTED') {
    throw new Error('Can only add milestones to goals in DRAFT or CHANGES_REQUESTED status');
  }

  const { data, error } = await milestonesRepo.createMilestone(request);
  
  if (error) {
    throw new Error(error.message);
  }

  return data;
};

/**
 * Update a milestone
 */
export const updateMilestone = async (milestoneId: string, request: UpdateMilestoneRequest) => {
  const { data: milestone } = await milestonesRepo.fetchMilestoneWithSessions(milestoneId);
  
  if (!milestone) {
    throw new Error('Milestone not found');
  }

  // Check goal status
  const { data: goal } = await goalsRepo.fetchGoalById(milestone.goal_id);
  if (goal && goal.status !== 'DRAFT' && goal.status !== 'CHANGES_REQUESTED') {
    throw new Error('Can only update milestones when goal is in DRAFT or CHANGES_REQUESTED status');
  }

  const { data, error } = await milestonesRepo.updateMilestone(milestoneId, request);
  
  if (error) {
    throw new Error(error.message);
  }

  return data;
};

/**
 * Reorder milestones
 */
export const reorderMilestones = async (updates: { id: string; order_index: number }[]) => {
  const results = await milestonesRepo.reorderMilestones(updates);
  
  const errors = results.filter(r => r.error);
  if (errors.length > 0) {
    throw new Error('Failed to reorder some milestones');
  }

  return true;
};

/**
 * Delete a milestone
 */
export const deleteMilestone = async (milestoneId: string) => {
  const { data: milestone } = await milestonesRepo.fetchMilestoneWithSessions(milestoneId);
  
  if (!milestone) {
    throw new Error('Milestone not found');
  }

  // Check goal status
  const { data: goal } = await goalsRepo.fetchGoalById(milestone.goal_id);
  if (goal && goal.status !== 'DRAFT' && goal.status !== 'CHANGES_REQUESTED') {
    throw new Error('Can only delete milestones when goal is in DRAFT or CHANGES_REQUESTED status');
  }

  // Check if milestone has sessions
  if (milestone.sessions && milestone.sessions.length > 0) {
    throw new Error('Cannot delete milestone with existing sessions');
  }

  const { error } = await milestonesRepo.deleteMilestone(milestoneId);
  
  if (error) {
    throw new Error(error.message);
  }

  return true;
};

/**
 * Start a milestone (when goal is IN_PROGRESS)
 */
export const startMilestone = async (milestoneId: string) => {
  const { data: milestone } = await milestonesRepo.fetchMilestoneWithSessions(milestoneId);
  
  if (!milestone) {
    throw new Error('Milestone not found');
  }

  if (milestone.status !== 'PENDING') {
    throw new Error('Can only start milestones in PENDING status');
  }

  const { data, error } = await milestonesRepo.updateMilestoneStatus(milestoneId, 'ACTIVE', {
    started_at: new Date().toISOString(),
  });
  
  if (error) {
    throw new Error(error.message);
  }

  return data;
};

/**
 * Complete a milestone
 */
export const completeMilestone = async (milestoneId: string) => {
  const { data: milestone } = await milestonesRepo.fetchMilestoneWithSessions(milestoneId);
  
  if (!milestone) {
    throw new Error('Milestone not found');
  }

  if (milestone.status !== 'ACTIVE') {
    throw new Error('Can only complete milestones in ACTIVE status');
  }

  const { data, error } = await milestonesRepo.updateMilestoneStatus(milestoneId, 'COMPLETED', {
    completed_at: new Date().toISOString(),
  });
  
  if (error) {
    throw new Error(error.message);
  }

  // TODO: Trigger AFTER_MILESTONE checkpoints

  return data;
};
