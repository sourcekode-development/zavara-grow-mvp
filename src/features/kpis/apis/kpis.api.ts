import type { UserRole } from '@/shared/types';
import * as kpisRepo from '../repository/kpis.repository';
import type {
  AssignedKpi,
  AssignedKpiFilters,
  AvailableImpactMetric,
  Claim,
  CreateDimensionRequest,
  CreateKpiTemplateRequest,
  CreateMetricRequest,
  KpiClaimsFilters,
  KpiDimensionFilters,
  KpiMetricFilters,
  KpiReviewer,
  KpiTemplateFilters,
  KpiUserSummary,
  ReviewClaimRequest,
  SubmitClaimRequest,
  SubmitImpactClaimRequest,
  UpdateDimensionRequest,
  UpdateKpiTemplateRequest,
  UpdateMetricRequest,
} from '../types';

const canManageKpis = (role?: UserRole) =>
  role === 'COMPANY_ADMIN' || role === 'TEAM_LEAD';

const assertTemplateMath = (
  dimensions: Array<{ weight_percentage: number }>,
  metrics: Array<{ max_points: number }>
) => {
  const dimensionTotal = dimensions.reduce(
    (sum, dimension) => sum + Number(dimension.weight_percentage),
    0
  );
  const metricTotal = metrics.reduce((sum, metric) => sum + Number(metric.max_points), 0);

  if (dimensionTotal !== 100) {
    throw new Error(`Dimension weights must total exactly 100. Current total: ${dimensionTotal}`);
  }

  if (metricTotal !== 1000) {
    throw new Error(`Standard metric points must total exactly 1000. Current total: ${metricTotal}`);
  }
};

const assertManagerRole = (role?: UserRole) => {
  if (!canManageKpis(role)) {
    throw new Error('Only company admins and team leads can manage KPI libraries and assignments');
  }
};

export const getDimensions = (filters?: KpiDimensionFilters) =>
  kpisRepo.getDimensions(filters);

export const createDimension = (
  actorId: string,
  actorRole: UserRole | undefined,
  request: CreateDimensionRequest
) => {
  assertManagerRole(actorRole);
  if (request.scope !== 'COMPANY') {
    throw new Error('Platform dimensions are read-only in this MVP');
  }
  return kpisRepo.createDimension(actorId, request);
};

export const updateDimension = (
  actorRole: UserRole | undefined,
  dimensionId: string,
  request: UpdateDimensionRequest
) => {
  assertManagerRole(actorRole);
  if (request.scope === 'PLATFORM') {
    throw new Error('Platform dimensions are read-only in this MVP');
  }
  return kpisRepo.updateDimension(dimensionId, request);
};

export const deleteDimension = (
  actorRole: UserRole | undefined,
  dimensionId: string
) => {
  assertManagerRole(actorRole);
  return kpisRepo.deleteDimension(dimensionId);
};

export const getMetrics = (filters?: KpiMetricFilters) =>
  kpisRepo.getMetrics(filters);

export const createMetric = (
  actorId: string,
  actorRole: UserRole | undefined,
  request: CreateMetricRequest
) => {
  assertManagerRole(actorRole);
  if (request.scope !== 'COMPANY') {
    throw new Error('Platform metrics are read-only in this MVP');
  }
  return kpisRepo.createMetric(actorId, request);
};

export const updateMetric = (
  actorRole: UserRole | undefined,
  metricId: string,
  request: UpdateMetricRequest
) => {
  assertManagerRole(actorRole);
  if (request.scope === 'PLATFORM') {
    throw new Error('Platform metrics are read-only in this MVP');
  }
  return kpisRepo.updateMetric(metricId, request);
};

export const deleteMetric = (
  actorRole: UserRole | undefined,
  metricId: string
) => {
  assertManagerRole(actorRole);
  return kpisRepo.deleteMetric(metricId);
};

export const getTemplates = (filters?: KpiTemplateFilters) =>
  kpisRepo.getTemplates(filters);

export const getTemplateById = (templateId: string) =>
  kpisRepo.getTemplateById(templateId);

export const createTemplate = (
  actorId: string,
  actorRole: UserRole | undefined,
  request: CreateKpiTemplateRequest
) => {
  assertManagerRole(actorRole);
  if (request.scope !== 'COMPANY') {
    throw new Error('Platform templates are read-only in this MVP');
  }
  assertTemplateMath(request.dimensions, request.metrics);
  return kpisRepo.createTemplate(actorId, request);
};

