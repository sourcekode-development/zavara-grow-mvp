// ============================================================================
// GOAL ACTIONS HOOK - Handle goal lifecycle actions
// ============================================================================

import { useState } from 'react';
import { useNavigate } from 'react-router';
import * as goalsApi from '../apis/goals.api';
import type { SubmitGoalReviewRequest, GoalReviewAction } from '../types';

export const useGoalActions = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitForReview = async (goalId: string, reviewerId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await goalsApi.submitGoalForReview(goalId, reviewerId);
      setError(null);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit goal';
      console.error('❌ useGoalActions: Submit error:', errorMessage);
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const reviewGoal = async (
    goalId: string,
    reviewerId: string,
    action: GoalReviewAction,
    comments?: string
  ) => {
    setIsLoading(true);
    setError(null);
    try {
      const request: SubmitGoalReviewRequest = {
        goal_id: goalId,
        action,
        comments,
      };
      await goalsApi.reviewGoal(goalId, reviewerId, request);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to review goal');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const startGoal = async (goalId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await goalsApi.startGoal(goalId);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start goal');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const completeGoal = async (goalId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await goalsApi.completeGoal(goalId);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete goal');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const abandonGoal = async (goalId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await goalsApi.abandonGoal(goalId);
      navigate('/goals');
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete goal');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = () => setError(null);

  return {
    submitForReview,
    reviewGoal,
    startGoal,
    completeGoal,
    abandonGoal,
    isLoading,
    error,
    clearError,
  };
};
