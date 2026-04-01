import { useCallback, useEffect, useState } from 'react';
import * as kpisApi from '../apis/kpis.api';
import type {
  AssignedKpi,
  AssignedKpiFilters,
  AvailableImpactMetric,
  Claim,
  KpiClaimsFilters,
  KpiDimension,
  KpiDimensionFilters,
  KpiMetric,
  KpiMetricFilters,
  KpiReviewer,
  KpiTemplate,
  KpiTemplateFilters,
  KpiUserSummary,
  ReviewClaimRequest,
  SubmitClaimRequest,
  SubmitImpactClaimRequest,
} from '../types';

const useAsyncLoad = <T,>(loader: () => Promise<T>, deps: unknown[]) => {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const nextData = await loader();
      setData(nextData);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    void load();
  }, [load]);

  return {
    data,
    isLoading,
    error,
    refetch: load,
  };
};

export const useKpiDimensions = (filters: KpiDimensionFilters) => {
  const state = useAsyncLoad<KpiDimension[]>(
    () => kpisApi.getDimensions(filters),
    [filters.company_id, filters.scope, filters.search]
  );

  return {
    dimensions: state.data || [],
    isLoading: state.isLoading,
    error: state.error,
    refetch: state.refetch,
  };
};

export const useKpiMetrics = (filters: KpiMetricFilters) => {
  const state = useAsyncLoad<KpiMetric[]>(
    () => kpisApi.getMetrics(filters),
    [filters.company_id, filters.scope, filters.dimension_id, filters.search]
  );

  return {
    metrics: state.data || [],
    isLoading: state.isLoading,
    error: state.error,
    refetch: state.refetch,
  };
};

export const useKpiTemplates = (filters: KpiTemplateFilters) => {
  const state = useAsyncLoad<KpiTemplate[]>(
    () => kpisApi.getTemplates(filters),
    [filters.company_id, filters.scope, filters.search]
  );

  return {
    templates: state.data || [],
    isLoading: state.isLoading,
    error: state.error,
    refetch: state.refetch,
  };
};

export const useAssignedKpis = (filters: AssignedKpiFilters) => {
  const state = useAsyncLoad<AssignedKpi[]>(
    () => kpisApi.getAssignedKpis(filters),
    [filters.company_id, filters.developer_id, filters.reviewer_id, filters.status]
  );

  return {
    kpis: state.data || [],
    isLoading: state.isLoading,
    error: state.error,
    refetch: state.refetch,
  };
};

export const useAssignedKpi = (kpiId?: string) => {
  const state = useAsyncLoad<AssignedKpi | null>(
    () => (kpiId ? kpisApi.getAssignedKpiById(kpiId) : Promise.resolve(null)),
    [kpiId]
  );

  return {
    kpi: state.data,
    isLoading: state.isLoading,
    error: state.error,
    refetch: state.refetch,
  };
};

export const useKpiUserSummary = (userId?: string) => {
  const state = useAsyncLoad<KpiUserSummary | null>(
    () => (userId ? kpisApi.getUserKpiSummary(userId) : Promise.resolve(null)),
    [userId]
  );

  return {
    summary: state.data,
    isLoading: state.isLoading,
    error: state.error,
    refetch: state.refetch,
  };
};

export const useCompanyReviewers = (
  companyId?: string,
  actorRole?: 'COMPANY_ADMIN' | 'TEAM_LEAD' | 'DEVELOPER'
) => {
  const state = useAsyncLoad<KpiReviewer[]>(
    () =>
      companyId
        ? kpisApi.getCompanyReviewers(companyId, actorRole)
        : Promise.resolve([]),
    [companyId, actorRole]
  );

  return {
    reviewers: state.data || [],
    isLoading: state.isLoading,
    error: state.error,
    refetch: state.refetch,
  };
};

export const useAvailableImpactMetrics = (companyId?: string, kpiId?: string) => {
  const state = useAsyncLoad<AvailableImpactMetric[]>(
    () =>
      companyId && kpiId
        ? kpisApi.getAvailableImpactMetrics(companyId, kpiId)
        : Promise.resolve([]),
    [companyId, kpiId]
  );

  return {
    metrics: state.data || [],
    isLoading: state.isLoading,
    error: state.error,
    refetch: state.refetch,
  };
};