export const updateTemplate = (
  actorRole: UserRole | undefined,
  templateId: string,
  request: UpdateKpiTemplateRequest
) => {
  return (async () => {
    assertManagerRole(actorRole);
    if (request.scope === 'PLATFORM') {
      throw new Error('Platform templates are read-only in this MVP');
    }
    const existingTemplate = await kpisRepo.getTemplateById(templateId);
    const nextDimensions = request.dimensions || existingTemplate.dimensions || [];
    const nextMetrics = request.metrics || existingTemplate.metrics || [];
    assertTemplateMath(nextDimensions, nextMetrics);
    return kpisRepo.updateTemplate(templateId, request);
  })();
};

export const deleteTemplate = (
  actorRole: UserRole | undefined,
  templateId: string
) => {
  assertManagerRole(actorRole);
  return kpisRepo.deleteTemplate(templateId);
};

export const getCompanyReviewers = (
  companyId: string,
  actorRole: UserRole | undefined
): Promise<KpiReviewer[]> => {
  assertManagerRole(actorRole);
  return kpisRepo.getCompanyReviewers(companyId);
};

export const assignKpi = async (
  actorId: string,
  actorRole: UserRole | undefined,
  request: {
    developer_id: string;
    template_id: string;
    start_date: string;
    end_date: string;
    reviewer_ids: string[];
  }
) => {
  assertManagerRole(actorRole);
  const [actor, developer, template, reviewers, existingSummary] = await Promise.all([
    kpisRepo.getUserProfile(actorId),
    kpisRepo.getUserProfile(request.developer_id),
    kpisRepo.getTemplateById(request.template_id),
    Promise.all(request.reviewer_ids.map((reviewerId) => kpisRepo.getUserProfile(reviewerId))),
    kpisRepo.getUserKpiSummary(request.developer_id),
  ]);

  if (!actor || !developer) {
    throw new Error('Actor or developer not found');
  }

  if (developer.company_id !== actor.company_id) {
    throw new Error('Developer must belong to the same company as the actor');
  }

  if (existingSummary.current_active_kpi) {
    throw new Error('This developer already has an active KPI');
  }

  if (request.reviewer_ids.length === 0) {
    throw new Error('At least one reviewer is required');
  }

  if (reviewers.some((reviewer) => !reviewer || reviewer.company_id !== actor.company_id)) {
    throw new Error('All reviewers must belong to the same company as the actor');
  }

  if (template.scope === 'COMPANY' && template.company_id !== actor.company_id) {
    throw new Error('Template must belong to the same company as the actor');
  }

  assertTemplateMath(template.dimensions || [], template.metrics || []);

  const newKpiId = await kpisRepo.assignKpiFromTemplate({
    developer_id: request.developer_id,
    template_id: request.template_id,
    status: 'ACTIVE',
    start_date: request.start_date,
    end_date: request.end_date,
    total_target_points: 1000,
    created_by: actorId,
  });

  await Promise.all([
    kpisRepo.insertAssignedKpiDimensions(
      newKpiId,
      (template.dimensions || []).map((dimension) => ({
        dimension_id: dimension.dimension_id,
        weight_percentage: dimension.weight_percentage,
      }))
    ),
    kpisRepo.insertAssignedKpiMetrics(
      newKpiId,
      (template.metrics || []).map((metric) => ({
        metric_id: metric.metric_id,
        max_points: metric.max_points,
        is_impact_metric: false,
      }))
    ),
  ]);

  await kpisRepo.insertKpiReviewers(newKpiId, request.reviewer_ids);

  return newKpiId;
};

export const getAssignedKpis = (filters?: AssignedKpiFilters): Promise<AssignedKpi[]> =>
  kpisRepo.getAssignedKpis(filters);

export const getAssignedKpiById = (kpiId: string) =>
  kpisRepo.getAssignedKpiById(kpiId);

export const getUserKpiSummary = (userId: string): Promise<KpiUserSummary> =>
  kpisRepo.getUserKpiSummary(userId);

