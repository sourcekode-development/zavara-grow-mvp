/* eslint-disable @typescript-eslint/no-explicit-any */
import * as teamsRepo from '../repository/teams.repository';
import type { ApiResponse, UserRole } from '@/shared/types';
import type {
  TeamWithDetails,
  TeamWithMembers,
  TeamMemberWithProfile,
  TeamMemberWithProgress,
  CreateTeamFormData,
  UpdateTeamFormData,
  AddTeamMemberFormData,
  MemberGoalProgress,
  MemberKpiProgress,
} from '../types';

/**
 * TEAMS API LAYER
 * 🚨 CRITICAL: This layer consumes the repository layer.
 * Components/Hooks should ONLY interact with this layer, never directly with repository.
 * During NestJS migration, we'll replace these functions with axios/fetch calls.
 */

// ============================================================================
// TEAMS CRUD
// ============================================================================

export const getTeamsForUser = async (
  userId: string,
  companyId: string,
  role: UserRole
): Promise<ApiResponse<TeamWithDetails[]>> => {
  try {
    let teams;

    if (role === 'COMPANY_ADMIN') {
      // Admin sees all company teams
      teams = await teamsRepo.getAllTeamsByCompany(companyId);
    } else if (role === 'TEAM_LEAD') {
      // Team Lead sees all company teams (can only edit their own)
      teams = await teamsRepo.getAllTeamsByCompany(companyId);
    } else {
      // Developer sees only teams they're a member of
      teams = await teamsRepo.getTeamsByUserId(userId);
    }

    return {
      success: true,
      data: teams,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to fetch teams',
    };
  }
};

export const getTeamById = async (
  teamId: string
): Promise<ApiResponse<TeamWithDetails>> => {
  try {
    const team = await teamsRepo.getTeamById(teamId);

    return {
      success: true,
      data: team,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to fetch team',
    };
  }
};

