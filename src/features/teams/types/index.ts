import type { Team, TeamMember, UserProfile } from '@/shared/types';

// ============================================================================
// EXTENDED TEAM TYPES WITH RELATIONS
// ============================================================================

export interface TeamWithDetails extends Team {
  creator?: UserProfile;
  member_count?: number;
}

export interface TeamMemberWithProfile extends TeamMember {
  profile: UserProfile;
  adder?: UserProfile;
}

export interface TeamWithMembers extends Team {
  members: TeamMemberWithProfile[];
  creator?: UserProfile;
}

// ============================================================================
// MEMBER PROGRESS TYPES
// ============================================================================

export interface MemberGoalProgress {
  goal_id: string;
  goal_title: string;
  status: string;
  progress_percentage: number;
  current_milestone?: string;
  last_updated: string;
}

export interface MemberKpiProgress {
  kpi_id: string;
  kpi_title: string;
  status: string;
  total_score_percentage: number;
  accumulated_points: number;
  target_points: number;
  last_updated: string;
}

export interface TeamMemberWithProgress extends TeamMemberWithProfile {
  recent_goal?: MemberGoalProgress;
  recent_kpi?: MemberKpiProgress;
}

// ============================================================================
// FORM DATA TYPES
// ============================================================================

export interface CreateTeamFormData {
  name: string;
  company_id: string;
}

export interface UpdateTeamFormData {
  name: string;
}

export interface AddTeamMemberFormData {
  team_id: string;
  user_id: string;
}

export interface RemoveTeamMemberFormData {
  team_id: string;
  user_id: string;
}

// ============================================================================
// FILTER & SORT TYPES
// ============================================================================

export interface TeamFilters {
  search?: string;
  created_by?: string;
  company_id?: string;
}

export type TeamSortField = 'name' | 'created_at' | 'member_count';
export type SortDirection = 'asc' | 'desc';

export interface TeamSortOptions {
  field: TeamSortField;
  direction: SortDirection;
}

// ============================================================================
// STORE STATE TYPES
// ============================================================================

export interface TeamsState {
  teams: TeamWithDetails[];
  currentTeam: TeamWithMembers | null;
  membersWithProgress: TeamMemberWithProgress[];
  isLoading: boolean;
  error: string | null;
}
