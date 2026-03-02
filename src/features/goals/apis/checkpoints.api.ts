// ============================================================================
// CHECKPOINTS & ASSESSMENTS API - Business Logic Layer
// ============================================================================

import type {
  CheckpointsQueryFilters,
  CreateCheckpointRequest,
  CreateAssessmentRequest,
  CheckpointStatus,
} from '../types';
import * as checkpointsRepo from '../repository/checkpoints.repository';
import * as assessmentsRepo from '../repository/assessments.repository';
import * as goalsRepo from '../repository/goals.repository';

/**
 * Get checkpoints with filters
 */
export const getCheckpoints = async (filters?: CheckpointsQueryFilters) => {
  const { data, error } = await checkpointsRepo.fetchCheckpoints(filters);
  
  if (error) {
    throw new Error(error.message);
  }

  return data || [];
};

/**
 * Get checkpoint by ID with assessment
 */
export const getCheckpointById = async (checkpointId: string) => {
  const { data, error } = await checkpointsRepo.fetchCheckpointById(checkpointId);
  
  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error('Checkpoint not found');
  }

  return data;
};

/**
 * Create a new checkpoint
 */
export const createCheckpoint = async (request: CreateCheckpointRequest) => {
  const { data: goal } = await goalsRepo.fetchGoalById(request.goal_id);
  
  if (!goal) {
    throw new Error('Goal not found');
  }

  const { data, error } = await checkpointsRepo.createCheckpoint(request);
  
  if (error) {
    throw new Error(error.message);
  }

  return data;
};

/**
 * Mark checkpoint as ready for review
 */
export const markCheckpointReady = async (checkpointId: string) => {
  const { data: checkpoint } = await checkpointsRepo.fetchCheckpointById(checkpointId);
  
  if (!checkpoint) {
    throw new Error('Checkpoint not found');
  }

  if (checkpoint.status !== 'PENDING') {
    throw new Error('Can only mark PENDING checkpoints as ready');
  }

  const { data, error } = await checkpointsRepo.updateCheckpointStatus(
    checkpointId,
    'READY_FOR_REVIEW'
  );
  
  if (error) {
    throw new Error(error.message);
  }

  return data;
};

/**
 * Start checkpoint review
 */
export const startCheckpointReview = async (checkpointId: string, reviewerId: string) => {
  const { data: checkpoint } = await checkpointsRepo.fetchCheckpointById(checkpointId);
  
  if (!checkpoint) {
    throw new Error('Checkpoint not found');
  }

  if (checkpoint.status !== 'READY_FOR_REVIEW') {
    throw new Error('Checkpoint must be ready for review');
  }

  // Assign reviewer if not already assigned
  if (!checkpoint.assigned_reviewer_id) {
    await checkpointsRepo.assignReviewer(checkpointId, reviewerId);
  }

  const { data, error } = await checkpointsRepo.updateCheckpointStatus(
    checkpointId,
    'REVIEW_IN_PROGRESS'
  );
  
  if (error) {
    throw new Error(error.message);
  }

  return data;
};

/**
 * Submit assessment for checkpoint
 */
export const submitAssessment = async (reviewerId: string, request: CreateAssessmentRequest) => {
  const { data: checkpoint } = await checkpointsRepo.fetchCheckpointById(request.checkpoint_id);
  
  if (!checkpoint) {
    throw new Error('Checkpoint not found');
  }

  if (checkpoint.status !== 'REVIEW_IN_PROGRESS' && checkpoint.status !== 'READY_FOR_REVIEW') {
    throw new Error('Checkpoint must be in review state');
  }

  // Create assessment
  const { data: assessment, error: assessmentError } = await assessmentsRepo.createAssessment(
    reviewerId,
    request
  );
  
  if (assessmentError) {
    throw new Error(assessmentError.message);
  }

  // Update checkpoint status based on pass/fail
  const newStatus = request.passed ? 'PASSED' : 'NEEDS_ATTENTION';
  await checkpointsRepo.updateCheckpointStatus(request.checkpoint_id, newStatus);

  return assessment;
};

/**
 * Get assessment by checkpoint ID
 */
export const getAssessment = async (checkpointId: string) => {
  const { data, error } = await assessmentsRepo.fetchAssessmentByCheckpointId(checkpointId);
  
  if (error) {
    // Assessment might not exist yet
    return null;
  }

  return data;
};

/**
 * Get assessments by reviewer
 */
export const getAssessmentsByReviewer = async (reviewerId: string, limit?: number) => {
  const { data, error } = await assessmentsRepo.fetchAssessmentsByReviewer(reviewerId, limit);
  
  if (error) {
    throw new Error(error.message);
  }

  return data || [];
};

/**
 * Assign checkpoint to reviewer
 */
export const assignCheckpointReviewer = async (checkpointId: string, reviewerId: string) => {
  const { data, error } = await checkpointsRepo.assignReviewer(checkpointId, reviewerId);
  
  if (error) {
    throw new Error(error.message);
  }

  return data;
};

/**
 * Skip checkpoint (manual skip)
 */
export const skipCheckpoint = async (checkpointId: string) => {
  const { data, error } = await checkpointsRepo.updateCheckpointStatus(checkpointId, 'SKIPPED');
  
  if (error) {
    throw new Error(error.message);
  }

  return data;
};

/**
 * Delete checkpoint
 */
export const deleteCheckpoint = async (checkpointId: string) => {
  const { data: checkpoint } = await checkpointsRepo.fetchCheckpointById(checkpointId);
  
  if (!checkpoint) {
    throw new Error('Checkpoint not found');
  }

  // Can only delete if not started
  if (checkpoint.status === 'REVIEW_IN_PROGRESS' || checkpoint.status === 'PASSED') {
    throw new Error('Cannot delete checkpoint that has been reviewed');
  }

  const { error } = await checkpointsRepo.deleteCheckpoint(checkpointId);
  
  if (error) {
    throw new Error(error.message);
  }

  return true;
};

/**
 * Bulk update checkpoint status by goal_id
 * Used when goal status changes (e.g., goal rejected → checkpoints skipped)
 */
export const updateCheckpointStatusByGoalId = async (
  goalId: string,
  status: CheckpointStatus
) => {
  const { data, error } = await checkpointsRepo.updateCheckpointStatusByGoalId(goalId, status);
  
  if (error) {
    throw new Error(error.message);
  }

  return data || [];
};
