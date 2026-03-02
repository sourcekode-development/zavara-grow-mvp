import { useEffect, useCallback } from 'react';
import { kpiTemplatesApi } from '../apis/templates.api';
import { useTemplatesStore } from '../store/templates.store';
import { useAuthStore } from '@/features/auth/store/auth.store';
import type {
  CreateTemplateRequest,
  UpdateTemplateRequest,
  KpiTemplateFilters,
  CreateMetricRequest,
  UpdateMetricRequest,
} from '../types';

/**
 * Hook to fetch and manage KPI templates
 */
export const useTemplates = () => {
  const { user } = useAuthStore();
  const { templates, isLoading, filters, setTemplates, setFilters, setLoading } =
    useTemplatesStore();

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    const { data } = await kpiTemplatesApi.getTemplates(filters);
    setTemplates(data);
    setLoading(false);
  }, [filters, setTemplates, setLoading]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const updateFilters = useCallback(
    (newFilters: KpiTemplateFilters) => {
      setFilters(newFilters);
    },
    [setFilters]
  );

  return {
    templates,
    isLoading,
    filters,
    updateFilters,
    refetch: fetchTemplates,
  };
};

/**
 * Hook to get a single template
 */
export const useTemplate = (id?: string) => {
  const { selectedTemplate, setSelectedTemplate } = useTemplatesStore();

  useEffect(() => {
    if (id) {
      kpiTemplatesApi.getTemplate(id).then(({ data }) => {
        if (data) {
          setSelectedTemplate(data);
        }
      });
    }
  }, [id, setSelectedTemplate]);

  return { template: selectedTemplate };
};

/**
 * Hook to create a template
 */
export const useCreateTemplate = () => {
  const { user } = useAuthStore();
  const { addTemplate } = useTemplatesStore();

  const createTemplate = useCallback(
    async (
      data: Omit<CreateTemplateRequest, 'company_id'>
    ) => {
      const templateData: CreateTemplateRequest = {
        ...data,
        company_id: user?.profile?.company_id || null,
      };

      const result = await kpiTemplatesApi.createTemplate(templateData);

      if (result.data) {
        addTemplate(result.data);
      }

      return result;
    },
    [user?.profile?.company_id, addTemplate]
  );

  return { createTemplate };
};

/**
 * Hook to update a template
 */
export const useUpdateTemplate = () => {
  const { updateTemplate: updateTemplateInStore } = useTemplatesStore();

  const updateTemplate = useCallback(
    async (id: string, updates: UpdateTemplateRequest) => {
      const result = await kpiTemplatesApi.updateTemplate(id, updates);

      if (result.data) {
        updateTemplateInStore(id, result.data);
      }

      return result;
    },
    [updateTemplateInStore]
  );

  return { updateTemplate };
};

/**
 * Hook to delete a template
 */
export const useDeleteTemplate = () => {
  const { removeTemplate } = useTemplatesStore();

  const deleteTemplate = useCallback(
    async (id: string) => {
      const result = await kpiTemplatesApi.deleteTemplate(id);

      if (result.success) {
        removeTemplate(id);
      }

      return result;
    },
    [removeTemplate]
  );

  return { deleteTemplate };
};

/**
 * Hook to manage template metrics
 */
export const useTemplateMetrics = (templateId?: string) => {
  const addMetric = useCallback(
    async (metric: CreateMetricRequest) => {
      if (!templateId) return { data: null, error: 'Template ID is required' };
      return await kpiTemplatesApi.addMetric(templateId, metric);
    },
    [templateId]
  );

  const updateMetric = useCallback(async (id: string, updates: UpdateMetricRequest) => {
    return await kpiTemplatesApi.updateMetric(id, updates);
  }, []);

  const deleteMetric = useCallback(async (id: string) => {
    return await kpiTemplatesApi.deleteMetric(id);
  }, []);

  return {
    addMetric,
    updateMetric,
    deleteMetric,
  };
};
