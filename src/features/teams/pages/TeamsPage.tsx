import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Plus, Search, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useTeams } from '../hooks/useTeams';
import { TeamsList } from '../components/TeamsList';
import { CreateTeamDialog } from '../components/CreateTeamDialog';
import { EditTeamDialog } from '../components/EditTeamDialog';
import type { TeamWithDetails } from '../types';

export const TeamsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { teams, isLoading, error, fetchTeams, deleteTeam, clearError } = useTeams();

  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<TeamWithDetails | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const canCreateTeam = user?.profile?.role === 'COMPANY_ADMIN' || user?.profile?.role === 'TEAM_LEAD';

  useEffect(() => {
    if (user?.profile) {
      fetchTeams(user.profile.id, user.profile.company_id, user.profile.role);
    }
  }, [user, fetchTeams]);

  const filteredTeams = teams.filter((team) =>
    team.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleTeamClick = (teamId: string) => {
    navigate(`/teams/${teamId}`);
  };

  const handleEditTeam = (team: TeamWithDetails) => {
    setSelectedTeam(team);
    setShowEditDialog(true);
  };

  const handleDeleteTeam = (team: TeamWithDetails) => {
    setSelectedTeam(team);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!selectedTeam || !user?.profile) return;

    setIsDeleting(true);
    const result = await deleteTeam(
      selectedTeam.id,
      user.profile.id,
      user.profile.role
    );
    setIsDeleting(false);

    if (result.success) {
      setShowDeleteDialog(false);
      setSelectedTeam(null);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Teams
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Organize and track your development teams
          </p>
        </div>
        {canCreateTeam && (
          <Button
            onClick={() => setShowCreateDialog(true)}
            className="bg-[#3DCF8E] hover:bg-[#2fb577] text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Team
          </Button>
        )}
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-red-900 dark:text-red-100">Error</h3>
            <p className="text-sm text-red-700 dark:text-red-300 mt-1">{error}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearError}
            className="text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/20"
          >
            Dismiss
          </Button>
        </div>
      )}

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Search teams..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-white dark:bg-[#1A2633]"
        />
      </div>

      {/* Teams List */}
      <TeamsList
        teams={filteredTeams}
        isLoading={isLoading}
        canCreate={canCreateTeam}
        onTeamClick={handleTeamClick}
        onEditTeam={handleEditTeam}
        onDeleteTeam={handleDeleteTeam}
        currentUserId={user?.profile?.id}
        userRole={user?.profile?.role}
      />

      {/* Dialogs */}
      <CreateTeamDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={() => {
          if (user?.profile) {
            fetchTeams(user.profile.id, user.profile.company_id, user.profile.role);
          }
        }}
      />

      <EditTeamDialog
        team={selectedTeam}
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        onSuccess={() => {
          if (user?.profile) {
            fetchTeams(user.profile.id, user.profile.company_id, user.profile.role);
          }
        }}
      />

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-[#F8F9FA] dark:bg-[#11181C]">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Team</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{selectedTeam?.name}</strong>?
              This will remove all members from the team. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? 'Deleting...' : 'Delete Team'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
