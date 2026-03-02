import { kpiCategoriesRepository } from '../repository/categories.repository';
import type {
  KpiCategory,
  CreateCategoryRequest,
  UpdateCategoryRequest,
  KpiCategoryFilters,
} from '../types';

/**
 * API Layer for KPI Categories
 * Handles business logic and validation
 */

export const kpiCategoriesApi = {
  /**
   * Get all categories with filters
   */
  async getCategories(
    filters?: KpiCategoryFilters
  ): Promise<{ data: KpiCategory[]; error?: string }> {
    const companyId = filters?.company_scope === 'global' 
      ? null 
      : filters?.company_scope === 'company' 
        ? 'CURRENT_COMPANY_ID' // Will be replaced with actual company_id in hook
        : undefined;

    const { data, error } = await kpiCategoriesRepository.getAll({
      search: filters?.search,
      company_id: companyId,
    });

    if (error) {
      return { data: [], error: 'Failed to fetch categories' };
    }

    return { data: data || [] };
  },

  /**
   * Get a single category by ID
   */
  async getCategory(id: string): Promise<{ data: KpiCategory | null; error?: string }> {
    const { data, error } = await kpiCategoriesRepository.getById(id);

    if (error) {
      return { data: null, error: 'Failed to fetch category' };
    }

    return { data };
  },

  /**
   * Create a new category
   */
  async createCategory(
    category: CreateCategoryRequest
  ): Promise<{ data: KpiCategory | null; error?: string }> {
    // Validation
    if (!category.name?.trim()) {
      return { data: null, error: 'Category name is required' };
    }

    if (category.name.length > 100) {
      return { data: null, error: 'Category name must be less than 100 characters' };
    }

    const { data, error } = await kpiCategoriesRepository.create(category);

    if (error) {
      if (error.code === '23505') {
        return { data: null, error: 'A category with this name already exists' };
      }
      return { data: null, error: 'Failed to create category' };
    }

    return { data };
  },

  /**
   * Update a category
   */
  async updateCategory(
    id: string,
    updates: UpdateCategoryRequest
  ): Promise<{ data: KpiCategory | null; error?: string }> {
    // Validation
    if (updates.name !== undefined && !updates.name?.trim()) {
      return { data: null, error: 'Category name cannot be empty' };
    }

    if (updates.name && updates.name.length > 100) {
      return { data: null, error: 'Category name must be less than 100 characters' };
    }

    const { data, error } = await kpiCategoriesRepository.update(id, updates);

    if (error) {
      if (error.code === '23505') {
        return { data: null, error: 'A category with this name already exists' };
      }
      return { data: null, error: 'Failed to update category' };
    }

    return { data };
  },

  /**
   * Delete a category
   */
  async deleteCategory(id: string): Promise<{ success: boolean; error?: string }> {
    // Check if category is in use
    const { inUse, error: checkError } = await kpiCategoriesRepository.isInUse(id);

    if (checkError) {
      return { success: false, error: 'Failed to check category usage' };
    }

    if (inUse) {
      return {
        success: false,
        error: 'Cannot delete category that is used in templates. Remove it from templates first.',
      };
    }

    const { error } = await kpiCategoriesRepository.delete(id);

    if (error) {
      return { success: false, error: 'Failed to delete category' };
    }

    return { success: true };
  },
};