export const useKpiClaimsWorkspace = (filters: KpiClaimsFilters) => {
  const state = useAsyncLoad<{ submitted: Claim[]; pendingReview: Claim[] }>(
    () => kpisApi.getClaimsWorkspace(filters),
    [filters.reviewer_id, filters.submitter_id]
  );

  return {
    submitted: state.data?.submitted || [],
    pendingReview: state.data?.pendingReview || [],
    isLoading: state.isLoading,
    error: state.error,
    refetch: state.refetch,
  };
};

export const useKpiActions = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const wrap = async <T,>(action: () => Promise<T>) => {
    setIsLoading(true);
    setError(null);
    try {
      return await action();
    } catch (actionError) {
      const message =
        actionError instanceof Error ? actionError.message : 'KPI action failed';
      setError(message);
      throw actionError;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    error,
    clearError: () => setError(null),
    createDimension: (
      actorId: string,
      actorRole: 'COMPANY_ADMIN' | 'TEAM_LEAD' | 'DEVELOPER' | undefined,
      request: Parameters<typeof kpisApi.createDimension>[2]
    ) => wrap(() => kpisApi.createDimension(actorId, actorRole, request)),
    updateDimension: (
      actorRole: 'COMPANY_ADMIN' | 'TEAM_LEAD' | 'DEVELOPER' | undefined,
      dimensionId: string,
      request: Parameters<typeof kpisApi.updateDimension>[2]
    ) => wrap(() => kpisApi.updateDimension(actorRole, dimensionId, request)),
    deleteDimension: (
      actorRole: 'COMPANY_ADMIN' | 'TEAM_LEAD' | 'DEVELOPER' | undefined,
      dimensionId: string
    ) => wrap(() => kpisApi.deleteDimension(actorRole, dimensionId)),
    createMetric: (
      actorId: string,
      actorRole: 'COMPANY_ADMIN' | 'TEAM_LEAD' | 'DEVELOPER' | undefined,
      request: Parameters<typeof kpisApi.createMetric>[2]
    ) => wrap(() => kpisApi.createMetric(actorId, actorRole, request)),
    updateMetric: (
      actorRole: 'COMPANY_ADMIN' | 'TEAM_LEAD' | 'DEVELOPER' | undefined,
      metricId: string,
      request: Parameters<typeof kpisApi.updateMetric>[2]
    ) => wrap(() => kpisApi.updateMetric(actorRole, metricId, request)),
    deleteMetric: (
      actorRole: 'COMPANY_ADMIN' | 'TEAM_LEAD' | 'DEVELOPER' | undefined,
      metricId: string
    ) => wrap(() => kpisApi.deleteMetric(actorRole, metricId)),
    createTemplate: (
      actorId: string,
      actorRole: 'COMPANY_ADMIN' | 'TEAM_LEAD' | 'DEVELOPER' | undefined,
      request: Parameters<typeof kpisApi.createTemplate>[2]
    ) => wrap(() => kpisApi.createTemplate(actorId, actorRole, request)),
    updateTemplate: (
      actorRole: 'COMPANY_ADMIN' | 'TEAM_LEAD' | 'DEVELOPER' | undefined,
      templateId: string,
      request: Parameters<typeof kpisApi.updateTemplate>[2]
    ) => wrap(() => kpisApi.updateTemplate(actorRole, templateId, request)),
    deleteTemplate: (
      actorRole: 'COMPANY_ADMIN' | 'TEAM_LEAD' | 'DEVELOPER' | undefined,
      templateId: string
    ) => wrap(() => kpisApi.deleteTemplate(actorRole, templateId)),
    assignKpi: (
      actorId: string,
      actorRole: 'COMPANY_ADMIN' | 'TEAM_LEAD' | 'DEVELOPER' | undefined,
      request: Parameters<typeof kpisApi.assignKpi>[2]
    ) => wrap(() => kpisApi.assignKpi(actorId, actorRole, request)),
    submitClaim: (submitterId: string, request: SubmitClaimRequest) =>
      wrap(() => kpisApi.submitClaim(submitterId, request)),
    submitImpactClaim: (
      actorId: string,
      submitterId: string,
      request: SubmitImpactClaimRequest
    ) => wrap(() => kpisApi.submitImpactClaim(actorId, submitterId, request)),
    reviewClaim: (actorId: string, claimId: string, request: ReviewClaimRequest) =>
      wrap(() => kpisApi.reviewClaim(actorId, claimId, request)),
  };
};