export const submitClaim = async (
  submitterId: string,
  request: SubmitClaimRequest
): Promise<Claim> => {
  if (!request.evidence_text.trim()) {
    throw new Error('Evidence is required');
  }
  const kpi = await kpisRepo.getAssignedKpiById(request.kpi_id);
  const metric = kpi.dimensions
    .flatMap((dimension) => dimension.metrics)
    .find((item) => item.kpi_metric_id === request.kpi_metric_id);

  if (!metric) {
    throw new Error('Metric not found in this KPI');
  }

  if (kpi.status !== 'ACTIVE') {
    throw new Error('Claims can only be submitted for active KPIs');
  }

  if (metric.remaining_points <= 0) {
    throw new Error('This metric has no remaining points available');
  }

  return kpisRepo.submitClaim(submitterId, request);
};

export const getAvailableImpactMetrics = async (
  companyId: string,
  kpiId: string
): Promise<AvailableImpactMetric[]> =>
  kpisRepo.getAvailableImpactMetrics(kpiId, companyId);

export const submitImpactClaim = async (
  actorId: string,
  submitterId: string,
  request: SubmitImpactClaimRequest
) => {
  if (!request.evidence_text.trim()) {
    throw new Error('Evidence is required');
  }
  const [actor, kpi] = await Promise.all([
    kpisRepo.getUserProfile(actorId),
    kpisRepo.getAssignedKpiById(request.kpi_id),
  ]);

  if (!actor) {
    throw new Error('Actor not found');
  }

  if (kpi.status !== 'ACTIVE') {
    throw new Error('Impact claims can only be submitted for active KPIs');
  }

  if (kpi.developer && kpi.developer.id) {
    const developer = await kpisRepo.getUserProfile(kpi.developer.id);
    if (!developer || developer.company_id !== actor.company_id) {
      throw new Error('Actor must belong to the same company as the KPI developer');
    }
  }

  const availableMetrics = await kpisRepo.getAvailableImpactMetrics(
    request.kpi_id,
    actor.company_id || ''
  );
  const selectedMetric = availableMetrics.find(
    (metric) => metric.id === request.source_metric_id
  );

  if (!selectedMetric) {
    throw new Error('Selected metric is not available for this KPI');
  }

  const newKpiMetricId = await kpisRepo.createImpactMetric(
    request.kpi_id,
    request.source_metric_id,
    selectedMetric.default_max_points
  );
  const claimId = await kpisRepo.submitImpactClaim(submitterId, {
    kpi_id: request.kpi_id,
    kpi_metric_id: newKpiMetricId,
    evidence_text: request.evidence_text,
    evidence_attachments: request.evidence_attachments,
  });
  await kpisRepo.createClaimAuditLog(claimId, actorId, 'SUBMITTED', null);

  return claimId;
};

export const getClaimsWorkspace = (filters: KpiClaimsFilters) =>
  kpisRepo.getClaimsWorkspace(filters);

export const reviewClaim = (
  actorId: string,
  requestId: string,
  request: ReviewClaimRequest
) => {
  return (async () => {
    const [actor, claim] = await Promise.all([
      kpisRepo.getUserProfile(actorId),
      kpisRepo.getClaimById(requestId),
    ]);

    if (!actor || !claim) {
      throw new Error('Actor or claim not found');
    }

    if (claim.status !== 'PENDING') {
      throw new Error('Only pending claims can be reviewed');
    }

    const reviewerIds = await kpisRepo.getKpiReviewers(claim.kpi_id);
    if (!reviewerIds.includes(actorId)) {
      throw new Error('Only assigned reviewers can review this claim');
    }

    const kpiMetric = await kpisRepo.getKpiMetricById(claim.kpi_metric_id);
    if (!kpiMetric) {
      throw new Error('KPI metric not found');
    }

    let awardedPoints: number | null = null;
    if (request.status === 'APPROVED') {
      if (!request.awarded_points || request.awarded_points <= 0) {
        throw new Error('Approved claims need a positive point value');
      }
      const approvedPoints = await kpisRepo.getApprovedPointsForKpiMetric(claim.kpi_metric_id);
      const remainingPoints = Math.max(kpiMetric.max_points - approvedPoints, 0);
      if (request.awarded_points > remainingPoints) {
        throw new Error(
          `Approved points exceed remaining points for this metric. Remaining: ${remainingPoints}`
        );
      }
      awardedPoints = request.awarded_points;
    }

    await kpisRepo.reviewClaim(requestId, {
      status: request.status,
      awarded_points: awardedPoints,
    });
    await kpisRepo.createClaimAuditLog(
      requestId,
      actorId,
      request.status === 'APPROVED' ? 'APPROVED' : 'REJECTED',
      request.comment_text || null
    );
  })();
};
