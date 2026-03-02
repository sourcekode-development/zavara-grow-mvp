// ============================================================================
// ENUMS
// ============================================================================

export const KpiCycleType = {
  QUARTERLY: 'QUARTERLY',
  HALF_YEARLY: 'HALF_YEARLY',
  ANNUAL: 'ANNUAL',
  CUSTOM: 'CUSTOM',
} as const;

export type KpiCycleType = (typeof KpiCycleType)[keyof typeof KpiCycleType];

export const KpiStatus = {
  ACTIVE: 'ACTIVE',
  COMPLETED: 'COMPLETED',
  ARCHIVED: 'ARCHIVED',
} as const;

export type KpiStatus = (typeof KpiStatus)[keyof typeof KpiStatus];

export const KpiReviewStatus = {
  DRAFT: 'DRAFT',
  FINALIZED: 'FINALIZED',
} as const;

export type KpiReviewStatus = (typeof KpiReviewStatus)[keyof typeof KpiReviewStatus];

export const KpiSubmissionStatus = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  CHANGES_REQUESTED: 'CHANGES_REQUESTED',
} as const;

export type KpiSubmissionStatus = (typeof KpiSubmissionStatus)[keyof typeof KpiSubmissionStatus];

// ============================================================================
// DATABASE ENTITIES
// ============================================================================

export interface KpiCategory {
  id: string;
  company_id: string | null;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface KpiTemplate {
  id: string;
  company_id: string | null;
  title: string;
  cycle_type: KpiCycleType;
  total_target_points: number;
  created_at: string;
  updated_at: string;
}

export interface KpiTemplateMetric {
  id: string;
  template_id: string;
  category_id: string;
  name: string;
  target_points: number;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface DeveloperKpi {
  id: string;
  user_id: string;
  assigned_by: string;
  title: string;
  status: KpiStatus;
  start_date: string;
  end_date?: string;
  created_at: string;
  updated_at: string;
}

export interface DeveloperKpiMetric {
  id: string;
  developer_kpi_id: string;
  category_id: string;
  name: string;
  target_points: number;
  accumulated_points: number;
  created_at: string;
  updated_at: string;
}

export interface KpiMetricSubmission {
  id: string;
  metric_id: string;
  developer_id: string;
  description: string;
  attachments?: string[] | null;
  status: KpiSubmissionStatus;
  points_awarded?: number;
  reviewer_id?: string;
  reviewer_comments?: string;
  created_at: string;
  updated_at: string;
  reviewed_at?: string;
}

export interface KpiReview {
  id: string;
  developer_kpi_id: string;
  final_score_percentage?: number;
  summary_feedback?: string;
  status: KpiReviewStatus;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// EXTENDED TYPES WITH RELATIONS
// ============================================================================

export interface KpiTemplateWithMetrics extends KpiTemplate {
  metrics: (KpiTemplateMetric & {
    category?: KpiCategory;
  })[];
  _count?: {
    metrics: number;
  };
}

export interface DeveloperKpiWithMetrics extends DeveloperKpi {
  metrics: (DeveloperKpiMetric & {
    category?: KpiCategory;
  })[];
  developer?: {
    id: string;
    full_name: string;
    email?: string;
  };
  assigner?: {
    id: string;
    full_name: string;
  };
}

export interface KpiMetricSubmissionWithDetails extends KpiMetricSubmission {
  metric?: DeveloperKpiMetric & {
    developer_kpi?: DeveloperKpi & {
      developer?: {
        id: string;
        full_name: string;
        email?: string;
      };
    };
    category?: KpiCategory;
  };
  developer?: {
    id: string;
    full_name: string;
    email?: string;
  };
  reviewer?: {
    id: string;
    full_name: string;
  };
}

// ============================================================================
// REQUEST/FORM DATA TYPES
// ============================================================================

export interface CreateCategoryRequest {
  name: string;
  description?: string;
  company_id?: string | null;
}

export interface UpdateCategoryRequest {
  name?: string;
  description?: string;
}

export interface CreateTemplateRequest {
  title: string;
  cycle_type: KpiCycleType;
  total_target_points?: number;
  company_id?: string | null;
  metrics: CreateMetricRequest[];
}

export interface UpdateTemplateRequest {
  title?: string;
  cycle_type?: KpiCycleType;
}

export interface CreateMetricRequest {
  category_id: string;
  name: string;
  target_points: number;
  description?: string;
}

export interface UpdateMetricRequest {
  name?: string;
  target_points?: number;
  description?: string;
  category_id?: string;
}

export interface AssignKpiRequest {
  user_id: string;
  template_id: string;
  start_date: string;
  end_date?: string;
}

export interface CreateSubmissionRequest {
  metric_id: string;
  developer_id: string;
  description: string;
  attachments?: string[];
}

export interface ReviewSubmissionRequest {
  status: 'APPROVED' | 'REJECTED' | 'CHANGES_REQUESTED';
  reviewed_by: string;
  reviewer_comments?: string;
  points_awarded?: number;
}

export interface FinalizeReviewRequest {
  summary_feedback?: string;
}

// ============================================================================
// FILTER & PAGINATION TYPES
// ============================================================================

export interface KpiCategoryFilters {
  search?: string;
  company_scope?: 'all' | 'global' | 'company';
}

export interface KpiTemplateFilters {
  search?: string;
  cycle_type?: KpiCycleType;
  company_scope?: 'all' | 'global' | 'company';
}

export interface DeveloperKpiFilters {
  search?: string;
  user_id?: string;
  status?: KpiStatus;
  assigned_by?: string;
  developer_name?: string;
  cycle_type?: KpiCycleType;
}

export interface KpiSubmissionFilters {
  status?: KpiSubmissionStatus;
  developer_id?: string;
  metric_id?: string;
  date_from?: string;
  date_to?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ============================================================================
// UI STATE TYPES
// ============================================================================

export interface KpiMetricProgress {
  metric_id: string;
  metric_name: string;
  category_name: string;
  target_points: number;
  accumulated_points: number;
  progress_percentage: number;
}

export interface KpiOverallProgress {
  developer_kpi_id: string;
  title: string;
  total_target_points: number;
  total_accumulated_points: number;
  progress_percentage: number;
  metrics: KpiMetricProgress[];
}

export interface TemplateFormData {
  title: string;
  cycle_type: KpiCycleType;
  total_target_points: number;
  is_global?: boolean;
  metrics: {
    category_id: string;
    name: string;
    target_points: number;
    description?: string;
  }[];
}

export interface CategoryFormData {
  name: string;
  description?: string;
}

export interface AssignKpiFormData {
  user_id: string;
  template_id: string;
  start_date: string;
  end_date?: string;
}

export interface SubmissionFormData {
  metric_id: string;
  description: string;
  attachments?: File[];
}

export interface ReviewFormData {
  status: 'APPROVED' | 'REJECTED' | 'CHANGES_REQUESTED';
  points_awarded?: number;
  reviewer_comments?: string;
}
