import { useState } from 'react';
import { useGoalsStore } from '../store/goals.store';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { reviewGoal } from '../apis/goals.api';
import * as checkpointsApi from '../apis/checkpoints.api';
import { toast } from 'sonner';
import type { CreateCheckpointRequest, CreateAssessmentRequest, CheckpointsQueryFilters } from '../types';

export const useCheckpoints = () => {
  const { goals, checkpoints, fetchCheckpoints } = useGoalsStore();
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch checkpoints with filters
  const loadCheckpoints = async (filters?: CheckpointsQueryFilters) => {
    setIsLoading(true);
    setError(null);
    try {
      // Convert CheckpointsQueryFilters to the format the store expects
      const storeFilters = filters?.status 
        ? { status: Array.isArray(filters.status) ? filters.status.join(',') : filters.status }
        : undefined;
      await fetchCheckpoints(storeFilters);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch checkpoints';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPendingCheckpoints = async () => {
    await loadCheckpoints({ status: ['READY_FOR_REVIEW', 'REVIEW_IN_PROGRESS'] });
  };

  // Create a new checkpoint
  const createCheckpoint = async (data: CreateCheckpointRequest) => {
    setIsLoading(true);
    setError(null);
    try {
      const checkpoint = await checkpointsApi.createCheckpoint(data);
      toast.success('Checkpoint created successfully');
      return checkpoint;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create checkpoint';
      setError(message);
      toast.error(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Mark checkpoint as ready for review
  const markCheckpointReady = async (checkpointId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await checkpointsApi.markCheckpointReady(checkpointId);
      toast.success('Checkpoint marked as ready for review');
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to mark checkpoint ready';
      setError(message);
      toast.error(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Start reviewing a checkpoint (reviewer action)
  const startReview = async (checkpointId: string) => {
    if (!user?.id) {
      const message = 'User not authenticated';
      setError(message);
      toast.error(message);
      return false;
    }

    setIsLoading(true);
    setError(null);
    try {
      await checkpointsApi.startCheckpointReview(checkpointId, user.id);
      toast.success('Review started');
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start review';
      setError(message);
      toast.error(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Submit assessment for a checkpoint
  const submitAssessment = async (_checkpointId: string, data: CreateAssessmentRequest) => {
    if (!user?.id) {
      const message = 'User not authenticated';
      setError(message);
      toast.error(message);
      return false;
    }

    setIsLoading(true);
    setError(null);
    try {
      await checkpointsApi.submitAssessment(user.id, data);
      toast.success(data.passed ? 'Checkpoint passed!' : 'Assessment submitted with feedback');
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to submit assessment';
      setError(message);
      toast.error(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Get checkpoint by ID
  const getCheckpointById = async (checkpointId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const checkpoint = await checkpointsApi.getCheckpointById(checkpointId);
      return checkpoint;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch checkpoint';
      setError(message);
      toast.error(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Get assessment for a checkpoint
  const getAssessment = async (checkpointId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const assessment = await checkpointsApi.getAssessment(checkpointId);
      return assessment;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch assessment';
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Delete a checkpoint
  const deleteCheckpoint = async (checkpointId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await checkpointsApi.deleteCheckpoint(checkpointId);
      toast.success('Checkpoint deleted');
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete checkpoint';
      setError(message);
      toast.error(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Skip a checkpoint
  const skipCheckpoint = async (checkpointId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await checkpointsApi.skipCheckpoint(checkpointId);
      toast.success('Checkpoint skipped');
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to skip checkpoint';
      setError(message);
      toast.error(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Legacy: submit review for goal (kept for backwards compatibility)
  const submitReview = async (
    goalId: string,
    passed: boolean,
    assessmentData: { feedback: string; action_items: string[] }
  ) => {
    if (!user?.id) {
      const message = 'User not authenticated';
      setError(message);
      toast.error(message);
      return false;
    }
    
    setIsLoading(true);
    setError(null);
    try {
      await reviewGoal(goalId, user.id, {
        goal_id: goalId,
        action: passed ? 'APPROVED' : 'REQUESTED_CHANGES',
        comments: assessmentData.feedback,
      });
      toast.success(passed ? 'Goal approved!' : 'Review submitted with feedback');
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to submit review';
      setError(message);
      toast.error(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    goals,
    checkpoints,
    isLoading,
    error,
    // Fetch methods
    loadCheckpoints,
    fetchPendingCheckpoints,
    getCheckpointById,
    getAssessment,
    // Developer methods
    createCheckpoint,
    markCheckpointReady,
    deleteCheckpoint,
    skipCheckpoint,
    // Reviewer methods
    startReview,
    submitAssessment,
    // Legacy
    submitReview,
  };
};
