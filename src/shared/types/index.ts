// ============================================================================
// ENUMS (Using const objects for strict TS compatibility)
// ============================================================================

export const UserRole = {
  COMPANY_ADMIN: 'COMPANY_ADMIN',
  TEAM_LEAD: 'TEAM_LEAD',
  DEVELOPER: 'DEVELOPER',
} as const;

export type UserRole = typeof UserRole[keyof typeof UserRole];

export const InviteStatus = {
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED',
  EXPIRED: 'EXPIRED',
  REVOKED: 'REVOKED',
} as const;

export type InviteStatus = typeof InviteStatus[keyof typeof InviteStatus];

// ============================================================================
// DATABASE ENTITIES
// ============================================================================

export interface Company {
  id: string;
  name: string;
  created_at: string;
}

export interface UserProfile {
  id: string;
  company_id: string;
  full_name: string;
  role: UserRole;
  email?: string;
  created_at?: string;
}

export interface CompanyInvite {
  id: string;
  company_id: string;
  email: string;
  role: UserRole;
  invited_by: string;
  token: string;
  status: InviteStatus;
  expires_at: string;
  created_at: string;
  company?: Company;
  inviter?: UserProfile;
}

export interface Team {
  id: string;
  company_id: string;
  name: string;
  created_by: string;
  created_at: string;
}

export interface TeamMember {
  team_id: string;
  user_id: string;
  added_by?: string;
  joined_at: string;
}

// ============================================================================
// AUTH RELATED TYPES
// ============================================================================

export interface AuthUser {
  id: string;
  email: string;
  profile?: UserProfile;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupData {
  full_name: string;
  email: string;
  password: string;
  confirm_password: string;
}

export interface CompanyCreationData {
  company_name: string;
  user_data: SignupData;
}

export interface SignupCheckResult {
  hasAccount: boolean;
  hasInvite: boolean;
  invite?: CompanyInvite;
}

export interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  success: boolean;
}

export interface AuthResponse {
  user: AuthUser;
  profile: UserProfile;
}

// ============================================================================
// KPI RELATED TYPES
// ============================================================================

export const KpiCycleType = {
  QUARTERLY: 'QUARTERLY',
  HALF_YEARLY: 'HALF_YEARLY',
  ANNUALLY: 'ANNUALLY',
  CUSTOM: 'CUSTOM',
} as const;

export type KpiCycleType = typeof KpiCycleType[keyof typeof KpiCycleType];

export const KpiStatus = {
  DRAFT: 'DRAFT',
  ACTIVE: 'ACTIVE',
  ARCHIVED: 'ARCHIVED',
} as const;

export type KpiStatus = typeof KpiStatus[keyof typeof KpiStatus];

export const KpiReviewStatus = {
  DRAFT: 'DRAFT',
  SUBMITTED: 'SUBMITTED',
  ACKNOWLEDGED_BY_DEV: 'ACKNOWLEDGED_BY_DEV',
} as const;

export type KpiReviewStatus = typeof KpiReviewStatus[keyof typeof KpiReviewStatus];

export interface KpiTemplate {
  id: string;
  company_id: string | null;
  title: string;
  description: string | null;
  cycle_type: KpiCycleType;
  created_at: string;
  updated_at: string;
}

export interface KpiTemplateMetric {
  id: string;
  template_id: string;
  name: string;
  weightage_percentage: number;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface DeveloperKpi {
  id: string;
  user_id: string;
  assigned_by: string;
  original_template_id: string | null;
  title: string;
  cycle_type: KpiCycleType;
  start_date: string;
  end_date: string | null;
  status: KpiStatus;
  created_at: string;
  updated_at: string;
}

export interface DeveloperKpiMetric {
  id: string;
  developer_kpi_id: string;
  name: string;
  weightage_percentage: number;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface KpiReview {
  id: string;
  developer_kpi_id: string;
  reviewer_id: string;
  review_period_label: string;
  status: KpiReviewStatus;
  final_score: number | null;
  manager_summary: string | null;
  created_at: string;
  updated_at: string;
}

export interface KpiReviewScore {
  id: string;
  review_id: string;
  metric_id: string;
  rating: number;
  calculated_value: number;
  comments: string | null;
  created_at: string;
  updated_at: string;
}

// Extended types with joined data for UI
export interface DeveloperKpiWithMetrics extends DeveloperKpi {
  metrics?: DeveloperKpiMetric[];
  developer?: UserProfile;
  assigner?: UserProfile;
}

export interface KpiReviewWithDetails extends KpiReview {
  developer?: UserProfile;
  reviewer?: UserProfile;
  developer_kpi?: DeveloperKpiWithMetrics;
  scores?: (KpiReviewScore & { metric?: DeveloperKpiMetric })[];
}

export interface KpiReviewListItem {
  id: string;
  developer_name: string;
  reviewer_name: string;
  review_period_label: string;
  status: KpiReviewStatus;
  final_score: number | null;
  created_at: string;
  kpi_title: string;
}
