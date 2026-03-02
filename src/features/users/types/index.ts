import type { UserProfile, CompanyInvite, UserRole, InviteStatus } from '@/shared/types';

// ============================================================================
// INVITE MANAGEMENT TYPES
// ============================================================================

export interface CreateInviteRequest {
  email: string;
  role: UserRole;
  company_id: string;
  invited_by: string;
}

export interface InviteWithDetails extends Omit<CompanyInvite, 'inviter'> {
  inviter?: {
    full_name: string;
    email: string;
  };
}

export interface InviteFilters {
  status?: InviteStatus;
  startDate?: string;
  endDate?: string;
}

// ============================================================================
// USER MANAGEMENT TYPES
// ============================================================================

export interface UserWithTeams extends UserProfile {
  teams?: {
    id: string;
    name: string;
  }[];
}

export interface UserFilters {
  search?: string;
  role?: UserRole;
  page?: number;
  limit?: number;
}

export interface PaginatedUsers {
  users: UserWithTeams[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ============================================================================
// FORM DATA TYPES
// ============================================================================

export interface InviteFormData {
  email: string;
  role: UserRole;
}
