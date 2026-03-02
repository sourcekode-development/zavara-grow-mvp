// ============================================================================
// GOALS STORE - Zustand State Management
// ============================================================================

import { create } from 'zustand';
import type { Goal, GoalWithDetails, GoalsQueryFilters, UpdateGoalRequest, Checkpoint, CheckpointStatus } from '../types';
import * as goalsApi from '../apis/goals.api';
import * as checkpointsApi from '../apis/checkpoints.api';

interface GoalsState {
  // State
  goals: GoalWithDetails[];
  currentGoal: GoalWithDetails | null;
  checkpoints: Checkpoint[];
  isLoading: boolean;
  error: string | null;
  filters: GoalsQueryFilters;

  // Actions
  fetchGoals: (filters?: GoalsQueryFilters) => Promise<void>;
  fetchGoalById: (goalId: string) => Promise<void>;
  createGoal: (userId: string, data: { title: string; description?: string }) => Promise<Goal | null>;
  updateGoal: (goalId: string, data: Partial<Goal>) => Promise<void>;
  deleteGoal: (goalId: string) => Promise<void>;
  fetchCheckpoints: (filters?: { status?: string }) => Promise<void>;
  setFilters: (filters: GoalsQueryFilters) => void;
  clearError: () => void;
  setCurrentGoal: (goal: GoalWithDetails | null) => void;
}

export const useGoalsStore = create<GoalsState>((set, get) => ({
  // Initial State
  goals: [],
  currentGoal: null,
  checkpoints: [],
  isLoading: false,
  error: null,
  filters: {},

  // Fetch all goals with filters
  fetchGoals: async (filters?: GoalsQueryFilters) => {
    set({ isLoading: true, error: null });
    try {
      const goals = await goalsApi.getGoals(filters || get().filters);
      set({ goals, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch goals',
        isLoading: false,
      });
    }
  },

  // Fetch single goal by ID
  fetchGoalById: async (goalId: string) => {
    set({ isLoading: true, error: null });
    try {
      const goal = await goalsApi.getGoalById(goalId);
      set({ currentGoal: goal, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch goal',
        isLoading: false,
      });
    }
  },

  // Create a new goal
  createGoal: async (userId: string, data) => {
    set({ isLoading: true, error: null });
    try {
      const newGoal = await goalsApi.createGoal(userId, data);
      
      // Refresh goals list
      await get().fetchGoals();
      
      set({ isLoading: false });
      return newGoal;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to create goal',
        isLoading: false,
      });
      return null;
    }
  },

  // Update an existing goal
  updateGoal: async (goalId: string, data) => {
    set({ isLoading: true, error: null });
    try {
      await goalsApi.updateGoal(goalId, data as UpdateGoalRequest);
      
      // Refresh current goal if it's the one being updated
      if (get().currentGoal?.id === goalId) {
        await get().fetchGoalById(goalId);
      }
      
      // Refresh goals list
      await get().fetchGoals();
      
      set({ isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to update goal',
        isLoading: false,
      });
    }
  },

  // Delete (abandon) a goal
  deleteGoal: async (goalId: string) => {
    set({ isLoading: true, error: null });
    try {
      await goalsApi.abandonGoal(goalId);
      
      // Clear current goal if it's the one being deleted
      if (get().currentGoal?.id === goalId) {
        set({ currentGoal: null });
      }
      
      // Refresh goals list
      await get().fetchGoals();
      
      set({ isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to delete goal',
        isLoading: false,
      });
    }
  },

  // Set filters and optionally refetch
  setFilters: (filters: GoalsQueryFilters) => {
    set({ filters });
  },

  // Clear error state
  clearError: () => set({ error: null }),

  // Fetch checkpoints
  fetchCheckpoints: async (filters?: { status?: string }) => {
    set({ isLoading: true, error: null });
    try {
      const checkpointFilters: { status?: CheckpointStatus[] } = {};
      if (filters?.status) {
        // Split comma-separated statuses into an array
        checkpointFilters.status = filters.status.split(',').map(s => s.trim() as CheckpointStatus);
      }
      const checkpoints = await checkpointsApi.getCheckpoints(checkpointFilters);
      set({ checkpoints, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch checkpoints',
        isLoading: false,
      });
    }
  },

  // Set current goal
  setCurrentGoal: (goal: GoalWithDetails | null) => set({ currentGoal: goal }),
}));
