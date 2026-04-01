import type { ApiResponse, UserRole } from '@/shared/types';

export const KpiScope = {
  PLATFORM: 'PLATFORM',
  COMPANY: 'COMPANY',
} as const;

export type KpiScope = typeof KpiScope[keyof typeof KpiScope];

export const KpiStatus = {
  ACTIVE: 'ACTIVE',
  CLOSED: 'CLOSED',
} as const;

export type KpiStatus = typeof KpiStatus[keyof typeof KpiStatus];

export const ClaimStatus = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
} as const;

export type ClaimStatus = typeof ClaimStatus[keyof typeof ClaimStatus];

export const AuditAction = {
  SUBMITTED: 'SUBMITTED',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  COMMENTED: 'COMMENTED',
} as const;

export type AuditAction = typeof AuditAction[keyof typeof AuditAction];

export interface KpiDimension {
  id: string;
  name: string;
  description: string | null;
  scope: KpiScope;
  company_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  metrics_count?: number;
  templates_count?: number;
}

export interface KpiMetric {
  id: string;
  dimension_id: string;
  name: string;
  description: string | null;
  how_to_measure: string | null;
  scope: KpiScope;
  company_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  dimension?: KpiDimension | null;
  templates_count?: number;
}

export interface TemplateDimensionMapping {
  template_id: string;
  dimension_id: string;
  weight_percentage: number;
  dimension?: KpiDimension | null;
}

export interface TemplateMetricMapping {
  template_id: string;
  metric_id: string;
  max_points: number;
  metric?: KpiMetric | null;
}

export interface KpiTemplate {
  id: string;
  name: string;
  description: string | null;
  scope: KpiScope;
  company_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  dimensions?: TemplateDimensionMapping[];
  metrics?: TemplateMetricMapping[];
  creator?: {
    id: string;
    full_name: string;
    email?: string | null;
    role?: UserRole;
  } | null;
}

export interface KpiReviewer {
  reviewer_id: string;
  kpi_id?: string;
  full_name: string;
  email?: string | null;
  role?: UserRole;
}

export interface ClaimAuditLog {
  id: string;
  claim_id: string;
  actor_id: string;
  action: AuditAction;
  comment_text: string | null;
  created_at: string;
  actor?: {
    id: string;
    full_name: string;
    email?: string | null;
  } | null;
}

export interface Claim {
  id: string;
  kpi_id: string;
  kpi_metric_id: string;
  submitter_id: string;
  status: ClaimStatus;
  evidence_text: string;
  evidence_attachments: Array<{
    type: string;
    url: string;
    name: string;
  }> | null;
  awarded_points: number | null;
  created_at: string;
  updated_at: string;
  submitter?: {
    id: string;
    full_name: string;
    email?: string | null;
  } | null;
  metric_name?: string | null;
  is_impact_metric?: boolean;
  audit_logs?: ClaimAuditLog[];
}

export interface KpiMetricProgress extends KpiMetric {
  kpi_metric_id: string;
  max_points: number;
  approved_points: number;
  remaining_points: number;
  is_fully_awarded: boolean;
  is_impact_metric: boolean;
  claims: Claim[];
}

export interface AssignedKpiDimension {
  dimension_id: string;
  weight_percentage: number;
  dimension: KpiDimension;
  metrics: KpiMetricProgress[];
}

export interface AssignedKpi {
  id: string;
  developer_id: string;
  template_id: string | null;
  status: KpiStatus;
  start_date: string;
  end_date: string;
  total_target_points: number;
  created_by: string;
  created_at: string;
  updated_at: string;
  baseline_progress: number;
  bonus_progress: number;
  display_score: number;
  developer?: {
    id: string;
    full_name: string;
    email?: string | null;
    role?: UserRole;
  } | null;
  template?: KpiTemplate | null;
  reviewers: KpiReviewer[];
  dimensions: AssignedKpiDimension[];
}

export interface KpiClaimQueueItem extends Claim {
  kpi?: AssignedKpi | null;
  metric?: KpiMetricProgress | null;
}

export interface KpiDashboardSummary {
  total_kpis: number;
  active_kpis: number;
  pending_claims_for_review: number;
  submitted_claims: number;
}

export interface KpiDimensionFilters {
  company_id?: string;
  scope?: KpiScope | 'ALL';
  search?: string;
}

export interface KpiMetricFilters {
  company_id?: string;
  scope?: KpiScope | 'ALL';
  dimension_id?: string;
  search?: string;
}

export interface KpiTemplateFilters {
  company_id?: string;
  scope?: KpiScope | 'ALL';
  search?: string;
}

export interface AssignedKpiFilters {
  company_id?: string;
  developer_id?: string;
  reviewer_id?: string;
  status?: KpiStatus | 'ALL';
}

export interface KpiClaimsFilters {
  reviewer_id?: string;
  submitter_id?: string;
}

export interface CreateDimensionRequest {
  name: string;
  description?: string;
  scope: KpiScope;
  company_id?: string | null;
}

export type UpdateDimensionRequest = Partial<CreateDimensionRequest>;

export interface CreateMetricRequest {
  dimension_id: string;
  name: string;
  description?: string;
  how_to_measure?: string;
  scope: KpiScope;
  company_id?: string | null;
}

export type UpdateMetricRequest = Partial<CreateMetricRequest>;

export interface KpiTemplateDimensionInput {
  dimension_id: string;
  weight_percentage: number;
}

export interface KpiTemplateMetricInput {
  metric_id: string;
  max_points: number;
}

export interface CreateKpiTemplateRequest {
  name: string;
  description?: string;
  scope: KpiScope;
  company_id?: string | null;
  dimensions: KpiTemplateDimensionInput[];
  metrics: KpiTemplateMetricInput[];
}

export type UpdateKpiTemplateRequest = Partial<CreateKpiTemplateRequest>;

export interface AssignKpiRequest {
  developer_id: string;
  template_id: string;
  start_date: string;
  end_date: string;
  reviewer_ids: string[];
}

export interface SubmitClaimRequest {
  kpi_id: string;
  kpi_metric_id: string;
  evidence_text: string;
  evidence_attachments?: Array<{
    type: string;
    url: string;
    name: string;
  }> | null;
}

export interface SubmitImpactClaimRequest {
  kpi_id: string;
  source_metric_id: string;
  evidence_text: string;
  evidence_attachments?: Array<{
    type: string;
    url: string;
    name: string;
  }> | null;
}

export interface ReviewClaimRequest {
  status: Extract<ClaimStatus, 'APPROVED' | 'REJECTED'>;
  awarded_points?: number | null;
  comment_text?: string;
}

export interface AvailableImpactMetric extends KpiMetric {
  default_max_points: number;
}

export interface KpiUserSummary {
  total_kpis: number;
  active_kpis: number;
  current_active_kpi: AssignedKpi | null;
}

export type KpiApiResponse<T> = ApiResponse<T>;
