import { create } from 'zustand';
import type { UserRole } from '@/shared/types';
import type {
  TeamsState,
  TeamWithDetails,
  TeamWithMembers,
  CreateTeamFormData,
  UpdateTeamFormData,
  AddTeamMemberFormData,
} from '../types';
import * as teamsApi from '../apis/teams.api';

interface TeamsStore extends TeamsState {
  // Actions - Teams
  fetchTeams: (userId: string, companyId: string, role: UserRole) => Promise<void>;
  fetchTeamById: (teamId: string) => Promise<void>;
  fetchTeamWithMembers: (teamId: string) => Promise<void>;
  createTeam: (teamData: CreateTeamFormData, createdBy: string) => Promise<{ success: boolean; error?: string; data?: TeamWithDetails }>;
  updateTeam: (teamId: string, updates: UpdateTeamFormData, userId: string, role: UserRole) => Promise<{ success: boolean; error?: string }>;
  deleteTeam: (teamId: string, userId: string, role: UserRole) => Promise<{ success: boolean; error?: string }>;
  
  // Actions - Members
  fetchTeamMembers: (teamId: string) => Promise<void>;
  fetchTeamMembersWithProgress: (teamId: string) => Promise<void>;
  addMember: (memberData: AddTeamMemberFormData, addedBy: string) => Promise<{ success: boolean; error?: string }>;
  removeMember: (teamId: string, userId: string) => Promise<{ success: boolean; error?: string }>;
  
  // State management
  setCurrentTeam: (team: TeamWithMembers | null) => void;
  clearError: () => void;
  setLoading: (isLoading: boolean) => void;
}

export const useTeamsStore = create<TeamsStore>((set) => ({
  // Initial state
  teams: [],
  currentTeam: null,
  membersWithProgress: [],
  isLoading: false,
  error: null,

  // ============================================================================
  // TEAMS ACTIONS
  // ============================================================================

  fetchTeams: async (userId, companyId, role) => {
    set({ isLoading: true, error: null });

    const response = await teamsApi.getTeamsForUser(userId, companyId, role);

    if (response.success && response.data) {
      set({
        teams: response.data,
        isLoading: false,
      });
    } else {
      set({
        error: response.error || 'Failed to fetch teams',
        isLoading: false,
      });
    }
  },

  fetchTeamById: async (teamId) => {
    set({ isLoading: true, error: null });

    const response = await teamsApi.getTeamById(teamId);

    if (response.success && response.data) {
      set({
        currentTeam: { ...response.data, members: [] },
        isLoading: false,
      });
    } else {
      set({
        error: response.error || 'Failed to fetch team',
        isLoading: false,
      });
    }
  },

  fetchTeamWithMembers: async (teamId) => {
    set({ isLoading: true, error: null });

    const response = await teamsApi.getTeamWithMembers(teamId);

    if (response.success && response.data) {
      set({
        currentTeam: response.data,
        isLoading: false,
      });
    } else {
      set({
        error: response.error || 'Failed to fetch team with members',
        isLoading: false,
      });
    }
  },

  createTeam: async (teamData, createdBy) => {
    set({ isLoading: true, error: null });

    const response = await teamsApi.createTeam(teamData, createdBy);

    if (response.success && response.data) {
      // Add new team to the list
      set((state) => ({
        teams: [response.data!, ...state.teams],
        isLoading: false,
      }));

      return { success: true, data: response.data };
    } else {
      set({
        error: response.error || 'Failed to create team',
        isLoading: false,
      });

      return { success: false, error: response.error };
    }
  },

  updateTeam: async (teamId, updates, userId, role) => {
    set({ isLoading: true, error: null });

    const response = await teamsApi.updateTeam(teamId, updates, userId, role);

    if (response.success && response.data) {
      // Update team in the list
      set((state) => ({
        teams: state.teams.map((team) =>
          team.id === teamId ? response.data! : team
        ),
        currentTeam: state.currentTeam?.id === teamId
          ? { ...state.currentTeam, ...response.data }
          : state.currentTeam,
        isLoading: false,
      }));

      return { success: true };
    } else {
      set({
        error: response.error || 'Failed to update team',
        isLoading: false,
      });

      return { success: false, error: response.error };
    }
  },

  deleteTeam: async (teamId, userId, role) => {
    set({ isLoading: true, error: null });

    const response = await teamsApi.deleteTeam(teamId, userId, role);

    if (response.success) {
      // Remove team from the list
      set((state) => ({
        teams: state.teams.filter((team) => team.id !== teamId),
        currentTeam: state.currentTeam?.id === teamId ? null : state.currentTeam,
        isLoading: false,
      }));

      return { success: true };
    } else {
      set({
        error: response.error || 'Failed to delete team',
        isLoading: false,
      });

      return { success: false, error: response.error };
    }
  },

  // ============================================================================
  // MEMBERS ACTIONS
  // ============================================================================

  fetchTeamMembers: async (teamId) => {
    set({ isLoading: true, error: null });

    const response = await teamsApi.getTeamMembers(teamId);

    if (response.success && response.data) {
      set((state) => ({
        currentTeam: state.currentTeam
          ? { ...state.currentTeam, members: response.data! }
          : null,
        isLoading: false,
      }));
    } else {
      set({
        error: response.error || 'Failed to fetch team members',
        isLoading: false,
      });
    }
  },

  fetchTeamMembersWithProgress: async (teamId) => {
    set({ isLoading: true, error: null });

    const response = await teamsApi.getTeamMembersWithProgress(teamId);

    if (response.success && response.data) {
      set({
        membersWithProgress: response.data,
        isLoading: false,
      });
    } else {
      set({
        error: response.error || 'Failed to fetch team members with progress',
        isLoading: false,
      });
    }
  },

  addMember: async (memberData, addedBy) => {
    set({ isLoading: true, error: null });

    const response = await teamsApi.addTeamMember(memberData, addedBy);

    if (response.success && response.data) {
      // Add member to current team
      set((state) => ({
        currentTeam: state.currentTeam
          ? {
              ...state.currentTeam,
              members: [...state.currentTeam.members, response.data!],
            }
          : null,
        isLoading: false,
      }));

      return { success: true };
    } else {
      set({
        error: response.error || 'Failed to add team member',
        isLoading: false,
      });

      return { success: false, error: response.error };
    }
  },

  removeMember: async (teamId, userId) => {
    set({ isLoading: true, error: null });

    const response = await teamsApi.removeTeamMember(teamId, userId);

    if (response.success) {
      // Remove member from current team
      set((state) => ({
        currentTeam: state.currentTeam
          ? {
              ...state.currentTeam,
              members: state.currentTeam.members.filter(
                (member) => member.user_id !== userId
              ),
            }
          : null,
        membersWithProgress: state.membersWithProgress.filter(
          (member) => member.user_id !== userId
        ),
        isLoading: false,
      }));

      return { success: true };
    } else {
      set({
        error: response.error || 'Failed to remove team member',
        isLoading: false,
      });

      return { success: false, error: response.error };
    }
  },

  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  setCurrentTeam: (team) => {
    set({ currentTeam: team });
  },

  clearError: () => {
    set({ error: null });
  },

  setLoading: (isLoading) => {
    set({ isLoading });
  },
}));
