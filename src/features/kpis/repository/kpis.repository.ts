import { supabase } from '@/shared/config/supabase';
import type {
  AssignedKpi,
  AssignedKpiFilters,
  AssignedKpiDimension,
  AvailableImpactMetric,
  Claim,
  ClaimAuditLog,
  CreateDimensionRequest,
  CreateKpiTemplateRequest,
  CreateMetricRequest,
  KpiClaimsFilters,
  KpiDimension,
  KpiDimensionFilters,
  KpiMetric,
  KpiMetricFilters,
  KpiMetricProgress,
  KpiReviewer,
  KpiTemplate,
  KpiTemplateFilters,
  KpiUserSummary,
  ReviewClaimRequest,
  SubmitClaimRequest,
  TemplateDimensionMapping,
  TemplateMetricMapping,
  UpdateDimensionRequest,
  UpdateKpiTemplateRequest,
  UpdateMetricRequest,
} from '../types';

type RawUser = {
  id: string;
  full_name: string;
  email?: string | null;
  role?: string;
  company_id?: string;
};

type RawDimensionRow = {
  id: string;
  name: string;
  description: string | null;
  scope: 'PLATFORM' | 'COMPANY';
  company_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

type RawMetricRow = {
  id: string;
  dimension_id: string;
  name: string;
  description: string | null;
  how_to_measure: string | null;
  scope: 'PLATFORM' | 'COMPANY';
  company_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  dimension?: RawDimensionRow | null;
};

const pickJoinedRecord = <T,>(value: T | T[] | null | undefined): T | null => {
  if (Array.isArray(value)) {
    return value[0] || null;
  }
  return value || null;
};

type RawTemplateRow = {
  id: string;
  name: string;
  description: string | null;
  scope: 'PLATFORM' | 'COMPANY';
  company_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  creator?: RawUser | null;
};

type RawAssignedKpiRow = {
  id: string;
  developer_id: string;
  template_id: string | null;
  status: 'ACTIVE' | 'CLOSED';
  start_date: string;
  end_date: string;
  total_target_points: number;
  created_by: string;
  created_at: string;
  updated_at: string;
  developer?: RawUser | null;
  template?: RawTemplateRow | null;
};

type RawAssignedKpiInsert = {
  developer_id: string;
  template_id: string | null;
  status: 'ACTIVE' | 'CLOSED';
  start_date: string;
  end_date: string;
  total_target_points: number;
  created_by: string;
};

type RawKpiMetricRow = {
  id: string;
  kpi_id: string;
  metric_id: string;
  max_points: number;
  is_impact_metric: boolean;
  created_at: string;
  updated_at: string;
  metric?: RawMetricRow | null;
};

type RawClaimRow = {
  id: string;
  kpi_id: string;
  metric_id: string;
  submitter_id: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  evidence_text: string;
  evidence_attachments: Claim['evidence_attachments'];
  awarded_points: number | null;
  created_at: string;
  updated_at: string;
  submitter?: RawUser | null;
};

type RawTemplateDimensionRow = {
  template_id: string;
  dimension_id: string;
  weight_percentage: number;
};

type RawTemplateMetricRow = {
  template_id: string;
  metric_id: string;
  max_points: number;
};

type RawAuditLogRow = {
  id: string;
  claim_id: string;
  actor_id: string;
  action: 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'COMMENTED';
  comment_text: string | null;
  created_at: string;
  actor?: RawUser | null;
};

type RawClaimMetricMetaRow = {
  id: string;
  is_impact_metric: boolean;
  metric?: Pick<RawMetricRow, 'name'> | Array<Pick<RawMetricRow, 'name'>> | null;
};

const mapDimension = (row: RawDimensionRow): KpiDimension => ({
  ...row,
});

const mapMetric = (row: RawMetricRow): KpiMetric => ({
  id: row.id,
  dimension_id: row.dimension_id,
  name: row.name,
  description: row.description,
  how_to_measure: row.how_to_measure,
  scope: row.scope,
  company_id: row.company_id,
  created_by: row.created_by,
  created_at: row.created_at,
  updated_at: row.updated_at,
  dimension: row.dimension ? mapDimension(row.dimension) : null,
});

const mapReviewer = (row: RawUser, kpiId?: string): KpiReviewer => ({
  reviewer_id: row.id,
  kpi_id: kpiId,
  full_name: row.full_name,
  email: row.email,
  role: row.role as KpiReviewer['role'],
});

const mapTemplateBase = (row: RawTemplateRow): KpiTemplate => ({
  id: row.id,
  name: row.name,
  description: row.description,
  scope: row.scope,
  company_id: row.company_id,
  created_by: row.created_by,
  created_at: row.created_at,
  updated_at: row.updated_at,
  creator: row.creator
    ? {
        id: row.creator.id,
        full_name: row.creator.full_name,
        email: row.creator.email,
        role: row.creator.role as KpiReviewer['role'],
      }
    : null,
});

const mapClaim = (
  row: RawClaimRow,
  auditLogs: ClaimAuditLog[] = []
): Claim => ({
  id: row.id,
  kpi_id: row.kpi_id,
  kpi_metric_id: row.metric_id,
  submitter_id: row.submitter_id,
  status: row.status,
  evidence_text: row.evidence_text,
  evidence_attachments: row.evidence_attachments,
  awarded_points: row.awarded_points,
  created_at: row.created_at,
  updated_at: row.updated_at,
  submitter: row.submitter
    ? {
        id: row.submitter.id,
        full_name: row.submitter.full_name,
        email: row.submitter.email,
      }
    : null,
  audit_logs: auditLogs,
});

const mapAuditLog = (row: RawAuditLogRow): ClaimAuditLog => ({
  id: row.id,
  claim_id: row.claim_id,
  actor_id: row.actor_id,
  action: row.action,
  comment_text: row.comment_text,
  created_at: row.created_at,
  actor: row.actor
    ? {
        id: row.actor.id,
        full_name: row.actor.full_name,
        email: row.actor.email,
      }
    : null,
});

const buildAssignedKpi = (
  kpi: RawAssignedKpiRow,
  dimensions: AssignedKpiDimension[],
  reviewers: KpiReviewer[]
): AssignedKpi => {
  const metrics = dimensions.flatMap((dimension) => dimension.metrics);
  const baselineProgress = metrics
    .filter((metric) => !metric.is_impact_metric)
    .reduce((sum, metric) => sum + metric.approved_points, 0);
  const bonusProgress = metrics
    .filter((metric) => metric.is_impact_metric)
    .reduce((sum, metric) => sum + metric.approved_points, 0);

  return {
    id: kpi.id,
    developer_id: kpi.developer_id,
    template_id: kpi.template_id,
    status: kpi.status,
    start_date: kpi.start_date,
    end_date: kpi.end_date,
    total_target_points: kpi.total_target_points,
    created_by: kpi.created_by,
    created_at: kpi.created_at,
    updated_at: kpi.updated_at,
    baseline_progress: baselineProgress,
    bonus_progress: bonusProgress,
    display_score: baselineProgress + bonusProgress,
    developer: kpi.developer
      ? {
          id: kpi.developer.id,
          full_name: kpi.developer.full_name,
          email: kpi.developer.email,
          role: kpi.developer.role as KpiReviewer['role'],
        }
      : null,
    template: kpi.template ? mapTemplateBase(kpi.template) : null,
    reviewers,
    dimensions,
  };
};

const groupRowsByKey = <T>(rows: T[], getKey: (row: T) => string) =>
  rows.reduce<Record<string, T[]>>((accumulator, row) => {
    const key = getKey(row);
    accumulator[key] = accumulator[key] || [];
    accumulator[key].push(row);
    return accumulator;
  }, {});

export const getDimensions = async (
  filters: KpiDimensionFilters = {}
): Promise<KpiDimension[]> => {
  let query = supabase.from('dimensions').select('*').order('name');

  if (filters.scope && filters.scope !== 'ALL') {
    query = query.eq('scope', filters.scope);
  }

  if (filters.company_id) {
    query = query.or(`scope.eq.PLATFORM,company_id.eq.${filters.company_id}`);
  }

  if (filters.search) {
    query = query.or(
      `name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
    );
  }

  const { data, error } = await query;
  if (error) throw error;

  const dimensionRows = (data || []) as RawDimensionRow[];
  const dimensionIds = dimensionRows.map((row) => row.id);

  const [{ data: metricsData }, { data: templateData }] = await Promise.all([
    dimensionIds.length
      ? supabase
          .from('metrics')
          .select('dimension_id')
          .in('dimension_id', dimensionIds)
      : Promise.resolve({ data: [] as Array<{ dimension_id: string }> }),
    dimensionIds.length
      ? supabase
          .from('template_dimensions')
          .select('dimension_id')
          .in('dimension_id', dimensionIds)
      : Promise.resolve({ data: [] as Array<{ dimension_id: string }> }),
  ]);

  const metricsCount = (metricsData || []).reduce<Record<string, number>>(
    (accumulator, item) => {
      accumulator[item.dimension_id] = (accumulator[item.dimension_id] || 0) + 1;
      return accumulator;
    },
    {}
  );
  const templateCount = (templateData || []).reduce<Record<string, number>>(
    (accumulator, item) => {
      accumulator[item.dimension_id] = (accumulator[item.dimension_id] || 0) + 1;
      return accumulator;
    },
    {}
  );

  return dimensionRows.map((row) => ({
    ...mapDimension(row),
    metrics_count: metricsCount[row.id] || 0,
    templates_count: templateCount[row.id] || 0,
  }));
};

export const createDimension = async (
  createdBy: string,
  request: CreateDimensionRequest
): Promise<KpiDimension> => {
  const payload = {
    ...request,
    description: request.description || null,
    company_id: request.scope === 'COMPANY' ? request.company_id || null : null,
    created_by: createdBy,
  };

  const { data, error } = await supabase
    .from('dimensions')
    .insert(payload)
    .select()
    .single();

  if (error) throw error;
  return mapDimension(data as RawDimensionRow);
};

export const updateDimension = async (
  dimensionId: string,
  request: UpdateDimensionRequest
): Promise<KpiDimension> => {
  const payload = {
    ...request,
    description: request.description ?? null,
    company_id:
      request.scope === 'COMPANY'
        ? request.company_id ?? null
        : request.scope === 'PLATFORM'
          ? null
          : undefined,
  };

  const { data, error } = await supabase
    .from('dimensions')
    .update(payload)
    .eq('id', dimensionId)
    .select()
    .single();

  if (error) throw error;
  return mapDimension(data as RawDimensionRow);
};

export const deleteDimension = async (dimensionId: string) => {
  const { error } = await supabase.from('dimensions').delete().eq('id', dimensionId);
  if (error) throw error;
};

export const getMetrics = async (
  filters: KpiMetricFilters = {}
): Promise<KpiMetric[]> => {
  let query = supabase
    .from('metrics')
    .select(`
      *,
      dimension:dimensions(*)
    `)
    .order('name');

  if (filters.scope && filters.scope !== 'ALL') {
    query = query.eq('scope', filters.scope);
  }

  if (filters.company_id) {
    query = query.or(`scope.eq.PLATFORM,company_id.eq.${filters.company_id}`);
  }

  if (filters.dimension_id) {
    query = query.eq('dimension_id', filters.dimension_id);
  }

  if (filters.search) {
    query = query.or(
      `name.ilike.%${filters.search}%,description.ilike.%${filters.search}%,how_to_measure.ilike.%${filters.search}%`
    );
  }

  const { data, error } = await query;
  if (error) throw error;

  return ((data || []) as RawMetricRow[]).map(mapMetric);
};

export const createMetric = async (
  createdBy: string,
  request: CreateMetricRequest
): Promise<KpiMetric> => {
  const payload = {
    ...request,
    description: request.description || null,
    how_to_measure: request.how_to_measure || null,
    company_id: request.scope === 'COMPANY' ? request.company_id || null : null,
    created_by: createdBy,
  };

  const { data, error } = await supabase
    .from('metrics')
    .insert(payload)
    .select(`
      *,
      dimension:dimensions(*)
    `)
    .single();

  if (error) throw error;
  return mapMetric(data as RawMetricRow);
};

export const updateMetric = async (
  metricId: string,
  request: UpdateMetricRequest
): Promise<KpiMetric> => {
  const payload = {
    ...request,
    description: request.description ?? null,
    how_to_measure: request.how_to_measure ?? null,
    company_id:
      request.scope === 'COMPANY'
        ? request.company_id ?? null
        : request.scope === 'PLATFORM'
          ? null
          : undefined,
  };

  const { data, error } = await supabase
    .from('metrics')
    .update(payload)
    .eq('id', metricId)
    .select(`
      *,
      dimension:dimensions(*)
    `)
    .single();

  if (error) throw error;
  return mapMetric(data as RawMetricRow);
};

export const deleteMetric = async (metricId: string) => {
  const { error } = await supabase.from('metrics').delete().eq('id', metricId);
  if (error) throw error;
};

const loadTemplateMappings = async (templateIds: string[]) => {
  if (templateIds.length === 0) {
    return {
      dimensions: {} as Record<string, TemplateDimensionMapping[]>,
      metrics: {} as Record<string, TemplateMetricMapping[]>,
    };
  }

  const [{ data: dimensionsData, error: dimensionsError }, { data: metricsData, error: metricsError }] =
    await Promise.all([
      supabase
        .from('template_dimensions')
        .select(`
          template_id,
          dimension_id,
          weight_percentage,
          dimension:dimensions(*)
        `)
        .in('template_id', templateIds),
      supabase
        .from('template_metrics')
        .select(`
          template_id,
          metric_id,
          max_points,
          metric:metrics(
            *,
            dimension:dimensions(*)
          )
        `)
        .in('template_id', templateIds),
    ]);

  if (dimensionsError) throw dimensionsError;
  if (metricsError) throw metricsError;

  const groupedDimensions = ((dimensionsData || []) as unknown as Array<{
    template_id: string;
    dimension_id: string;
    weight_percentage: number;
    dimension?: RawDimensionRow | RawDimensionRow[] | null;
  }>).reduce<Record<string, TemplateDimensionMapping[]>>((accumulator, row) => {
    accumulator[row.template_id] = accumulator[row.template_id] || [];
    accumulator[row.template_id].push({
      template_id: row.template_id,
      dimension_id: row.dimension_id,
      weight_percentage: Number(row.weight_percentage),
      dimension: pickJoinedRecord(row.dimension)
        ? mapDimension(pickJoinedRecord(row.dimension) as RawDimensionRow)
        : null,
    });
    return accumulator;
  }, {});

  const groupedMetrics = ((metricsData || []) as unknown as Array<{
    template_id: string;
    metric_id: string;
    max_points: number;
    metric?: RawMetricRow | RawMetricRow[] | null;
  }>).reduce<Record<string, TemplateMetricMapping[]>>((accumulator, row) => {
    accumulator[row.template_id] = accumulator[row.template_id] || [];
    accumulator[row.template_id].push({
      template_id: row.template_id,
      metric_id: row.metric_id,
      max_points: Number(row.max_points),
      metric: pickJoinedRecord(row.metric)
        ? mapMetric(pickJoinedRecord(row.metric) as RawMetricRow)
        : null,
    });
    return accumulator;
  }, {});

  return {
    dimensions: groupedDimensions,
    metrics: groupedMetrics,
  };
};

export const getTemplates = async (
  filters: KpiTemplateFilters = {}
): Promise<KpiTemplate[]> => {
  let query = supabase
    .from('kpi_templates')
    .select(`
      *,
      creator:user_profiles!kpi_templates_created_by_fkey(
        id,
        full_name,
        email,
        role
      )
    `)
    .order('updated_at', { ascending: false });

  if (filters.scope && filters.scope !== 'ALL') {
    query = query.eq('scope', filters.scope);
  }

  if (filters.company_id) {
    query = query.or(`scope.eq.PLATFORM,company_id.eq.${filters.company_id}`);
  }

  if (filters.search) {
    query = query.or(
      `name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
    );
  }

  const { data, error } = await query;
  if (error) throw error;

  const templates = (data || []) as RawTemplateRow[];
  const templateIds = templates.map((template) => template.id);
  const mappings = await loadTemplateMappings(templateIds);

  return templates.map((template) => ({
    ...mapTemplateBase(template),
    dimensions: mappings.dimensions[template.id] || [],
    metrics: mappings.metrics[template.id] || [],
  }));
};

export const getTemplateById = async (templateId: string): Promise<KpiTemplate> => {
  const { data, error } = await supabase
    .from('kpi_templates')
    .select(`
      *,
      creator:user_profiles!kpi_templates_created_by_fkey(
        id,
        full_name,
        email,
        role
      )
    `)
    .eq('id', templateId)
    .single();

  if (error) throw error;

  const base = mapTemplateBase(data as RawTemplateRow);
  const mappings = await loadTemplateMappings([templateId]);

  return {
    ...base,
    dimensions: mappings.dimensions[templateId] || [],
    metrics: mappings.metrics[templateId] || [],
  };
};

export const createTemplate = async (
  actorId: string,
  request: CreateKpiTemplateRequest
): Promise<KpiTemplate> => {
  const { data, error } = await supabase
    .from('kpi_templates')
    .insert({
      name: request.name,
      description: request.description || null,
      scope: request.scope,
      company_id: request.scope === 'COMPANY' ? request.company_id || null : null,
      created_by: actorId,
    })
    .select()
    .single();

  if (error) throw error;

  const templateId = (data as RawTemplateRow).id;

  const inserts = [];
  if (request.dimensions.length > 0) {
    inserts.push(
      supabase.from('template_dimensions').insert(
        request.dimensions.map((dimension) => ({
          template_id: templateId,
          dimension_id: dimension.dimension_id,
          weight_percentage: dimension.weight_percentage,
        }))
      )
    );
  }
  if (request.metrics.length > 0) {
    inserts.push(
      supabase.from('template_metrics').insert(
        request.metrics.map((metric) => ({
          template_id: templateId,
          metric_id: metric.metric_id,
          max_points: metric.max_points,
        }))
      )
    );
  }

  if (inserts.length > 0) {
    const results = await Promise.all(inserts);
    const failed = results.find((result) => result.error);
    if (failed?.error) throw failed.error;
  }

  return getTemplateById(templateId);
};

export const updateTemplate = async (
  templateId: string,
  request: UpdateKpiTemplateRequest
): Promise<KpiTemplate> => {
  const templatePayload = {
    name: request.name,
    description: request.description ?? null,
    scope: request.scope,
    company_id:
      request.scope === 'COMPANY'
        ? request.company_id ?? null
        : request.scope === 'PLATFORM'
          ? null
          : undefined,
  };

  const { error } = await supabase
    .from('kpi_templates')
    .update(templatePayload)
    .eq('id', templateId);

  if (error) throw error;

  if (request.dimensions) {
    const { error: deleteDimensionsError } = await supabase
      .from('template_dimensions')
      .delete()
      .eq('template_id', templateId);
    if (deleteDimensionsError) throw deleteDimensionsError;

    if (request.dimensions.length > 0) {
      const { error: insertDimensionsError } = await supabase
        .from('template_dimensions')
        .insert(
          request.dimensions.map((dimension) => ({
            template_id: templateId,
            dimension_id: dimension.dimension_id,
            weight_percentage: dimension.weight_percentage,
          }))
        );
      if (insertDimensionsError) throw insertDimensionsError;
    }
  }

  if (request.metrics) {
    const { error: deleteMetricsError } = await supabase
      .from('template_metrics')
      .delete()
      .eq('template_id', templateId);
    if (deleteMetricsError) throw deleteMetricsError;

    if (request.metrics.length > 0) {
      const { error: insertMetricsError } = await supabase
        .from('template_metrics')
        .insert(
          request.metrics.map((metric) => ({
            template_id: templateId,
            metric_id: metric.metric_id,
            max_points: metric.max_points,
          }))
        );
      if (insertMetricsError) throw insertMetricsError;
    }
  }

  return getTemplateById(templateId);
};

export const deleteTemplate = async (templateId: string) => {
  const { error } = await supabase.from('kpi_templates').delete().eq('id', templateId);
  if (error) throw error;
};

export const getCompanyReviewers = async (
  companyId: string
): Promise<KpiReviewer[]> => {
  const { data, error } = await supabase
    .from('user_profiles')
      .select('id, full_name, email, role, company_id')
    .eq('company_id', companyId)
    .order('full_name');

  if (error) throw error;

  return ((data || []) as RawUser[]).map((reviewer) => mapReviewer(reviewer));
};

export const getUserProfile = async (userId: string): Promise<RawUser | null> => {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('id, full_name, email, role, company_id')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw error;
  return (data as RawUser | null) || null;
};

export const getTemplateMappings = async (templateId: string) => {
  const [{ data: dimensionsData, error: dimensionsError }, { data: metricsData, error: metricsError }] =
    await Promise.all([
      supabase
        .from('template_dimensions')
        .select('template_id, dimension_id, weight_percentage')
        .eq('template_id', templateId),
      supabase
        .from('template_metrics')
        .select('template_id, metric_id, max_points')
        .eq('template_id', templateId),
    ]);

  if (dimensionsError) throw dimensionsError;
  if (metricsError) throw metricsError;

  return {
    dimensions: (dimensionsData || []) as RawTemplateDimensionRow[],
    metrics: (metricsData || []) as RawTemplateMetricRow[],
  };
};

export const createAssignedKpi = async (
  payload: RawAssignedKpiInsert
): Promise<string> => {
  const { data, error } = await supabase
    .from('assigned_kpis')
    .insert(payload)
    .select('id')
    .single();

  if (error) throw error;
  return (data as { id: string }).id;
};

export const insertAssignedKpiDimensions = async (
  kpiId: string,
  dimensions: Array<{ dimension_id: string; weight_percentage: number }>
) => {
  if (dimensions.length === 0) return;

  const { error } = await supabase.from('kpi_dimensions').insert(
    dimensions.map((dimension) => ({
      kpi_id: kpiId,
      dimension_id: dimension.dimension_id,
      weight_percentage: dimension.weight_percentage,
    }))
  );

  if (error) throw error;
};

export const insertAssignedKpiMetrics = async (
  kpiId: string,
  metrics: Array<{ metric_id: string; max_points: number; is_impact_metric?: boolean }>
) => {
  if (metrics.length === 0) return;

  const { error } = await supabase.from('kpi_metrics').insert(
    metrics.map((metric) => ({
      kpi_id: kpiId,
      metric_id: metric.metric_id,
      max_points: metric.max_points,
      is_impact_metric: metric.is_impact_metric || false,
    }))
  );

  if (error) throw error;
};

export const insertKpiReviewers = async (kpiId: string, reviewerIds: string[]) => {
  if (reviewerIds.length === 0) return;

  const dedupedReviewerIds = [...new Set(reviewerIds)];
  const { error } = await supabase.from('kpi_reviewers').insert(
    dedupedReviewerIds.map((reviewerId) => ({
      kpi_id: kpiId,
      reviewer_id: reviewerId,
    }))
  );

  if (error) throw error;
};

export const assignKpiFromTemplate = async (
  payload: RawAssignedKpiInsert
): Promise<string> => {
  return createAssignedKpi(payload);
};

const loadAssignedKpiGraph = async (kpiIds: string[]) => {
  if (kpiIds.length === 0) {
    return {
      reviewersByKpi: {} as Record<string, KpiReviewer[]>,
      dimensionsByKpi: {} as Record<string, AssignedKpiDimension[]>,
    };
  }

  const [
    reviewersResponse,
    kpiDimensionsResponse,
    kpiMetricsResponse,
    claimsResponse,
  ] = await Promise.all([
    supabase
      .from('kpi_reviewers')
      .select(`
        kpi_id,
        reviewer:user_profiles!kpi_reviewers_reviewer_id_fkey(
          id,
          full_name,
          email,
          role
        )
      `)
      .in('kpi_id', kpiIds),
    supabase
      .from('kpi_dimensions')
      .select(`
        kpi_id,
        dimension_id,
        weight_percentage,
        dimension:dimensions(*)
      `)
      .in('kpi_id', kpiIds),
    supabase
      .from('kpi_metrics')
      .select(`
        id,
        kpi_id,
        metric_id,
        max_points,
        is_impact_metric,
        created_at,
        updated_at,
        metric:metrics(
          *,
          dimension:dimensions(*)
        )
      `)
      .in('kpi_id', kpiIds),
    supabase
      .from('claims')
      .select(`
        *,
        submitter:user_profiles!claims_submitter_id_fkey(
          id,
          full_name,
          email
        )
      `)
      .in('kpi_id', kpiIds)
      .order('created_at', { ascending: false }),
  ]);

  if (reviewersResponse.error) throw reviewersResponse.error;
  if (kpiDimensionsResponse.error) throw kpiDimensionsResponse.error;
  if (kpiMetricsResponse.error) throw kpiMetricsResponse.error;
  if (claimsResponse.error) throw claimsResponse.error;

  const reviewerRows = (reviewersResponse.data || []) as unknown as Array<{
    kpi_id: string;
    reviewer?: RawUser | RawUser[] | null;
  }>;
  const dimensionRows = (kpiDimensionsResponse.data || []) as unknown as Array<{
    kpi_id: string;
    dimension_id: string;
    weight_percentage: number;
    dimension?: RawDimensionRow | RawDimensionRow[] | null;
  }>;
  const metricRows = (kpiMetricsResponse.data || []) as unknown as Array<
    Omit<RawKpiMetricRow, 'metric'> & { metric?: RawMetricRow | RawMetricRow[] | null }
  >;
  const claimRows = (claimsResponse.data || []) as RawClaimRow[];

  const claimIds = claimRows.map((claim) => claim.id);
  let auditRows: RawAuditLogRow[] = [];
  if (claimIds.length > 0) {
    const { data, error } = await supabase
      .from('claim_audit_logs')
      .select(`
        *,
        actor:user_profiles!claim_audit_logs_actor_id_fkey(
          id,
          full_name,
          email
        )
      `)
      .in('claim_id', claimIds)
      .order('created_at');
    if (error) throw error;
    auditRows = (data || []) as RawAuditLogRow[];
  }

  const auditsByClaim = groupRowsByKey(auditRows, (row) => row.claim_id);
  const claimsByMetric = claimRows.reduce<Record<string, Claim[]>>((accumulator, row) => {
    accumulator[row.metric_id] = accumulator[row.metric_id] || [];
    accumulator[row.metric_id].push(
      mapClaim(
        row,
        (auditsByClaim[row.id] || []).map(mapAuditLog)
      )
    );
    return accumulator;
  }, {});

  const metricsByKpi = metricRows.reduce<Record<string, KpiMetricProgress[]>>(
    (accumulator, row) => {
      const metricClaims = claimsByMetric[row.id] || [];
      const approvedPoints = metricClaims
        .filter((claim) => claim.status === 'APPROVED')
        .reduce((sum, claim) => sum + (claim.awarded_points || 0), 0);
      const joinedMetric = pickJoinedRecord(row.metric);
      const metric: KpiMetricProgress = {
        ...(joinedMetric ? mapMetric(joinedMetric as RawMetricRow) : ({} as KpiMetric)),
        kpi_metric_id: row.id,
        max_points: row.max_points,
        approved_points: approvedPoints,
        remaining_points: Math.max(row.max_points - approvedPoints, 0),
        is_fully_awarded: approvedPoints >= row.max_points,
        is_impact_metric: row.is_impact_metric,
        claims: metricClaims,
      };
      accumulator[row.kpi_id] = accumulator[row.kpi_id] || [];
      accumulator[row.kpi_id].push(metric);
      return accumulator;
    },
    {}
  );

  const dimensionsByKpi = dimensionRows.reduce<Record<string, AssignedKpiDimension[]>>(
    (accumulator, row) => {
      const metrics = (metricsByKpi[row.kpi_id] || []).filter(
        (metric) => metric.dimension_id === row.dimension_id
      );
      accumulator[row.kpi_id] = accumulator[row.kpi_id] || [];
      accumulator[row.kpi_id].push({
        dimension_id: row.dimension_id,
        weight_percentage: Number(row.weight_percentage),
        dimension: pickJoinedRecord(row.dimension)
          ? mapDimension(pickJoinedRecord(row.dimension) as RawDimensionRow)
          : mapDimension({
          id: row.dimension_id,
          name: 'Unknown Dimension',
          description: null,
          scope: 'COMPANY',
          company_id: null,
          created_by: null,
          created_at: '',
          updated_at: '',
        }),
        metrics,
      });
      return accumulator;
    },
    {}
  );

  for (const [kpiId, metrics] of Object.entries(metricsByKpi)) {
    const orphanImpactMetrics = metrics.filter(
      (metric) =>
        metric.is_impact_metric &&
        !(dimensionsByKpi[kpiId] || []).some(
          (dimension) => dimension.dimension_id === metric.dimension_id
        )
    );

    orphanImpactMetrics.forEach((metric) => {
      const dimension = metric.dimension || {
        id: metric.dimension_id,
        name: 'Impact Metrics',
        description: null,
        scope: 'COMPANY',
        company_id: null,
        created_by: null,
        created_at: '',
        updated_at: '',
      };
      dimensionsByKpi[kpiId] = dimensionsByKpi[kpiId] || [];
      const existing = dimensionsByKpi[kpiId].find(
        (entry) => entry.dimension_id === dimension.id
      );
      if (existing) {
        existing.metrics.push(metric);
      } else {
        dimensionsByKpi[kpiId].push({
          dimension_id: dimension.id,
          weight_percentage: 0,
          dimension,
          metrics: [metric],
        });
      }
    });
  }

  const reviewersByKpi = reviewerRows.reduce<Record<string, KpiReviewer[]>>(
    (accumulator, row) => {
      accumulator[row.kpi_id] = accumulator[row.kpi_id] || [];
      const reviewer = pickJoinedRecord(row.reviewer);
      if (reviewer) {
        accumulator[row.kpi_id].push(mapReviewer(reviewer, row.kpi_id));
      }
      return accumulator;
    },
    {}
  );

  Object.values(dimensionsByKpi).forEach((dimensionGroups) =>
    dimensionGroups.sort((left, right) => left.dimension.name.localeCompare(right.dimension.name))
  );

  return {
    reviewersByKpi,
    dimensionsByKpi,
  };
};

export const getAssignedKpis = async (
  filters: AssignedKpiFilters = {}
): Promise<AssignedKpi[]> => {
  let query = supabase
    .from('assigned_kpis')
    .select(`
      *,
      developer:user_profiles!assigned_kpis_developer_id_fkey(
        id,
        full_name,
        email,
        role,
        company_id
      ),
      template:kpi_templates(
        *,
        creator:user_profiles!kpi_templates_created_by_fkey(
          id,
          full_name,
          email,
          role
        )
      )
    `)
    .order('created_at', { ascending: false });

  if (filters.developer_id) {
    query = query.eq('developer_id', filters.developer_id);
  }

  if (filters.status && filters.status !== 'ALL') {
    query = query.eq('status', filters.status);
  }

  const { data, error } = await query;
  if (error) throw error;

  let kpiRows = (data || []) as RawAssignedKpiRow[];

  if (filters.company_id) {
    kpiRows = kpiRows.filter(
      (row) => row.developer?.company_id === filters.company_id
    );
  }

  if (filters.reviewer_id) {
    const { data: reviewerRows, error: reviewerError } = await supabase
      .from('kpi_reviewers')
      .select('kpi_id')
      .eq('reviewer_id', filters.reviewer_id);
    if (reviewerError) throw reviewerError;
    const reviewerKpiIds = new Set(
      ((reviewerRows || []) as Array<{ kpi_id: string }>).map((row) => row.kpi_id)
    );
    kpiRows = kpiRows.filter((row) => reviewerKpiIds.has(row.id));
  }

  const graph = await loadAssignedKpiGraph(kpiRows.map((row) => row.id));

  return kpiRows.map((row) =>
    buildAssignedKpi(
      row,
      graph.dimensionsByKpi[row.id] || [],
      graph.reviewersByKpi[row.id] || []
    )
  );
};

const attachAuditLogsToClaims = async (claims: Claim[]): Promise<Claim[]> => {
  if (claims.length === 0) return claims;

  const auditLogs = await getClaimAuditLogs(claims.map((claim) => claim.id));
  const auditLogsByClaimId = groupRowsByKey(auditLogs, (log) => log.claim_id);

  return claims.map((claim) => ({
    ...claim,
    audit_logs: auditLogsByClaimId[claim.id] || [],
  }));
};

const attachMetricMetaToClaims = async (claims: Claim[]): Promise<Claim[]> => {
  if (claims.length === 0) return claims;

  const kpiMetricIds = [...new Set(claims.map((claim) => claim.kpi_metric_id))];
  const { data, error } = await supabase
    .from('kpi_metrics')
    .select(`
      id,
      is_impact_metric,
      metric:metrics(
        name
      )
    `)
    .in('id', kpiMetricIds);

  if (error) throw error;

  const metricMetaById = ((data || []) as RawClaimMetricMetaRow[]).reduce<
    Record<string, { metric_name: string | null; is_impact_metric: boolean }>
  >((accumulator, row) => {
    const joinedMetric = pickJoinedRecord(row.metric);
    accumulator[row.id] = {
      metric_name: joinedMetric?.name || null,
      is_impact_metric: row.is_impact_metric,
    };
    return accumulator;
  }, {});

  return claims.map((claim) => ({
    ...claim,
    metric_name: metricMetaById[claim.kpi_metric_id]?.metric_name || null,
    is_impact_metric: metricMetaById[claim.kpi_metric_id]?.is_impact_metric || false,
  }));
};

export const getAssignedKpiById = async (kpiId: string): Promise<AssignedKpi> => {
  const { data, error } = await supabase
    .from('assigned_kpis')
    .select(`
      *,
      developer:user_profiles!assigned_kpis_developer_id_fkey(
        id,
        full_name,
        email,
        role,
        company_id
      ),
      template:kpi_templates(
        *,
        creator:user_profiles!kpi_templates_created_by_fkey(
          id,
          full_name,
          email,
          role
        )
      )
    `)
    .eq('id', kpiId)
    .single();

  if (error) throw error;

  const kpi = data as RawAssignedKpiRow;
  const graph = await loadAssignedKpiGraph([kpi.id]);

  return buildAssignedKpi(
    kpi,
    graph.dimensionsByKpi[kpi.id] || [],
    graph.reviewersByKpi[kpi.id] || []
  );
};

export const getUserKpiSummary = async (userId: string): Promise<KpiUserSummary> => {
  const kpis = await getAssignedKpis({ developer_id: userId });
  const active = kpis.find((kpi) => kpi.status === 'ACTIVE') || null;

  return {
    total_kpis: kpis.length,
    active_kpis: kpis.filter((kpi) => kpi.status === 'ACTIVE').length,
    current_active_kpi: active,
  };
};

export const submitClaim = async (
  submitterId: string,
  request: SubmitClaimRequest
): Promise<Claim> => {
  const { data, error } = await supabase
    .from('claims')
    .insert({
      kpi_id: request.kpi_id,
      metric_id: request.kpi_metric_id,
      submitter_id: submitterId,
      evidence_text: request.evidence_text,
      evidence_attachments: request.evidence_attachments || null,
      status: 'PENDING',
    })
    .select(`
      *,
      submitter:user_profiles!claims_submitter_id_fkey(
        id,
        full_name,
        email
      )
    `)
    .single();

  if (error) throw error;

  const claim = data as RawClaimRow;

  const { error: auditError } = await supabase.from('claim_audit_logs').insert({
    claim_id: claim.id,
    actor_id: submitterId,
    action: 'SUBMITTED',
    comment_text: null,
  });
  if (auditError) throw auditError;

  return mapClaim(claim);
};

export const getAvailableImpactMetrics = async (
  kpiId: string,
  companyId: string
): Promise<AvailableImpactMetric[]> => {
  const [{ data: attachedMetricsData, error: attachedError }, { data: metricsData, error: metricsError }] =
    await Promise.all([
      supabase.from('kpi_metrics').select('metric_id').eq('kpi_id', kpiId),
      supabase
        .from('metrics')
        .select(`
          *,
          dimension:dimensions(*)
        `)
        .or(`scope.eq.PLATFORM,company_id.eq.${companyId}`)
        .order('name'),
    ]);

  if (attachedError) throw attachedError;
  if (metricsError) throw metricsError;

  const attachedMetricIds = new Set(
    ((attachedMetricsData || []) as Array<{ metric_id: string }>).map((row) => row.metric_id)
  );

  return ((metricsData || []) as RawMetricRow[])
    .filter((metric) => !attachedMetricIds.has(metric.id))
    .map((metric) => ({
      ...mapMetric(metric),
      default_max_points: 100,
    }));
};

export const createImpactMetric = async (
  kpiId: string,
  metricId: string,
  maxPoints = 100
): Promise<string> => {
  const { data, error } = await supabase
    .from('kpi_metrics')
    .insert({
      kpi_id: kpiId,
      metric_id: metricId,
      max_points: maxPoints,
      is_impact_metric: true,
    })
    .select('id')
    .single();

  if (error) throw error;
  return (data as { id: string }).id;
};

export const submitImpactClaim = async (
  submitterId: string,
  request: SubmitClaimRequest
): Promise<string> => {
  const { data, error } = await supabase
    .from('claims')
    .insert({
      kpi_id: request.kpi_id,
      metric_id: request.kpi_metric_id,
      submitter_id: submitterId,
      evidence_text: request.evidence_text,
      evidence_attachments: request.evidence_attachments || null,
      status: 'PENDING',
    })
    .select('id')
    .single();

  if (error) throw error;
  return (data as { id: string }).id;
};

export const getClaimsForSubmitter = async (
  submitterId: string
): Promise<Claim[]> => {
  const { data, error } = await supabase
    .from('claims')
    .select(`
      *,
      submitter:user_profiles!claims_submitter_id_fkey(
        id,
        full_name,
        email
      )
    `)
    .eq('submitter_id', submitterId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  const claims = ((data || []) as RawClaimRow[]).map((claim) => mapClaim(claim));
  return attachAuditLogsToClaims(await attachMetricMetaToClaims(claims));
};

export const getClaimsForReviewer = async (
  reviewerId: string
): Promise<Claim[]> => {
  const { data: reviewerKpiRows, error: reviewerError } = await supabase
    .from('kpi_reviewers')
    .select('kpi_id')
    .eq('reviewer_id', reviewerId);

  if (reviewerError) throw reviewerError;

  const kpiIds = ((reviewerKpiRows || []) as Array<{ kpi_id: string }>).map((row) => row.kpi_id);
  if (kpiIds.length === 0) return [];

  const { data, error } = await supabase
    .from('claims')
    .select(`
      *,
      submitter:user_profiles!claims_submitter_id_fkey(
        id,
        full_name,
        email
      )
    `)
    .in('kpi_id', kpiIds)
    .eq('status', 'PENDING')
    .order('created_at', { ascending: false });

  if (error) throw error;

  const claims = ((data || []) as RawClaimRow[]).map((claim) => mapClaim(claim));
  return attachAuditLogsToClaims(await attachMetricMetaToClaims(claims));
};

export const getClaimAuditLogs = async (claimIds: string[]): Promise<ClaimAuditLog[]> => {
  if (claimIds.length === 0) return [];

  const { data, error } = await supabase
    .from('claim_audit_logs')
    .select(`
      *,
      actor:user_profiles!claim_audit_logs_actor_id_fkey(
        id,
        full_name,
        email
      )
    `)
    .in('claim_id', claimIds)
    .order('created_at');

  if (error) throw error;
  return ((data || []) as RawAuditLogRow[]).map(mapAuditLog);
};

export const reviewClaim = async (
  claimId: string,
  payload: {
    status: ReviewClaimRequest['status'];
    awarded_points: number | null;
  }
): Promise<Claim> => {
  const { data, error } = await supabase
    .from('claims')
    .update({
      status: payload.status,
      awarded_points: payload.awarded_points,
    })
    .eq('id', claimId)
    .select(`
      *,
      submitter:user_profiles!claims_submitter_id_fkey(
        id,
        full_name,
        email
      )
    `)
    .single();

  if (error) throw error;
  return mapClaim(data as RawClaimRow);
};

export const createClaimAuditLog = async (
  claimId: string,
  actorId: string,
  action: ClaimAuditLog['action'],
  commentText?: string | null
) => {
  const { error } = await supabase.from('claim_audit_logs').insert({
    claim_id: claimId,
    actor_id: actorId,
    action,
    comment_text: commentText || null,
  });

  if (error) throw error;
};

export const getClaimById = async (claimId: string): Promise<Claim | null> => {
  const { data, error } = await supabase
    .from('claims')
    .select(`
      *,
      submitter:user_profiles!claims_submitter_id_fkey(
        id,
        full_name,
        email
      )
    `)
    .eq('id', claimId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const [claimWithMeta] = await attachMetricMetaToClaims([mapClaim(data as RawClaimRow)]);
  const [claimWithLogs] = await attachAuditLogsToClaims([claimWithMeta]);
  return claimWithLogs;
};

export const getKpiReviewers = async (kpiId: string): Promise<string[]> => {
  const { data, error } = await supabase
    .from('kpi_reviewers')
    .select('reviewer_id')
    .eq('kpi_id', kpiId);

  if (error) throw error;
  return ((data || []) as Array<{ reviewer_id: string }>).map((row) => row.reviewer_id);
};

export const getKpiMetricById = async (kpiMetricId: string) => {
  const { data, error } = await supabase
    .from('kpi_metrics')
    .select('id, kpi_id, metric_id, max_points, is_impact_metric')
    .eq('id', kpiMetricId)
    .maybeSingle();

  if (error) throw error;
  return (data as {
    id: string;
    kpi_id: string;
    metric_id: string;
    max_points: number;
    is_impact_metric: boolean;
  } | null) || null;
};

export const getApprovedPointsForKpiMetric = async (kpiMetricId: string): Promise<number> => {
  const { data, error } = await supabase
    .from('claims')
    .select('awarded_points')
    .eq('metric_id', kpiMetricId)
    .eq('status', 'APPROVED');

  if (error) throw error;

  return ((data || []) as Array<{ awarded_points: number | null }>).reduce(
    (sum, row) => sum + (row.awarded_points || 0),
    0
  );
};

export const getClaimsWorkspace = async (
  filters: KpiClaimsFilters
): Promise<{
  submitted: Claim[];
  pendingReview: Claim[];
}> => {
  const [submitted, pendingReview] = await Promise.all([
    filters.submitter_id ? getClaimsForSubmitter(filters.submitter_id) : Promise.resolve([]),
    filters.reviewer_id ? getClaimsForReviewer(filters.reviewer_id) : Promise.resolve([]),
  ]);

  return {
    submitted,
    pendingReview,
  };
};
