import { kpiTemplatesRepository } from '../repository/templates.repository';
import type {
  KpiTemplateWithMetrics,
  CreateTemplateRequest,
  UpdateTemplateRequest,
  CreateMetricRequest,
  UpdateMetricRequest,
  KpiTemplateFilters,
} from '../types';

/**
 * API Layer for KPI Templates
 * Handles business logic and validation
 */

export const kpiTemplatesApi = {
  /**
   * Get all templates with filters
   */
  async getTemplates(
    filters?: KpiTemplateFilters
  ): Promise<{ data: KpiTemplateWithMetrics[]; error?: string }> {
    const companyId =
      filters?.company_scope === 'global'
        ? null
        : filters?.company_scope === 'company'
        ? 'CURRENT_COMPANY_ID'
        : undefined;

    const { data, error } = await kpiTemplatesRepository.getAllWithMetrics({
      search: filters?.search,
      company_id: companyId,
      cycle_type: filters?.cycle_type,
    });

    if (error) {
      return { data: [], error: 'Failed to fetch templates' };
    }

    return { data: data || [] };
  },

  /**
   * Get a single template
   */
  async getTemplate(
    id: string
  ): Promise<{ data: KpiTemplateWithMetrics | null; error?: string }> {
    const { data, error } = await kpiTemplatesRepository.getByIdWithMetrics(id);

    if (error) {
      return { data: null, error: 'Failed to fetch template' };
    }

    return { data };
  },

  /**
   * Create a new template with metrics
   */
  async createTemplate(
    template: CreateTemplateRequest
  ): Promise<{ data: KpiTemplateWithMetrics | null; error?: string }> {
    // Validation
    if (!template.title?.trim()) {
      return { data: null, error: 'Template title is required' };
    }

    if (!template.cycle_type) {
      return { data: null, error: 'Cycle type is required' };
    }

    if (!template.metrics || template.metrics.length === 0) {
      return { data: null, error: 'At least one metric is required' };
    }

    // Validate total points
    const totalPoints = template.metrics.reduce((sum, m) => sum + m.target_points, 0);
    const targetPoints = template.total_target_points || 1000;

    if (totalPoints !== targetPoints) {
      return {
        data: null,
        error: `Metrics must sum to ${targetPoints} points. Current total: ${totalPoints}`,
      };
    }

    // Validate individual metrics
    for (const metric of template.metrics) {
      if (!metric.name?.trim()) {
        return { data: null, error: 'All metrics must have a name' };
      }
      if (!metric.category_id) {
        return { data: null, error: 'All metrics must have a category' };
      }
      if (metric.target_points <= 0) {
        return { data: null, error: 'All metrics must have positive target points' };
      }
    }

    const { data, error } = await kpiTemplatesRepository.createWithMetrics(template);

    if (error) {
      return { data: null, error: 'Failed to create template' };
    }

    return { data };
  },

  /**
   * Update a template
   */
  async updateTemplate(
    id: string,
    updates: UpdateTemplateRequest
  ): Promise<{ data: any; error?: string }> {
    if (updates.title !== undefined && !updates.title?.trim()) {
      return { data: null, error: 'Template title cannot be empty' };
    }

    const { data, error } = await kpiTemplatesRepository.update(id, updates);

    if (error) {
      return { data: null, error: 'Failed to update template' };
    }

    return { data };
  },

  /**
   * Delete a template
   */
  async deleteTemplate(id: string): Promise<{ success: boolean; error?: string }> {
    // Check if template is in use
    const { inUse, error: checkError } = await kpiTemplatesRepository.isInUse(id);

    if (checkError) {
      return { success: false, error: 'Failed to check template usage' };
    }

    if (inUse) {
      return {
        success: false,
        error: 'Cannot delete template that is assigned to developers',
      };
    }

    const { error } = await kpiTemplatesRepository.delete(id);

    if (error) {
      return { success: false, error: 'Failed to delete template' };
    }

    return { success: true };
  },

  /**
   * Add metric to existing template
   */
  async addMetric(
    templateId: string,
    metric: CreateMetricRequest
  ): Promise<{ data: any; error?: string }> {
    if (!metric.name?.trim()) {
      return { data: null, error: 'Metric name is required' };
    }

    if (!metric.category_id) {
      return { data: null, error: 'Category is required' };
    }

    if (metric.target_points <= 0) {
      return { data: null, error: 'Target points must be positive' };
    }

    const { data, error } = await kpiTemplatesRepository.addMetric({
      ...metric,
      template_id: templateId,
    });

    if (error) {
      return { data: null, error: 'Failed to add metric' };
    }

    return { data };
  },

  /**
   * Update metric
   */
  async updateMetric(
    id: string,
    updates: UpdateMetricRequest
  ): Promise<{ data: any; error?: string }> {
    const { data, error } = await kpiTemplatesRepository.updateMetric(id, updates);

    if (error) {
      return { data: null, error: 'Failed to update metric' };
    }

    return { data };
  },

  /**
   * Delete metric
   */
  async deleteMetric(id: string): Promise<{ success: boolean; error?: string }> {
    const { error } = await kpiTemplatesRepository.deleteMetric(id);

    if (error) {
      return { success: false, error: 'Failed to delete metric' };
    }

    return { success: true };
  },
};
