import { useEffect, useCallback, useState } from 'react';
import { developerKpisApi } from '../apis/developer-kpis.api';
import { useDeveloperKpisStore } from '../store/developer-kpis.store';
import { useAuthStore } from '@/features/auth/store/auth.store';
import type {
  AssignKpiRequest,
  DeveloperKpiFilters,
  KpiOverallProgress,
} from '../types';

/**
 * Hook to fetch and manage developer KPIs
 */
export const useDeveloperKpis = () => {
  const {
    developerKpis,
    isLoading,
    filters,
    setDeveloperKpis,
    setFilters,
    setLoading,
  } = useDeveloperKpisStore();

  const fetchDeveloperKpis = useCallback(async () => {
    setLoading(true);
    const { data } = await developerKpisApi.getDeveloperKpis(filters);
    setDeveloperKpis(data);
    setLoading(false);
  }, [filters, setDeveloperKpis, setLoading]);

  useEffect(() => {
    fetchDeveloperKpis();
  }, [fetchDeveloperKpis]);

  const updateFilters = useCallback(
    (newFilters: DeveloperKpiFilters) => {
      setFilters(newFilters);
    },
    [setFilters]
  );

  return {
    developerKpis,
    isLoading,
    filters,
    updateFilters,
    refetch: fetchDeveloperKpis,
  };
};

/**
 * Hook to get a single developer KPI with progress
 */
export const useDeveloperKpi = (id?: string) => {
  const { selectedKpi, setSelectedKpi } = useDeveloperKpisStore();

  useEffect(() => {
    if (id) {
      developerKpisApi.getDeveloperKpi(id).then(({ data }) => {
        if (data) {
          setSelectedKpi(data);
        }
      });
    }
  }, [id, setSelectedKpi]);

  return { kpi: selectedKpi };
};

/**
 * Hook to assign KPI to developer
 */
export const useAssignKpi = () => {
  const { user } = useAuthStore();
  const { addDeveloperKpi } = useDeveloperKpisStore();

  const assignKpi = useCallback(
    async (data: AssignKpiRequest) => {
      const requestWithAssigner = {
        ...data,
        assigned_by: user?.profile?.id,
      };

      const result = await developerKpisApi.assignKpi(requestWithAssigner);

      if (result.data) {
        addDeveloperKpi(result.data);
      }

      return result;
    },
    [user?.profile?.id, addDeveloperKpi]
  );

  return { assignKpi };
};

/**
 * Hook to update KPI status
 */
export const useUpdateKpiStatus = () => {
  const { updateDeveloperKpi } = useDeveloperKpisStore();

  const updateStatus = useCallback(
    async (id: string, status: 'ACTIVE' | 'COMPLETED' | 'ARCHIVED') => {
      const result = await developerKpisApi.updateKpiStatus(id, status);

      if (result.data) {
        updateDeveloperKpi(id, { status });
      }

      return result;
    },
    [updateDeveloperKpi]
  );

  return { updateStatus };
};

/**
 * Hook to delete a developer KPI
 */
export const useDeleteDeveloperKpi = () => {
  const { removeDeveloperKpi } = useDeveloperKpisStore();

  const deleteKpi = useCallback(
    async (id: string) => {
      const result = await developerKpisApi.deleteKpi(id);

      if (result.success) {
        removeDeveloperKpi(id);
      }

      return result;
    },
    [removeDeveloperKpi]
  );

  return { deleteKpi };
};

/**
 * Hook to get KPI progress
 */
export const useKpiProgress = (kpiId?: string) => {
  const [progress, setProgress] = useState<KpiOverallProgress | null>(null);
  const [isLoading, setIsLoading] = useState(!!kpiId);

  useEffect(() => {
    if (!kpiId) return;

    let isMounted = true;

    developerKpisApi.calculateProgress(kpiId).then((result) => {
      if (isMounted) {
        setProgress(result.data);
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [kpiId]);

  return { progress, isLoading };
};
