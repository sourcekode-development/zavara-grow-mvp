import { useEffect, useCallback } from 'react';
import { kpiCategoriesApi } from '../apis/categories.api';
import { useCategoriesStore } from '../store/categories.store';
import { useAuthStore } from '@/features/auth/store/auth.store';
import type { CreateCategoryRequest, UpdateCategoryRequest, KpiCategoryFilters } from '../types';

/**
 * Hook to fetch and manage KPI categories
 */
export const useCategories = () => {
  const { user } = useAuthStore();
  const {
    categories,
    isLoading,
    filters,
    setCategories,
    setFilters,
    setLoading,
  } = useCategoriesStore();

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    
    // Replace placeholder with actual company_id
    const processedFilters = { ...filters };
    if (filters.company_scope === 'company' && user?.profile?.company_id) {
      // This will be handled in the API layer
    }

    const { data } = await kpiCategoriesApi.getCategories(processedFilters);
    setCategories(data);
    setLoading(false);
  }, [filters, user?.profile?.company_id, setCategories, setLoading]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const updateFilters = useCallback(
    (newFilters: KpiCategoryFilters) => {
      setFilters(newFilters);
    },
    [setFilters]
  );

  return {
    categories,
    isLoading,
    filters,
    updateFilters,
    refetch: fetchCategories,
  };
};

/**
 * Hook to create a category
 */
export const useCreateCategory = () => {
  const { user } = useAuthStore();
  const { addCategory } = useCategoriesStore();

  const createCategory = useCallback(
    async (data: Omit<CreateCategoryRequest, 'company_id'> & { is_global?: boolean }) => {
      const categoryData: CreateCategoryRequest = {
        ...data,
        company_id: data.is_global ? null : user?.profile?.company_id || null,
      };

      const result = await kpiCategoriesApi.createCategory(categoryData);

      if (result.data) {
        addCategory(result.data);
      }

      return result;
    },
    [user?.profile?.company_id, addCategory]
  );

  return { createCategory };
};

/**
 * Hook to update a category
 */
export const useUpdateCategory = () => {
  const { updateCategory: updateCategoryInStore } = useCategoriesStore();

  const updateCategory = useCallback(
    async (id: string, updates: UpdateCategoryRequest) => {
      const result = await kpiCategoriesApi.updateCategory(id, updates);

      if (result.data) {
        updateCategoryInStore(id, result.data);
      }

      return result;
    },
    [updateCategoryInStore]
  );

  return { updateCategory };
};

/**
 * Hook to delete a category
 */
export const useDeleteCategory = () => {
  const { removeCategory } = useCategoriesStore();

  const deleteCategory = useCallback(
    async (id: string) => {
      const result = await kpiCategoriesApi.deleteCategory(id);

      if (result.success) {
        removeCategory(id);
      }

      return result;
    },
    [removeCategory]
  );

  return { deleteCategory };
};
