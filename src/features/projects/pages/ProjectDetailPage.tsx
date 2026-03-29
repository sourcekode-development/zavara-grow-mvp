import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ArrowLeft, Calendar, Plus, Users } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { ProjectMemberDrawer } from '../components/ProjectMemberDrawer';
import { ProjectMembersTable } from '../components/ProjectMembersTable';
import { useProjects } from '../hooks/useProjects';
import type { ProjectMemberWithProfile } from '../types';

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

export const ProjectDetailPage = () => {
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();
  const { user } = useAuth();
  const profile = user?.profile;
  const {
    currentProject,
    availableUsers,
    isLoading,
    error,
    fetchProjectDetails,
    fetchAvailableUsers,
    addProjectMember,
    updateProjectMember,
    removeProjectMember,
    clearError,
  } = useProjects();

  const [memberDrawerOpen, setMemberDrawerOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<ProjectMemberWithProfile | null>(null);
  const [memberToRemove, setMemberToRemove] = useState<ProjectMemberWithProfile | null>(null);
  const [removeDate, setRemoveDate] = useState(new Date().toISOString().slice(0, 10));

  const canManage = profile?.role === 'COMPANY_ADMIN' || profile?.role === 'TEAM_LEAD';

  useEffect(() => {
    if (!profile || !projectId) return;

    fetchProjectDetails(projectId, profile.id, profile.company_id, profile.role);
    if (canManage) {
      fetchAvailableUsers(profile.company_id, projectId, profile.role);
    }
  }, [profile, projectId, canManage, fetchProjectDetails, fetchAvailableUsers]);

  const reviewerName = useMemo(
    () =>
      currentProject?.active_members.find((member) => member.is_primary_reviewer)?.profile.full_name ||
      'Not assigned',
    [currentProject]
  );

  if (!currentProject && !isLoading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-lg font-semibold">Project not found</p>
          <p className="mt-2 text-sm text-muted-foreground">
            This project may not exist or you may not have access to it.
          </p>
          <Button className="mt-6" variant="outline" onClick={() => navigate('/projects')}>
            Back to Projects
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => navigate('/projects')}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Projects
      </Button>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300">
          <div className="flex items-center justify-between gap-4">
            <span>{error}</span>
            <Button variant="ghost" size="sm" onClick={clearError}>
              Dismiss
            </Button>
          </div>
        </div>
      ) : null}

      {currentProject ? (
        <>
          <Card className="overflow-hidden border-border/70 bg-gradient-to-br from-background via-background to-[#3DCF8E]/5">
            <CardContent className="flex flex-col gap-6 py-6 md:flex-row md:items-start md:justify-between">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-3xl font-bold tracking-tight">{currentProject.name}</h1>
                  <Badge variant="outline">{currentProject.project_kind.replace('_', ' ')}</Badge>
                  <Badge variant="secondary">{currentProject.status.replace('_', ' ')}</Badge>
                </div>
                <p className="max-w-3xl text-sm text-muted-foreground">
                  {currentProject.description || 'No project description provided yet.'}
                </p>
                <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Created {formatDate(currentProject.created_at)}
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    {currentProject.active_member_count} active members
                  </span>
                  <span>
                    Client: {currentProject.client?.name || 'Internal'}
                  </span>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="min-w-36 rounded-xl border bg-background/80 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    Active Members
                  </p>
                  <p className="mt-2 text-2xl font-semibold">
                    {currentProject.active_member_count}
                  </p>
                </div>
                <div className="min-w-36 rounded-xl border bg-background/80 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    Historical Assignments
                  </p>
                  <p className="mt-2 text-2xl font-semibold">
                    {currentProject.member_history.length}
                  </p>
                </div>
                <div className="min-w-36 rounded-xl border bg-background/80 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    Primary Reviewer
                  </p>
                  <p className="mt-2 text-sm font-semibold">{reviewerName}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {canManage ? (
            <div className="flex justify-end">
              <Button
                className="bg-[#3DCF8E] hover:bg-[#3DCF8E]/90"
                onClick={() => {
                  setSelectedMember(null);
                  setMemberDrawerOpen(true);
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Member
              </Button>
            </div>
          ) : null}

          <ProjectMembersTable
            title="Active Members"
            emptyMessage="No active members assigned to this project yet."
            members={currentProject.active_members}
            canManage={canManage}
            onEditMember={(member) => {
              setSelectedMember(member);
              setMemberDrawerOpen(true);
            }}
            onRemoveMember={(member) => {
              setMemberToRemove(member);
              setRemoveDate(new Date().toISOString().slice(0, 10));
            }}
          />

          <ProjectMembersTable
            title="Assignment History"
            emptyMessage="No historical assignments yet."
            members={currentProject.member_history}
            canManage={canManage}
            onEditMember={(member) => {
              setSelectedMember(member);
              setMemberDrawerOpen(true);
            }}
          />

          {profile && projectId ? (
            <ProjectMemberDrawer
              open={memberDrawerOpen}
              onOpenChange={setMemberDrawerOpen}
              projectId={projectId}
              availableUsers={availableUsers}
              initialMember={selectedMember}
              onSubmit={async (payload) => {
                const result = selectedMember
                  ? await updateProjectMember(projectId, selectedMember.id, payload, profile.role)
                  : await addProjectMember(payload as never, profile.id, profile.role);

                if (result.success) {
                  toast.success(selectedMember ? 'Assignment updated' : 'Member added to project');
                  fetchProjectDetails(projectId, profile.id, profile.company_id, profile.role);
                  fetchAvailableUsers(profile.company_id, projectId, profile.role);
                } else if (result.error) {
                  toast.error(result.error);
                }

                return result;
              }}
            />
          ) : null}

          <AlertDialog open={Boolean(memberToRemove)} onOpenChange={(open) => !open && setMemberToRemove(null)}>
            <AlertDialogContent className="bg-[#F8F9FA] dark:bg-[#11181C]">
              <AlertDialogHeader>
                <AlertDialogTitle>Remove Project Member</AlertDialogTitle>
                <AlertDialogDescription>
                  This will keep the assignment in history and mark it with a leave date instead of deleting it.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="space-y-2">
                <label htmlFor="project-member-remove-date" className="text-sm font-medium">
                  Leave Date
                </label>
                <input
                  id="project-member-remove-date"
                  type="date"
                  value={removeDate}
                  onChange={(event) => setRemoveDate(event.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
                />
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-red-600 text-white hover:bg-red-700"
                  onClick={async () => {
                    if (!memberToRemove || !profile || !projectId) return;

                    const result = await removeProjectMember(
                      projectId,
                      memberToRemove.id,
                      removeDate,
                      profile.id,
                      profile.role
                    );

                    if (result.success) {
                      toast.success('Member removed from active project assignments');
                      fetchProjectDetails(projectId, profile.id, profile.company_id, profile.role);
                      fetchAvailableUsers(profile.company_id, projectId, profile.role);
                      setMemberToRemove(null);
                    } else if (result.error) {
                      toast.error(result.error);
                    }
                  }}
                >
                  Remove Member
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      ) : null}
    </div>
  );
};
