import { useTeamsStore } from '../store/teams.store';

/**
 * Main teams hook - provides access to teams state and actions
 */
export const useTeams = () => {
  const teams = useTeamsStore((state) => state.teams);
  const currentTeam = useTeamsStore((state) => state.currentTeam);
  const membersWithProgress = useTeamsStore((state) => state.membersWithProgress);
  const isLoading = useTeamsStore((state) => state.isLoading);
  const error = useTeamsStore((state) => state.error);

  const fetchTeams = useTeamsStore((state) => state.fetchTeams);
  const fetchTeamById = useTeamsStore((state) => state.fetchTeamById);
  const fetchTeamWithMembers = useTeamsStore((state) => state.fetchTeamWithMembers);
  const createTeam = useTeamsStore((state) => state.createTeam);
  const updateTeam = useTeamsStore((state) => state.updateTeam);
  const deleteTeam = useTeamsStore((state) => state.deleteTeam);

  const fetchTeamMembers = useTeamsStore((state) => state.fetchTeamMembers);
  const fetchTeamMembersWithProgress = useTeamsStore((state) => state.fetchTeamMembersWithProgress);
  const addMember = useTeamsStore((state) => state.addMember);
  const removeMember = useTeamsStore((state) => state.removeMember);

  const setCurrentTeam = useTeamsStore((state) => state.setCurrentTeam);
  const clearError = useTeamsStore((state) => state.clearError);

  return {
    // State
    teams,
    currentTeam,
    membersWithProgress,
    isLoading,
    error,

    // Actions
    fetchTeams,
    fetchTeamById,
    fetchTeamWithMembers,
    createTeam,
    updateTeam,
    deleteTeam,
    
    fetchTeamMembers,
    fetchTeamMembersWithProgress,
    addMember,
    removeMember,
    
    setCurrentTeam,
    clearError,
  };
};
