// ============================================================================
// GOAL REVIEWS REPOSITORY - Supabase Queries Only
// ============================================================================

import { supabase } from '@/shared/config/supabase';
import type {
  GoalStatus,
  SubmitGoalReviewRequest,
} from '../types';

/**
 * Fetch reviews for a goal
 */
export const fetchGoalReviews = async (goalId: string) => {
  return supabase
    .from('goal_reviews')
    .select(`
      *,
      reviewer:user_profiles!goal_reviews_reviewer_id_fkey(id, full_name)
    `)
    .eq('goal_id', goalId)
    .order('created_at', { ascending: false });
};

/**
 * Create a goal review entry
 */
export const createGoalReview = async (
  reviewerId: string,
  data: SubmitGoalReviewRequest,
  previousStatus: GoalStatus,
  newStatus: GoalStatus
) => {
  return supabase
    .from('goal_reviews')
    .insert({
      goal_id: data.goal_id,
      reviewer_id: reviewerId,
      action: data.action,
      comments: data.comments || null,
      changes_made: data.changes_made ? JSON.stringify(data.changes_made) : null,
      previous_status: previousStatus,
      new_status: newStatus,
    })
    .select()
    .single();
};

/**
 * Fetch reviews by reviewer
 */
export const fetchReviewsByReviewer = async (reviewerId: string, limit?: number) => {
  let query = supabase
    .from('goal_reviews')
    .select(`
      *,
      goal:goals(
        id,
        title,
        user_id,
        assignee:user_profiles!goals_user_id_fkey(id, full_name)
      )
    `)
    .eq('reviewer_id', reviewerId)
    .order('created_at', { ascending: false });

  if (limit) {
    query = query.limit(limit);
  }

  return query;
};
