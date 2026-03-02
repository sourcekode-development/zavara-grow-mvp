// ============================================================================
// GOALS API - Business Logic Layer
// ============================================================================
// This layer orchestrates repository calls and contains business logic.
// Components/hooks should ONLY call this layer, never repository directly.
// ============================================================================

import type {
  GoalWithDetails,
  GoalsQueryFilters,
  CreateGoalRequest,
  UpdateGoalRequest,
  GoalStatus,
  SubmitGoalReviewRequest,
  CheckpointStatus,
} from '../types';
import * as goalsRepo from '../repository/goals.repository';
import * as reviewsRepo from '../repository/reviews.repository';
import * as milestonesRepo from '../repository/milestones.repository';
import * as checkpointsApi from './checkpoints.api';

/**
 * Get all goals with filters
 */
export const getGoals = async (filters?: GoalsQueryFilters) => {
  const { data, error } = await goalsRepo.fetchGoals(filters);
  
  if (error) {
    throw new Error(error.message);
  }

  return data || [];
};

/**
 * Get a single goal by ID with all details
 */
export const getGoalById = async (goalId: string): Promise<GoalWithDetails> => {
  const { data, error } = await goalsRepo.fetchGoalById(goalId);
  
  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error('Goal not found');
  }

  return data;
};

/**
 * Create a new goal (always starts as DRAFT)
 */
export const createGoal = async (userId: string, request: CreateGoalRequest) => {
  const { data, error } = await goalsRepo.createGoal(userId, request);
  
  if (error) {
    throw new Error(error.message);
  }

  // If duplicating, increment the original goal's duplication count
  if (request.duplicated_from) {
    await goalsRepo.incrementDuplicationCount(request.duplicated_from);
  }

  return data;
};

/**
 * Update goal details
 */
export const updateGoal = async (goalId: string, request: UpdateGoalRequest) => {
  // Validate goal is in DRAFT status
  const { data: existingGoal } = await goalsRepo.fetchGoalById(goalId);
  if (!existingGoal) {
    throw new Error('Goal not found');
  }

  if (existingGoal.status !== 'DRAFT' && existingGoal.status !== 'CHANGES_REQUESTED') {
    throw new Error('Can only update goals in DRAFT or CHANGES_REQUESTED status');
  }

  const { data, error } = await goalsRepo.updateGoal(goalId, request);
  
  if (error) {
    throw new Error(error.message);
  }

  return data;
};

/**
 * Submit goal for review (DRAFT → PENDING_REVIEW)
 */
export const submitGoalForReview = async (goalId: string, reviewerId: string) => {
  console.log('🔍 API: Submit goal for review', { goalId, reviewerId });
  
  const { data: goal } = await goalsRepo.fetchGoalById(goalId);
  
  if (!goal) {
    console.error('❌ Goal not found:', goalId);
    throw new Error('Goal not found');
  }

  console.log('📋 Current goal status:', goal.status);

  if (goal.status !== 'DRAFT' && goal.status !== 'CHANGES_REQUESTED') {
    throw new Error('Can only submit goals in DRAFT or CHANGES_REQUESTED status');
  }

  // Validate goal has required fields
  if (!goal.title) {
    throw new Error('Goal must have a title');
  }

  // Validate has milestones
  const { data: milestones } = await milestonesRepo.fetchMilestonesByGoalId(goalId);
  console.log('📝 Goal milestones:', milestones?.length || 0);
  
  if (!milestones || milestones.length === 0) {
    const error = new Error('Goal must have at least one milestone before submitting for review');
    console.error('❌ Validation failed:', error.message);
    throw error;
  }

  console.log('🔄 Updating goal status to PENDING_REVIEW with reviewer:', reviewerId);
  
  const { data, error } = await goalsRepo.updateGoalStatus(goalId, 'PENDING_REVIEW', {
    reviewed_by: reviewerId,
  });
  
  if (error) {
    console.error('❌ Update failed:', error);
    throw new Error(error.message);
  }

  console.log('✅ Goal submitted successfully:', data);
  return data;
};

