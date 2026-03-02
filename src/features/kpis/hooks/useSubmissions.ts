import { useEffect, useCallback } from 'react';
import { submissionsApi } from '../apis/submissions.api';
import { useSubmissionsStore } from '../store/submissions.store';
import { useAuthStore } from '@/features/auth/store/auth.store';
import type {
  CreateSubmissionRequest,
  ReviewSubmissionRequest,
  KpiSubmissionFilters,
} from '../types';

/**
 * Hook to fetch and manage submissions
 */
export const useSubmissions = () => {
  const {
    submissions,
    isLoading,
    filters,
    setSubmissions,
    setFilters,
    setLoading,
  } = useSubmissionsStore();

  const fetchSubmissions = useCallback(async () => {
    setLoading(true);
    const { data } = await submissionsApi.getSubmissions(filters);
    setSubmissions(data);
    setLoading(false);
  }, [filters, setSubmissions, setLoading]);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  const updateFilters = useCallback(
    (newFilters: KpiSubmissionFilters) => {
      setFilters(newFilters);
    },
    [setFilters]
  );

  return {
    submissions,
    isLoading,
    filters,
    updateFilters,
    refetch: fetchSubmissions,
  };
};

/**
 * Hook to submit a claim (Developer)
 */
export const useSubmitClaim = () => {
  const { user } = useAuthStore();

  const submitClaim = useCallback(
    async (request: Omit<CreateSubmissionRequest, 'developer_id'>) => {
      if (!user?.profile?.id) {
        return { data: null, error: 'User not authenticated' };
      }

      const fullRequest: CreateSubmissionRequest = {
        ...request,
        developer_id: user.profile.id,
      };

      const result = await submissionsApi.submitClaim(fullRequest);

      if (result.data) {
        // Note: addSubmission expects full details, but we get basic submission
        // In practice, we'd refetch or the parent would refetch
      }

      return result;
    },
    [user?.profile?.id]
  );

  return { submitClaim };
};

/**
 * Hook to review a submission (Team Lead)
 */
export const useReviewSubmission = () => {
  const { user } = useAuthStore();
  const { updateSubmission } = useSubmissionsStore();

  const reviewSubmission = useCallback(
    async (
      submissionId: string,
      status: 'APPROVED' | 'REJECTED',
      pointsAwarded?: number,
      reviewerComments?: string
    ) => {
      if (!user?.profile?.id) {
        return { data: null, error: 'User not authenticated' };
      }

      const review: ReviewSubmissionRequest = {
        status,
        reviewed_by: user.profile.id,
        reviewer_comments: reviewerComments,
        points_awarded: pointsAwarded,
      };

      const result = await submissionsApi.reviewSubmission(submissionId, review);

      if (result.data) {
        updateSubmission(submissionId, { 
          status, 
          reviewer_comments: reviewerComments,
          points_awarded: pointsAwarded 
        });
      }

      return result;
    },
    [user?.profile?.id, updateSubmission]
  );

  return { reviewSubmission };
};

/**
 * Hook to delete a submission
 */
export const useDeleteSubmission = () => {
  const { removeSubmission } = useSubmissionsStore();

  const deleteSubmission = useCallback(
    async (id: string) => {
      const result = await submissionsApi.deleteSubmission(id);

      if (result.success) {
        removeSubmission(id);
      }

      return result;
    },
    [removeSubmission]
  );

  return { deleteSubmission };
};
