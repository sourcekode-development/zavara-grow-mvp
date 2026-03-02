import { supabase } from '@/shared/config/supabase';
import type {
  KpiMetricSubmission,
  KpiMetricSubmissionWithDetails,
  KpiSubmissionFilters,
  CreateSubmissionRequest,
} from '../types';

/**
 * SUBMISSIONS REPOSITORY
 * Direct database interactions for KPI metric submissions
 */

export const submissionsRepository = {
  /**
   * Get all submissions with filters and joins
   */
  async getAllWithDetails(filters?: KpiSubmissionFilters): Promise<{
    data: KpiMetricSubmissionWithDetails[] | null;
    error: any;
  }> {
    try {
      let query = supabase
        .from('kpi_metric_submissions')
        .select(
          `
          *,
          metric:developer_kpi_metrics(
            *,
            developer_kpi:developer_kpis(
              *,
              developer:user_profiles!developer_kpis_user_id_fkey(id, full_name, email)
            ),
            category:kpi_categories(*)
          ),
          reviewer:user_profiles!kpi_metric_submissions_reviewer_id_fkey(id, full_name)
        `
        )
        .order('created_at', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.developer_id) {
        query = query.eq('metric.developer_kpi.user_id', filters.developer_id);
      }

      if (filters?.metric_id) {
        query = query.eq('metric_id', filters.metric_id);
      }

      const { data, error } = await query;

      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  },

  /**
   * Get single submission by ID with details
   */
  async getByIdWithDetails(id: string): Promise<{
    data: KpiMetricSubmissionWithDetails | null;
    error: any;
  }> {
    try {
      const { data, error } = await supabase
        .from('kpi_metric_submissions')
        .select(
          `
          *,
          metric:developer_kpi_metrics(
            *,
            developer_kpi:developer_kpis(
              *,
              developer:user_profiles!developer_kpis_user_id_fkey(id, full_name, email)
            ),
            category:kpi_categories(*)
          ),
          reviewer:user_profiles!kpi_metric_submissions_reviewer_id_fkey(id, full_name)
        `
        )
        .eq('id', id)
        .single();

      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  },

  /**
   * Create a new submission
   */
  async create(
    submission: CreateSubmissionRequest
  ): Promise<{ data: KpiMetricSubmission | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('kpi_metric_submissions')
        .insert({
          metric_id: submission.metric_id,
          developer_id: submission.developer_id,
          description: submission.description,
          attachments: submission.attachments || [],
          status: 'PENDING',
        })
        .select()
        .single();

      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  },

  /**
   * Update submission (for review)
   */
  async update(
    id: string,
    updates: {
      status?: 'PENDING' | 'APPROVED' | 'REJECTED';
      reviewer_id?: string;
      reviewer_comments?: string;
      reviewed_at?: string;
      points_awarded?: number;
    }
  ): Promise<{ data: KpiMetricSubmission | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('kpi_metric_submissions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  },

  /**
   * Delete a submission
   */
  async delete(id: string): Promise<{ error: any }> {
    try {
      const { error } = await supabase
        .from('kpi_metric_submissions')
        .delete()
        .eq('id', id);

      return { error };
    } catch (error) {
      return { error };
    }
  },

  /**
   * Get submissions by metric ID
   */
  async getByMetricId(metricId: string): Promise<{
    data: KpiMetricSubmission[] | null;
    error: any;
  }> {
    try {
      const { data, error } = await supabase
        .from('kpi_metric_submissions')
        .select('*')
        .eq('metric_id', metricId)
        .order('created_at', { ascending: false });

      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  },

  /**
   * Get pending submissions count for a developer
   */
  async getPendingCountForDeveloper(userId: string): Promise<{
    count: number;
    error: any;
  }> {
    try {
      const { count, error } = await supabase
        .from('kpi_metric_submissions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'PENDING')
        .eq('metric.developer_kpi.user_id', userId);

      return { count: count || 0, error };
    } catch (error) {
      return { count: 0, error };
    }
  },
};
