import { submissionsRepository } from '../repository/submissions.repository';
import { developerKpisRepository } from '../repository/developer-kpis.repository';
import type {
  KpiMetricSubmissionWithDetails,
  KpiSubmissionFilters,
  CreateSubmissionRequest,
  ReviewSubmissionRequest,
} from '../types';

/**
 * API Layer for KPI Submissions
 * Handles business logic for claim submission and review
 */

export const submissionsApi = {
  /**
   * Get all submissions with optional filters
   */
  async getSubmissions(
    filters?: KpiSubmissionFilters
  ): Promise<{ data: KpiMetricSubmissionWithDetails[]; error?: string }> {
    const { data, error } = await submissionsRepository.getAllWithDetails(filters);

    if (error) {
      return { data: [], error: 'Failed to fetch submissions' };
    }

    return { data: data || [] };
  },

  /**
   * Get single submission
   */
  async getSubmission(
    id: string
  ): Promise<{ data: KpiMetricSubmissionWithDetails | null; error?: string }> {
    const { data, error } = await submissionsRepository.getByIdWithDetails(id);

    if (error) {
      return { data: null, error: 'Failed to fetch submission' };
    }

    return { data };
  },

  /**
   * Submit a claim (Developer action)
   */
  async submitClaim(
    request: CreateSubmissionRequest
  ): Promise<{ data: any | null; error?: string }> {
    // Validation
    if (!request.metric_id) {
      return { data: null, error: 'Metric ID is required' };
    }

    if (!request.developer_id) {
      return { data: null, error: 'Developer ID is required' };
    }

    if (!request.description?.trim()) {
      return { data: null, error: 'Description is required' };
    }

    // Create submission
    const { data, error } = await submissionsRepository.create(request);

    if (error) {
      return { data: null, error: 'Failed to create submission' };
    }

    return { data };
  },

  /**
   * Review a submission (Team Lead action)
   * Approving increments the accumulated_points on the metric by points_awarded
   */
  async reviewSubmission(
    id: string,
    review: ReviewSubmissionRequest
  ): Promise<{ data: any | null; error?: string }> {
    // Validation
    if (!review.status || !['APPROVED', 'REJECTED'].includes(review.status)) {
      return { data: null, error: 'Invalid review status' };
    }

    if (!review.reviewed_by) {
      return { data: null, error: 'Reviewer ID is required' };
    }

    if (review.status === 'APPROVED' && !review.points_awarded) {
      return { data: null, error: 'Points awarded is required for approval' };
    }

    // Get submission details
    const { data: submission, error: submissionError } =
      await submissionsRepository.getByIdWithDetails(id);

    if (submissionError || !submission) {
      return { data: null, error: 'Submission not found' };
    }

    if (submission.status !== 'PENDING') {
      return { data: null, error: 'Submission already reviewed' };
    }

    // Update submission status
    const updateData: any = {
      status: review.status,
      reviewer_id: review.reviewed_by,
      reviewer_comments: review.reviewer_comments,
      reviewed_at: new Date().toISOString(),
    };

    // Only set points_awarded for APPROVED status
    if (review.status === 'APPROVED') {
      updateData.points_awarded = review.points_awarded || 0;
    }

    const { data: updatedSubmission, error: updateError } =
      await submissionsRepository.update(id, updateData);

    if (updateError) {
      return { data: null, error: 'Failed to update submission' };
    }

    // If approved, increment accumulated_points on the metric
    if (review.status === 'APPROVED' && review.points_awarded) {
      const { error: incrementError } =
        await developerKpisRepository.updateMetricPoints(
          submission.metric_id,
          review.points_awarded
        );

      if (incrementError) {
        // Rollback submission status
        await submissionsRepository.update(id, { status: 'PENDING' });
        return { data: null, error: 'Failed to update metric points' };
      }
    }

    return { data: updatedSubmission };
  },

  /**
   * Delete a submission (only if pending)
   */
  async deleteSubmission(id: string): Promise<{ success: boolean; error?: string }> {
    const { data: submission } = await submissionsRepository.getByIdWithDetails(id);

    if (!submission) {
      return { success: false, error: 'Submission not found' };
    }

    if (submission.status !== 'PENDING') {
      return { success: false, error: 'Can only delete pending submissions' };
    }

    const { error } = await submissionsRepository.delete(id);

    if (error) {
      return { success: false, error: 'Failed to delete submission' };
    }

    return { success: true };
  },
};
