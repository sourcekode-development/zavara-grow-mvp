import { supabase } from '@/shared/config/supabase';
import type { KpiCategory, CreateCategoryRequest, UpdateCategoryRequest } from '../types';

/**
 * Repository for KPI Categories
 * Handles direct database interactions for categories
 */

export const kpiCategoriesRepository = {
  /**
   * Fetch all categories with optional filters
   */
  async getAll(filters?: {
    search?: string;
    company_id?: string | null;
  }): Promise<{ data: KpiCategory[] | null; error: any }> {
    try {
      let query = supabase
        .from('kpi_categories')
        .select('*')
        .order('created_at', { ascending: false });

      // Apply search filter
      if (filters?.search) {
        query = query.ilike('name', `%${filters.search}%`);
      }

      // Apply company filter
      if (filters?.company_id !== undefined) {
        if (filters.company_id === null) {
          // Filter for global categories
          query = query.is('company_id', null);
        } else {
          // Filter for specific company or global
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
   * Get a single category by ID
   */
  async getById(id: string): Promise<{ data: KpiCategory | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('kpi_categories')
        .select('*')
        .eq('id', id)
        .single();

      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  },

  /**
   * Create a new category
   */
  async create(
    category: CreateCategoryRequest
  ): Promise<{ data: KpiCategory | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('kpi_categories')
        .insert([category])
        .select()
        .single();

      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  },

  /**
   * Update an existing category
   */
  async update(
    id: string,
    updates: UpdateCategoryRequest
  ): Promise<{ data: KpiCategory | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('kpi_categories')
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
   * Delete a category
   */
  async delete(id: string): Promise<{ error: any }> {
    try {
      const { error } = await supabase
        .from('kpi_categories')
        .delete()
        .eq('id', id);

      return { error };
    } catch (error) {
      return { error };
    }
  },

  /**
   * Check if category is being used in templates
   */
  async isInUse(id: string): Promise<{ inUse: boolean; error: any }> {
    try {
      const { count, error } = await supabase
        .from('kpi_template_metrics')
        .select('id', { count: 'exact', head: true })
        .eq('category_id', id);

      return { inUse: (count || 0) > 0, error };
    } catch (error) {
      return { inUse: false, error };
    }
  },
};