/**
 * Review a goal (PENDING_REVIEW → APPROVED/CHANGES_REQUESTED/REJECTED)
 */
export const reviewGoal = async (
  goalId: string,
  reviewerId: string,
  request: SubmitGoalReviewRequest
) => {
  const { data: goal } = await goalsRepo.fetchGoalById(goalId);
  
  if (!goal) {
    throw new Error('Goal not found');
  }

  // if (goal.status !== 'PENDING_REVIEW') {
  //   throw new Error('Can only review goals in PENDING_REVIEW status');
  // }

  const previousStatus = goal.status;
  let newStatus: GoalStatus;

  switch (request.action) {
    case 'APPROVED':
      newStatus = 'APPROVED';
      break;
    case 'REQUESTED_CHANGES':
      newStatus = 'CHANGES_REQUESTED';
      break;
    case 'REJECTED':
      newStatus = 'ABANDONED';
      break;
    case 'MODIFIED':
      newStatus = 'APPROVED';
      break;
    default:
      throw new Error('Invalid review action');
  }

  // Update goal status
  const { data: updatedGoal, error: updateError } = await goalsRepo.updateGoalStatus(
    goalId,
    newStatus,
    {
      reviewed_by: reviewerId,
      reviewed_at: new Date().toISOString(),
      review_comments: request.comments || null,
    }
  );

  if (updateError) {
    throw new Error(updateError.message);
  }

  // Log review in audit table
  await reviewsRepo.createGoalReview(reviewerId, request, previousStatus, newStatus);

  // Update checkpoint statuses based on goal review decision
  if (newStatus === 'ABANDONED') {
    // If goal is rejected, skip all checkpoints
    await checkpointsApi.updateCheckpointStatusByGoalId(goalId, 'SKIPPED' as CheckpointStatus);
  }
  // Note: For APPROVED and CHANGES_REQUESTED, checkpoints remain PENDING
  // Developers will mark them as READY_FOR_REVIEW when they're ready

  return updatedGoal;
};

/**
 * Start a goal (APPROVED → IN_PROGRESS)
 */
export const startGoal = async (goalId: string) => {
  const { data: goal } = await goalsRepo.fetchGoalById(goalId);
  
  if (!goal) {
    throw new Error('Goal not found');
  }

  if (goal.status !== 'APPROVED') {
    throw new Error('Can only start goals in APPROVED status');
  }

  const { data, error } = await goalsRepo.updateGoalStatus(goalId, 'IN_PROGRESS', {
    start_date: new Date().toISOString(),
  });
  
  if (error) {
    throw new Error(error.message);
  }

  // TODO: Trigger auto-generation of cadence sessions if not manually created

  return data;
};

/**
 * Complete a goal (IN_PROGRESS → COMPLETED)
 */
export const completeGoal = async (goalId: string) => {
  const { data: goal } = await goalsRepo.fetchGoalById(goalId);
  
  if (!goal) {
    throw new Error('Goal not found');
  }

  if (goal.status !== 'IN_PROGRESS') {
    throw new Error('Can only complete goals in IN_PROGRESS status');
  }

  const { data, error } = await goalsRepo.updateGoalStatus(goalId, 'COMPLETED', {
    actual_end_date: new Date().toISOString(),
  });
  
  if (error) {
    throw new Error(error.message);
  }

  return data;
};

/**
 * Abandon a goal
 */
export const abandonGoal = async (goalId: string) => {
  const { data, error } = await goalsRepo.deleteGoal(goalId);
  
  if (error) {
    throw new Error(error.message);
  }

  return data;
};

/**
 * Get goal reviews (audit trail)
 */
export const getGoalReviews = async (goalId: string) => {
  const { data, error } = await reviewsRepo.fetchGoalReviews(goalId);
  
  if (error) {
    throw new Error(error.message);
  }

  return data || [];
};

/**
 * Get public goals library (for duplication)
 */
export const getGoalsLibrary = async (filters?: GoalsQueryFilters) => {
  return getGoals({
    ...filters,
    is_public: true,
    status: 'COMPLETED',
  });
};
