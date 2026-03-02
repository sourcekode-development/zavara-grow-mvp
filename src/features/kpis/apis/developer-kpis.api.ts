import { developerKpisRepository } from '../repository/developer-kpis.repository';
import { kpiTemplatesRepository } from '../repository/templates.repository';
import type {
  DeveloperKpiWithMetrics,
  AssignKpiRequest,
  DeveloperKpiFilters,
  KpiOverallProgress,
} from '../types';

/**
 * API Layer for Developer KPIs
 * Handles business logic, snapshot creation, and validation
 */

export const developerKpisApi = {
  /**
   * Get all developer KPIs with filters
   */
  async getDeveloperKpis(
    filters?: DeveloperKpiFilters
  ): Promise<{ data: DeveloperKpiWithMetrics[]; error?: string }> {
    const { data, error } = await developerKpisRepository.getAllWithMetrics(filters);

    if (error) {
      return { data: [], error: 'Failed to fetch developer KPIs' };
    }

    return { data: data || [] };
  },

  /**
   * Get a single developer KPI
   */
  async getDeveloperKpi(
    id: string
  ): Promise<{ data: DeveloperKpiWithMetrics | null; error?: string }> {
    const { data, error } = await developerKpisRepository.getByIdWithMetrics(id);

    if (error) {
      return { data: null, error: 'Failed to fetch developer KPI' };
    }

    return { data };
  },

  /**
   * Assign KPI to developer (creates snapshot from template)
   */
  async assignKpi(
    request: AssignKpiRequest
  ): Promise<{ data: DeveloperKpiWithMetrics | null; error?: string }> {
    // Validation
    if (!request.user_id) {
      return { data: null, error: 'Developer is required' };
    }

    if (!request.template_id) {
      return { data: null, error: 'Template is required' };
    }

    if (!request.start_date) {
      return { data: null, error: 'Start date is required' };
    }

    // Check if user already has an active KPI
    const { data: activeKpi } = await developerKpisRepository.getActiveForUser(
      request.user_id
    );

    if (activeKpi) {
      return {
        data: null,
        error: 'Developer already has an active KPI. Complete or archive it first.',
      };
    }

    // Fetch template with metrics
    const { data: template, error: templateError } =
      await kpiTemplatesRepository.getByIdWithMetrics(request.template_id);

    if (templateError || !template) {
      return { data: null, error: 'Template not found' };
    }

    if (!template.metrics || template.metrics.length === 0) {
      return { data: null, error: 'Template has no metrics' };
    }

    // Get the assigned_by from context (will be passed from hook)
    const assigned_by = (request as any).assigned_by;
    if (!assigned_by) {
      return { data: null, error: 'Assigner ID is required' };
    }

    // Create developer KPI (snapshot)
    const { data: developerKpi, error: kpiError } = await developerKpisRepository.create({
      user_id: request.user_id,
      assigned_by: assigned_by,
      title: template.title,
      status: 'ACTIVE',
      start_date: request.start_date,
      end_date: request.end_date,
    });

    if (kpiError || !developerKpi) {
      return { data: null, error: 'Failed to create developer KPI' };
    }

    // Create developer KPI metrics (snapshot from template metrics)
    const metricsToCreate = template.metrics.map((metric) => ({
      developer_kpi_id: developerKpi.id,
      category_id: metric.category_id,
      name: metric.name,
      target_points: metric.target_points,
      accumulated_points: 0,
    }));

    const { error: metricsError } = await developerKpisRepository.createMetrics(
      metricsToCreate
    );

    if (metricsError) {
      // Rollback: delete developer KPI
      await developerKpisRepository.delete(developerKpi.id);
      return { data: null, error: 'Failed to create KPI metrics' };
    }

    // Fetch complete developer KPI with metrics
    const { data: completeKpi } = await developerKpisRepository.getByIdWithMetrics(
      developerKpi.id
    );

    return { data: completeKpi };
  },

  /**
   * Update developer KPI status
   */
  async updateKpiStatus(
    id: string,
    status: 'ACTIVE' | 'COMPLETED' | 'ARCHIVED'
  ): Promise<{ data: any; error?: string }> {
    const { data, error } = await developerKpisRepository.update(id, { status });

    if (error) {
      return { data: null, error: 'Failed to update KPI status' };
    }

    return { data };
  },

  /**
   * Calculate progress for a developer KPI
   */
  async calculateProgress(
    id: string
  ): Promise<{ data: KpiOverallProgress | null; error?: string }> {
    const { data: kpi, error } = await developerKpisRepository.getByIdWithMetrics(id);

    if (error || !kpi) {
      return { data: null, error: 'Failed to fetch KPI' };
    }

    const metrics = kpi.metrics || [];
    const totalTarget = metrics.reduce((sum, m) => sum + m.target_points, 0);
    const totalAccumulated = metrics.reduce((sum, m) => sum + m.accumulated_points, 0);

    const progress: KpiOverallProgress = {
      developer_kpi_id: kpi.id,
      title: kpi.title,
      total_target_points: totalTarget,
      total_accumulated_points: totalAccumulated,
      progress_percentage: totalTarget > 0 ? (totalAccumulated / totalTarget) * 100 : 0,
      metrics: metrics.map((m) => ({
        metric_id: m.id,
        metric_name: m.name,
        category_name: m.category?.name || 'Unknown',
        target_points: m.target_points,
        accumulated_points: m.accumulated_points,
        progress_percentage:
          m.target_points > 0 ? (m.accumulated_points / m.target_points) * 100 : 0,
      })),
    };

    return { data: progress };
  },

  /**
   * Delete a developer KPI
   */
  async deleteKpi(id: string): Promise<{ success: boolean; error?: string }> {
    const { error } = await developerKpisRepository.delete(id);

    if (error) {
      return { success: false, error: 'Failed to delete KPI' };
    }

    return { success: true };
  },
};
