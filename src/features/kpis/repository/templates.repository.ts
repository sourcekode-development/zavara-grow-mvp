import { supabase } from '@/shared/config/supabase';
import type {
  KpiTemplate,
  KpiTemplateMetric,
  KpiTemplateWithMetrics,
  CreateTemplateRequest,
  UpdateTemplateRequest,
  CreateMetricRequest,
  UpdateMetricRequest,
} from '../types';

/**
 * Repository for KPI Templates and Template Metrics
 */

export const kpiTemplatesRepository = {
  /**
   * Fetch all templates with metrics
   */
  async getAllWithMetrics(filters?: {
    search?: string;
    company_id?: string | null;
    cycle_type?: string;
  }): Promise<{ data: KpiTemplateWithMetrics[] | null; error: any }> {
    try {
      let query = supabase
        .from('kpi_templates')
        .select(
          `
          *,
          metrics:kpi_template_metrics(
            *,
            category:kpi_categories(*)
          )
        `
        )
        .order('created_at', { ascending: false });

      if (filters?.search) {
        query = query.ilike('title', `%${filters.search}%`);
      }

      if (filters?.cycle_type) {
        query = query.eq('cycle_type', filters.cycle_type);
      }

      if (filters?.company_id !== undefined) {
        if (filters.company_id === null) {
          query = query.is('company_id', null);
        } else {
          query = query.or(`company_id.eq.${filters.company_id},company_id.is.null`);
        }
      }

      const { data, error } = await query;

      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  },

  /**
   * Get a single template with metrics
   */
  async getByIdWithMetrics(
    id: string
  ): Promise<{ data: KpiTemplateWithMetrics | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('kpi_templates')
        .select(
          `
          *,
          metrics:kpi_template_metrics(
            *,
            category:kpi_categories(*)
          )
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
   * Create template with metrics atomically
   */
  async createWithMetrics(
    template: CreateTemplateRequest
  ): Promise<{ data: KpiTemplateWithMetrics | null; error: any }> {
    try {
      // Create template
      const { data: templateData, error: templateError } = await supabase
        .from('kpi_templates')
        .insert([
          {
            company_id: template.company_id,
            title: template.title,
            cycle_type: template.cycle_type,
            total_target_points: template.total_target_points || 1000,
          },
        ])
        .select()
        .single();

      if (templateError || !templateData) {
        return { data: null, error: templateError };
      }

      // Create metrics
      if (template.metrics && template.metrics.length > 0) {
        const metricsToInsert = template.metrics.map((metric) => ({
          template_id: templateData.id,
          category_id: metric.category_id,
          name: metric.name,
          target_points: metric.target_points,
          description: metric.description,
        }));

        const { error: metricsError } = await supabase
          .from('kpi_template_metrics')
          .insert(metricsToInsert);

        if (metricsError) {
          // Rollback: delete template
          await supabase.from('kpi_templates').delete().eq('id', templateData.id);
          return { data: null, error: metricsError };
        }
      }

      // Fetch complete template with metrics
      return await this.getByIdWithMetrics(templateData.id);
    } catch (error) {
      return { data: null, error };
    }
  },

  /**
   * Update template
   */
  async update(
    id: string,
    updates: UpdateTemplateRequest
  ): Promise<{ data: KpiTemplate | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('kpi_templates')
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
   * Delete template (cascades to metrics)
   */
  async delete(id: string): Promise<{ error: any }> {
    try {
      const { error } = await supabase.from('kpi_templates').delete().eq('id', id);

      return { error };
    } catch (error) {
      return { error };
    }
  },

  /**
   * Get metrics for a template
   */
  async getMetrics(
    templateId: string
  ): Promise<{ data: KpiTemplateMetric[] | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('kpi_template_metrics')
        .select('*, category:kpi_categories(*)')
        .eq('template_id', templateId)
        .order('created_at');

      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  },

  /**
   * Add metric to template
   */
  async addMetric(
    metric: CreateMetricRequest & { template_id: string }
  ): Promise<{ data: KpiTemplateMetric | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('kpi_template_metrics')
        .insert([metric])
        .select()
        .single();

      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  },

  /**
   * Update metric
   */
  async updateMetric(
    id: string,
    updates: UpdateMetricRequest
  ): Promise<{ data: KpiTemplateMetric | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('kpi_template_metrics')
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
   * Delete metric
   */
  async deleteMetric(id: string): Promise<{ error: any }> {
    try {
      const { error } = await supabase.from('kpi_template_metrics').delete().eq('id', id);

      return { error };
    } catch (error) {
      return { error };
    }
  },

  /**
   * Check if template is in use
   */
  async isInUse(id: string): Promise<{ inUse: boolean; error: any }> {
    try {
      const { count, error } = await supabase
        .from('developer_kpis')
        .select('id', { count: 'exact', head: true })
        .eq('original_template_id', id);

      return { inUse: (count || 0) > 0, error };
    } catch (error) {
      return { inUse: false, error };
    }
  },
};