export const getTeamWithMembers = async (
  teamId: string
): Promise<ApiResponse<TeamWithMembers>> => {
  try {
    const team = await teamsRepo.getTeamById(teamId);
    const members = await teamsRepo.getTeamMembers(teamId);

    return {
      success: true,
      data: {
        ...team,
        members,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to fetch team with members',
    };
  }
};

export const createTeam = async (
  teamData: CreateTeamFormData,
  createdBy: string
): Promise<ApiResponse<TeamWithDetails>> => {
  try {
    const team = await teamsRepo.createTeam({
      ...teamData,
      created_by: createdBy,
    });

    return {
      success: true,
      data: team,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to create team',
    };
  }
};

export const updateTeam = async (
  teamId: string,
  updates: UpdateTeamFormData,
  userId: string,
  role: UserRole
): Promise<ApiResponse<TeamWithDetails>> => {
  try {
    // Check permissions
    if (role !== 'COMPANY_ADMIN') {
      const team = await teamsRepo.getTeamById(teamId);
      if (team.created_by !== userId) {
        return {
          success: false,
          error: 'You can only edit teams you created',
        };
      }
    }

    const updatedTeam = await teamsRepo.updateTeam(teamId, updates);

    return {
      success: true,
      data: updatedTeam,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to update team',
    };
  }
};

export const deleteTeam = async (
  teamId: string,
  userId: string,
  role: UserRole
): Promise<ApiResponse<void>> => {
  try {
    // Check permissions
    if (role !== 'COMPANY_ADMIN') {
      const team = await teamsRepo.getTeamById(teamId);
      if (team.created_by !== userId) {
        return {
          success: false,
          error: 'You can only delete teams you created',
        };
      }
    }

    await teamsRepo.deleteTeam(teamId);

    return {
      success: true,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to delete team',
    };
  }
};

// ============================================================================
// TEAM MEMBERS
// ============================================================================

export const getTeamMembers = async (
  teamId: string
): Promise<ApiResponse<TeamMemberWithProfile[]>> => {
  try {
    const members = await teamsRepo.getTeamMembers(teamId);

    return {
      success: true,
      data: members,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to fetch team members',
    };
  }
};

export const getTeamMembersWithProgress = async (
  teamId: string
): Promise<ApiResponse<TeamMemberWithProgress[]>> => {
  try {
    const members = await teamsRepo.getTeamMembers(teamId);

    // Fetch progress for each member
    const membersWithProgress = await Promise.all(
      members.map(async (member) => {
        try {
          const [goalData, kpiData] = await Promise.all([
            teamsRepo.getMemberRecentGoal(member.user_id),
            teamsRepo.getMemberRecentKpi(member.user_id),
          ]);

          let recentGoal: MemberGoalProgress | undefined;
          let recentKpi: MemberKpiProgress | undefined;

          if (goalData) {
            // Calculate progress percentage based on completed sessions
            const totalSessions = goalData.total_sessions || 0;
            const completedSessions = goalData.completed_sessions || 0;
            
            const progressPercentage = totalSessions > 0 
              ? Math.round((completedSessions / totalSessions) * 100)
              : 0;

            recentGoal = {
              goal_id: goalData.id,
              goal_title: goalData.title,
              status: goalData.status,
              progress_percentage: progressPercentage,
              last_updated: goalData.start_date || new Date().toISOString(),
            };
          }

          if (kpiData) {
            // Calculate accumulated points from metrics
            const metrics = (kpiData as any).metrics || [];
            const totalAccumulated = metrics.reduce(
              (sum: number, m: any) => sum + (m.accumulated_points || 0),
              0
            );
            const totalTarget = metrics.reduce(
              (sum: number, m: any) => sum + (m.target_points || 0),
              0
            );
            
            const scorePercentage = totalTarget > 0
              ? Math.round((totalAccumulated / totalTarget) * 100)
              : 0;

            recentKpi = {
              kpi_id: kpiData.id,
              kpi_title: kpiData.title,
              status: kpiData.status,
              total_score_percentage: scorePercentage,
              accumulated_points: totalAccumulated,
              target_points: totalTarget || 1000,
              last_updated: kpiData.start_date || new Date().toISOString(),
            };
          }

          return {
            ...member,
            recent_goal: recentGoal,
            recent_kpi: recentKpi,
          };
        } catch {
          // If progress fetch fails, return member without progress
          return {
            ...member,
            recent_goal: undefined,
            recent_kpi: undefined,
          };
        }
      })
    );

    return {
      success: true,
      data: membersWithProgress,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to fetch team members with progress',
    };
  }
};

export const addTeamMember = async (
  memberData: AddTeamMemberFormData,
  addedBy: string
): Promise<ApiResponse<TeamMemberWithProfile>> => {
  try {
    // Check if user is already a member
    const isMember = await teamsRepo.checkTeamMembership(
      memberData.team_id,
      memberData.user_id
    );

    if (isMember) {
      return {
        success: false,
        error: 'User is already a member of this team',
      };
    }

    const newMember = await teamsRepo.addTeamMember({
      ...memberData,
      added_by: addedBy,
    });

    return {
      success: true,
      data: newMember,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to add team member',
    };
  }
};

export const removeTeamMember = async (
  teamId: string,
  userId: string
): Promise<ApiResponse<void>> => {
  try {
    await teamsRepo.removeTeamMember(teamId, userId);

    return {
      success: true,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to remove team member',
    };
  }
};

// ============================================================================
// UTILITIES
// ============================================================================

export const getAvailableUsersForTeam = async (
  companyId: string,
  teamId: string
): Promise<ApiResponse<any[]>> => {
  try {
    const users = await teamsRepo.getAvailableUsersForTeam(companyId, teamId);

    return {
      success: true,
      data: users,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to fetch available users',
    };
  }
};

export const checkUserPermissions = async (
  teamId: string,
  userId: string,
  role: UserRole
): Promise<{ canEdit: boolean; canDelete: boolean; canManageMembers: boolean }> => {
  try {
    if (role === 'COMPANY_ADMIN') {
      return {
        canEdit: true,
        canDelete: true,
        canManageMembers: true,
      };
    }

    if (role === 'TEAM_LEAD') {
      const team = await teamsRepo.getTeamById(teamId);
      const isCreator = team.created_by === userId;

      return {
        canEdit: isCreator,
        canDelete: isCreator,
        canManageMembers: isCreator,
      };
    }

    return {
      canEdit: false,
      canDelete: false,
      canManageMembers: false,
    };
  } catch {
    return {
      canEdit: false,
      canDelete: false,
      canManageMembers: false,
    };
  }
};
