// ============================================================================
// GOALS HOOKS - React Custom Hooks
// ============================================================================

import { useEffect } from 'react';
import { useGoalsStore } from '../store/goals.store';
import type { GoalsQueryFilters } from '../types';

/**
 * Hook to fetch and manage goals list
 */
export const useGoals = (filters?: GoalsQueryFilters) => {
  const {
    goals,
    isLoading,
    error,
    fetchGoals,
    setFilters,
    clearError,
  } = useGoalsStore();

  useEffect(() => {
    if (filters) {
      setFilters(filters);
    }
    fetchGoals(filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters?.user_id, filters?.status, filters?.is_public]);

  return {
    goals,
    isLoading,
    error,
    refetch: () => fetchGoals(filters),
    clearError,
  };
};

/**
 * Hook to manage a single goal
 */
export const useGoal = (goalId?: string) => {
  const {
    currentGoal,
    isLoading,
    error,
    fetchGoalById,
    setCurrentGoal,
    clearError,
  } = useGoalsStore();

  useEffect(() => {
    if (goalId) {
      fetchGoalById(goalId);
    }
    
    return () => {
      setCurrentGoal(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [goalId]);

  return {
    goal: currentGoal,
    isLoading,
    error,
    refetch: () => goalId && fetchGoalById(goalId),
    clearError,
  };
};

/**
 * Hook for goal mutations (create, update, delete)
 */
export const useGoalMutations = () => {
  const { createGoal, updateGoal, deleteGoal, isLoading, error, clearError } = useGoalsStore();

  return {
    createGoal,
    updateGoal,
    deleteGoal,
    isLoading,
    error,
    clearError,
  };
};
