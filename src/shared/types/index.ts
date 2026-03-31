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

export const AllocationStatus = {
  BILLABLE: 'BILLABLE',
  BENCH: 'BENCH',
  INTERNAL_PROJECT: 'INTERNAL_PROJECT',
} as const;

export type AllocationStatus = typeof AllocationStatus[keyof typeof AllocationStatus];


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
  seniority_level?: string | null;
  core_skills?: string[] | null;
  industry_domains?: string[] | null;
  certifications?: string[] | null;
  allocation_status?: AllocationStatus | null;
  github_url?: string | null;
  linkedin_url?: string | null;
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
// UPSKILL RELATED TYPES
// ============================================================================

export const UpskillProgramStatus = {
  DRAFT: 'DRAFT',
  PENDING_REVIEW: 'PENDING_REVIEW',
  APPROVED: 'APPROVED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
} as const;

export type UpskillProgramStatus =
  typeof UpskillProgramStatus[keyof typeof UpskillProgramStatus];

export const UpskillModuleStatus = {
  TODO: 'TODO',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  WONT_DO: 'WONT_DO',
} as const;

export type UpskillModuleStatus =
  typeof UpskillModuleStatus[keyof typeof UpskillModuleStatus];

export const UpskillReviewDecision = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  CHANGES_REQUESTED: 'CHANGES_REQUESTED',
  AUTO_CLOSED: 'AUTO_CLOSED',
} as const;

export type UpskillReviewDecision =
  typeof UpskillReviewDecision[keyof typeof UpskillReviewDecision];

export interface UpskillContent {
  type: 'plain_text';
  text: string;
  html?: string | null;
}

export interface UpskillProgramTemplate {
  id: string;
  company_id: string;
  created_by: string;
  title: string;
  description: string | null;
  total_effort: number | null;
  is_active: boolean;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface UpskillTemplateModule {
  id: string;
  template_id: string;
  order_index: number;
  title: string;
  description: string | null;
  effort: number | null;
  content: UpskillContent | null;
  content_plain_text: string | null;
  created_at: string;
  updated_at: string;
}

export interface UpskillProgram {
  id: string;
  company_id: string;
  created_by: string;
  user_id: string;
  template_id: string | null;
  title: string;
  description: string | null;
  total_effort: number | null;
  status: UpskillProgramStatus;
  review_round: number;
  approved_by: string | null;
  approved_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  current_streak: number;
  longest_streak: number;
  last_activity_date: string | null;
  total_modules: number;
  completed_modules: number;
  created_at: string;
  updated_at: string;
}

export interface UpskillProgramModule {
  id: string;
  program_id: string;
  template_module_id: string | null;
  order_index: number;
  title: string;
  description: string | null;
  effort: number | null;
  content: UpskillContent | null;
  content_plain_text: string | null;
  status: UpskillModuleStatus;
  created_at: string;
  updated_at: string;
}

export interface UpskillProgramReview {
  id: string;
  program_id: string;
  review_round: number;
  reviewer_id: string;
  decision: UpskillReviewDecision;
  comments: string | null;
  responded_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface UpskillModuleEffortLog {
  id: string;
  program_id: string;
  module_id: string;
  user_id: string;
  effort_used: number;
  notes: string | null;
  logged_on: string;
  created_at: string;
}

export interface DeveloperUpskillStats {
  user_id: string;
  company_id: string;
  current_streak: number;
  longest_streak: number;
  last_activity_date: string | null;
  total_programs_started: number;
  total_programs_completed: number;
  created_at: string;
  updated_at: string;
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
