import { supabase } from '@/shared/config/supabase';
import type {
  DeveloperKpi,
  DeveloperKpiMetric,
  DeveloperKpiWithMetrics,
  AssignKpiRequest,
} from '../types';

/**
 * Repository for Developer KPIs
 * Handles direct database interactions for assigned KPIs
 */

export const developerKpisRepository = {
  /**
   * Fetch all developer KPIs with metrics and relations
   */
  async getAllWithMetrics(filters?: {
    search?: string;
    user_id?: string;
    status?: string;
    assigned_by?: string;
  }): Promise<{ data: DeveloperKpiWithMetrics[] | null; error: any }> {
    try {
      let query = supabase
        .from('developer_kpis')
        .select(
          `
          *,
          metrics:developer_kpi_metrics(
            *,
            category:kpi_categories(*)
          ),
          developer:user_profiles!developer_kpis_user_id_fkey(id, full_name, email),
          assigner:user_profiles!developer_kpis_assigned_by_fkey(id, full_name)
        `
        )
        .order('created_at', { ascending: false });

      if (filters?.search) {
        query = query.or(
          `title.ilike.%${filters.search}%,developer.full_name.ilike.%${filters.search}%`
        );
      }

      if (filters?.user_id) {
        query = query.eq('user_id', filters.user_id);
      }

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.assigned_by) {
        query = query.eq('assigned_by', filters.assigned_by);
      }

      const { data, error } = await query;

      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  },

  /**
   * Get a single developer KPI with metrics
   */
  async getByIdWithMetrics(
    id: string
  ): Promise<{ data: DeveloperKpiWithMetrics | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('developer_kpis')
        .select(
          `
          *,
          metrics:developer_kpi_metrics(
            *,
            category:kpi_categories(*)
          ),
          developer:user_profiles!developer_kpis_user_id_fkey(id, full_name, email),
          assigner:user_profiles!developer_kpis_assigned_by_fkey(id, full_name)
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
   * Create developer KPI (snapshot from template)
   */
  async create(
    developerKpi: Omit<DeveloperKpi, 'id' | 'created_at' | 'updated_at'>
  ): Promise<{ data: DeveloperKpi | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('developer_kpis')
        .insert([developerKpi])
        .select()
        .single();

      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  },

  /**
   * Create developer KPI metrics (snapshot from template metrics)
   */
  async createMetrics(
    metrics: Omit<DeveloperKpiMetric, 'id' | 'created_at' | 'updated_at'>[]
  ): Promise<{ data: DeveloperKpiMetric[] | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('developer_kpi_metrics')
        .insert(metrics)
        .select();

      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  },

  /**
   * Update developer KPI
   */
  async update(
    id: string,
    updates: Partial<DeveloperKpi>
  ): Promise<{ data: DeveloperKpi | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('developer_kpis')
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
   * Update developer KPI metric accumulated points
   */
  async updateMetricPoints(
    metricId: string,
    pointsToAdd: number
  ): Promise<{ data: DeveloperKpiMetric | null; error: any }> {
    try {
      // First get current points
      const { data: currentMetric, error: fetchError } = await supabase
        .from('developer_kpi_metrics')
        .select('accumulated_points')
        .eq('id', metricId)
        .single();

      if (fetchError || !currentMetric) {
        return { data: null, error: fetchError };
      }

      // Update with new total
      const newTotal = currentMetric.accumulated_points + pointsToAdd;

      const { data, error } = await supabase
        .from('developer_kpi_metrics')
        .update({ accumulated_points: newTotal })
        .eq('id', metricId)
        .select()
        .single();

      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  },

  /**
   * Delete developer KPI (cascades to metrics)
   */
  async delete(id: string): Promise<{ error: any }> {
    try {
      const { error } = await supabase.from('developer_kpis').delete().eq('id', id);

      return { error };
    } catch (error) {
      return { error };
    }
  },

  /**
   * Get active KPI for a user
   */
  async getActiveForUser(
    userId: string
  ): Promise<{ data: DeveloperKpiWithMetrics | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('developer_kpis')
        .select(
          `
          *,
          metrics:developer_kpi_metrics(
            *,
            category:kpi_categories(*)
          )
        `
        )
        .eq('user_id', userId)
        .eq('status', 'ACTIVE')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  },

  /**
   * Get a single metric by ID
   */
  async getMetricById(
    metricId: string
  ): Promise<{ data: DeveloperKpiMetric | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('developer_kpi_metrics')
        .select('*')
        .eq('id', metricId)
        .single();

      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  },
};
