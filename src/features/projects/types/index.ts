import type { UserRole } from '@/shared/types';

export const ProjectKind = {
  CLIENT_DELIVERY: 'CLIENT_DELIVERY',
  INTERNAL_PRODUCT: 'INTERNAL_PRODUCT',
  INTERNAL_INITIATIVE: 'INTERNAL_INITIATIVE',
} as const;

export type ProjectKind = typeof ProjectKind[keyof typeof ProjectKind];

export const ProjectStatus = {
  ACTIVE: 'ACTIVE',
  ON_HOLD: 'ON_HOLD',
  COMPLETED: 'COMPLETED',
  ARCHIVED: 'ARCHIVED',
} as const;

export type ProjectStatus = typeof ProjectStatus[keyof typeof ProjectStatus];

export const ProjectMemberRole = {
  DEVELOPER: 'DEVELOPER',
  PROJECT_MANAGER: 'PROJECT_MANAGER',
  DELIVERY_OWNER: 'DELIVERY_OWNER',
} as const;

export type ProjectMemberRole =
  typeof ProjectMemberRole[keyof typeof ProjectMemberRole];

export interface ProjectUserSummary {
  id: string;
  full_name: string;
  email?: string | null;
  role: UserRole;
}

export interface Client {
  id: string;
  company_id: string;
  name: string;
  description: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  company_id: string;
  client_id: string | null;
  name: string;
  description: string | null;
  project_kind: ProjectKind;
  status: ProjectStatus;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectMember {
  id: string;
  project_id: string;
  user_id: string;
  project_role: ProjectMemberRole;
  joined_at: string;
  left_at: string | null;
  is_primary_reviewer: boolean;
  assigned_by: string;
  removed_by: string | null;
  removed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClientWithStats extends Client {
  project_count: number;
  creator?: ProjectUserSummary;
}

export interface ProjectWithClient extends Project {
  client?: Client | null;
  creator?: ProjectUserSummary;
  active_member_count: number;
  total_member_count: number;
}

export interface ProjectMemberWithProfile extends ProjectMember {
  profile: ProjectUserSummary;
  assigned_by_profile?: ProjectUserSummary;
  removed_by_profile?: ProjectUserSummary | null;
}

export interface ProjectWithDetails extends ProjectWithClient {
  active_members: ProjectMemberWithProfile[];
  member_history: ProjectMemberWithProfile[];
}

export interface CreateClientRequest {
  company_id: string;
  name: string;
  description?: string;
}

export interface UpdateClientRequest {
  name?: string;
  description?: string | null;
}

export interface CreateProjectRequest {
  company_id: string;
  client_id?: string | null;
  name: string;
  description?: string;
  project_kind: ProjectKind;
  status: ProjectStatus;
}

export interface UpdateProjectRequest {
  client_id?: string | null;
  name?: string;
  description?: string | null;
  project_kind?: ProjectKind;
  status?: ProjectStatus;
}

export interface CreateProjectMemberRequest {
  project_id: string;
  user_id: string;
  project_role: ProjectMemberRole;
  joined_at: string;
  is_primary_reviewer: boolean;
}

export interface UpdateProjectMemberRequest {
  project_role?: ProjectMemberRole;
  joined_at?: string;
  left_at?: string | null;
  is_primary_reviewer?: boolean;
}

export interface RemoveProjectMemberRequest {
  project_member_id: string;
  left_at: string;
}

export interface ProjectFilters {
  search?: string;
}

export interface ClientFilters {
  search?: string;
}

export interface ProjectsState {
  projects: ProjectWithClient[];
  clients: ClientWithStats[];
  currentProject: ProjectWithDetails | null;
  availableUsers: ProjectUserSummary[];
  isLoading: boolean;
  error: string | null;
}
