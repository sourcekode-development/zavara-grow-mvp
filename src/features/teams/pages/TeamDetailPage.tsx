import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import {
  ArrowLeft,
  Users,
  UserPlus,
  Settings,
  Trash2,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Spinner } from '@/components/ui/spinner';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useTeams } from '../hooks/useTeams';
import { useTeamPermissions } from '../hooks/useTeamPermissions';
import { TeamMembersList } from '../components/TeamMembersList';
import { AddMemberDialog } from '../components/AddMemberDialog';
import { EditTeamDialog } from '../components/EditTeamDialog';
import type { TeamMemberWithProfile } from '../types';

export const TeamDetailPage = () => {
  const { teamId } = useParams<{ teamId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    currentTeam,
    membersWithProgress,
    isLoading,
    error,
    fetchTeamWithMembers,
    fetchTeamMembersWithProgress,
    deleteTeam,
    removeMember,
    clearError,
  } = useTeams();
  const { permissions } = useTeamPermissions(teamId);

  const [showAddMemberDialog, setShowAddMemberDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showRemoveMemberDialog, setShowRemoveMemberDialog] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMemberWithProfile | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  useEffect(() => {
    if (teamId) {
      fetchTeamWithMembers(teamId);
      fetchTeamMembersWithProgress(teamId);
    }
  }, [teamId, fetchTeamWithMembers, fetchTeamMembersWithProgress]);

  const handleDeleteTeam = async () => {
    if (!currentTeam || !user?.profile) return;

    setIsDeleting(true);
    const result = await deleteTeam(
      currentTeam.id,
      user.profile.id,
      user.profile.role
    );
    setIsDeleting(false);

    if (result.success) {
      navigate('/teams');
    }
  };

  const handleRemoveMember = async () => {
    if (!selectedMember || !currentTeam) return;

    setIsRemoving(true);
    const result = await removeMember(currentTeam.id, selectedMember.user_id);
    setIsRemoving(false);

    if (result.success) {
      setShowRemoveMemberDialog(false);
      setSelectedMember(null);
      // Refresh the members list
      if (teamId) {
        fetchTeamMembersWithProgress(teamId);
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (isLoading && !currentTeam) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spinner className="w-8 h-8 text-[#3DCF8E]" />
      </div>
    );
  }

  if (!currentTeam) {
    return (
      <div className="p-6">
        <div className="max-w-2xl mx-auto text-center py-12">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
          <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-gray-100">
            Team Not Found
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            The team you're looking for doesn't exist or you don't have access to it.
          </p>
          <Button onClick={() => navigate('/teams')} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Teams
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <Button
            variant="ghost"
            onClick={() => navigate('/teams')}
            className="mb-4 -ml-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Teams
          </Button>

          <div className="flex items-start gap-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {currentTeam.name}
              </h1>
              
              <div className="flex flex-wrap items-center gap-3 mt-3 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span>
                    {currentTeam.members.length}{' '}
                    {currentTeam.members.length === 1 ? 'Member' : 'Members'}
                  </span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>Created {formatDate(currentTeam.created_at)}</span>
                </div>
                {currentTeam.creator && (
                  <>
                    <span>•</span>
                    <div className="flex items-center gap-2">
                      <span>Created by:</span>
                      <Badge
                        variant="secondary"
                        className="bg-gray-100 dark:bg-gray-800"
                      >
                        {currentTeam.creator.full_name}
                      </Badge>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Actions Menu */}
        {(permissions.canEdit || permissions.canDelete || permissions.canManageMembers) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <Settings className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-white dark:bg-[#1A2633]">
              {permissions.canManageMembers && (
                <DropdownMenuItem
                  onClick={() => setShowAddMemberDialog(true)}
                  className="cursor-pointer"
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add Member
                </DropdownMenuItem>
              )}
              {permissions.canEdit && (
                <DropdownMenuItem
                  onClick={() => setShowEditDialog(true)}
                  className="cursor-pointer"
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Edit Team
                </DropdownMenuItem>
              )}
              {(permissions.canEdit || permissions.canDelete) && permissions.canManageMembers && (
                <DropdownMenuSeparator />
              )}
              {permissions.canDelete && (
                <DropdownMenuItem
                  onClick={() => setShowDeleteDialog(true)}
                  className="cursor-pointer text-red-600 dark:text-red-400"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Team
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
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

      {/* Content Tabs */}
      <Tabs defaultValue="members" className="w-full">
        <TabsList className="bg-white dark:bg-[#1A2633]">
          <TabsTrigger value="members">Team Members</TabsTrigger>
          <TabsTrigger value="overview">Overview</TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="mt-6">
          {permissions.canManageMembers && (
            <div className="mb-6">
              <Button
                onClick={() => setShowAddMemberDialog(true)}
                className="bg-[#3DCF8E] hover:bg-[#2fb577] text-white"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Add Member
              </Button>
            </div>
          )}

          <TeamMembersList members={membersWithProgress} isLoading={isLoading} />
        </TabsContent>

        <TabsContent value="overview" className="mt-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div className="bg-white dark:bg-[#1A2633] rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-2">
                <Users className="w-5 h-5 text-[#3DCF8E]" />
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                  Total Members
                </h3>
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {currentTeam.members.length}
              </p>
            </div>

            <div className="bg-white dark:bg-[#1A2633] rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Active Goals
              </h3>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {membersWithProgress.filter((m) => m.recent_goal).length}
              </p>
            </div>

            <div className="bg-white dark:bg-[#1A2633] rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Active KPIs
              </h3>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {membersWithProgress.filter((m) => m.recent_kpi).length}
              </p>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      {permissions.canManageMembers && (
        <AddMemberDialog
          teamId={currentTeam.id}
          companyId={currentTeam.company_id}
          open={showAddMemberDialog}
          onOpenChange={setShowAddMemberDialog}
          onSuccess={() => {
            if (teamId) {
              fetchTeamWithMembers(teamId);
              fetchTeamMembersWithProgress(teamId);
            }
          }}
        />
      )}

      {permissions.canEdit && (
        <EditTeamDialog
          team={currentTeam}
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          onSuccess={() => {
            if (teamId) {
              fetchTeamWithMembers(teamId);
            }
          }}
        />
      )}

      {permissions.canDelete && (
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent className="bg-[#F8F9FA] dark:bg-[#11181C]">
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Team</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete <strong>{currentTeam.name}</strong>?
                This will remove all members from the team. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteTeam}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {isDeleting ? 'Deleting...' : 'Delete Team'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      <AlertDialog open={showRemoveMemberDialog} onOpenChange={setShowRemoveMemberDialog}>
        <AlertDialogContent className="bg-[#F8F9FA] dark:bg-[#11181C]">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Team Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove{' '}
              <strong>{selectedMember?.profile?.full_name}</strong> from this team?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRemoving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveMember}
              disabled={isRemoving}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isRemoving ? 'Removing...' : 'Remove Member'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
