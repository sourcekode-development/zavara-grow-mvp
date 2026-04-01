import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ArrowLeft, Briefcase, Flame, Target } from 'lucide-react';
import { toast } from 'sonner';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { UserRole } from '@/shared/types';
import { useManagedUserProfile } from '../hooks/useManagedUserProfile';
import { UserProfileDetailsTab } from '../components/user-profile-details-tab';
import { UserUpskillOverviewTab } from '../components/user-upskill-overview-tab';
import { UserKpisOverviewTab } from '../components/user-kpis-overview-tab';
import { useState } from 'react';
import { KpiAssignmentDrawer } from '@/features/kpis/components/kpi-assignment-drawer';
import { useCompanyReviewers, useKpiActions, useKpiTemplates, useKpiUserSummary } from '@/features/kpis/hooks/useKpis';

const getInitials = (name: string) =>
  name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

const formatRole = (role: string) => role.replaceAll('_', ' ');

export const UserDetailPage = () => {
  const navigate = useNavigate();
  const { userId } = useParams<{ userId: string }>();
  const { user } = useAuthStore();
  const { profile, upskillPrograms, kpis, isLoading, error } = useManagedUserProfile(userId);
  const { summary: kpiSummary, refetch: refetchKpiSummary } = useKpiUserSummary(userId);
  const { templates } = useKpiTemplates({
    company_id: user?.profile?.company_id,
    scope: 'ALL',
  });
  const { reviewers } = useCompanyReviewers(user?.profile?.company_id, user?.profile?.role);
  const { assignKpi } = useKpiActions();
  const [assignmentOpen, setAssignmentOpen] = useState(false);

  const canManageUsers = useMemo(
    () =>
      user?.profile?.role === UserRole.COMPANY_ADMIN ||
      user?.profile?.role === UserRole.TEAM_LEAD,
    [user?.profile?.role]
  );

  if (!canManageUsers) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <p className="text-lg font-semibold">Access restricted</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Only company admins and team leads can view full user profiles.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (profile && user?.profile?.company_id !== profile.company_id) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <p className="text-lg font-semibold">User not available</p>
          <p className="mt-2 text-sm text-muted-foreground">
            This profile does not belong to your company.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => navigate('/users')}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Users
      </Button>

      {isLoading && (
        <div className="space-y-4">
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-96 rounded-xl" />
        </div>
      )}

      {!isLoading && error && (
        <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700 dark:bg-red-900/10 dark:text-red-300">
          {error}
        </div>
      )}

      {!isLoading && profile && (
        <>
          <Card className="overflow-hidden border-border/70 bg-gradient-to-br from-background via-background to-[#3DCF8E]/5">
            <CardContent className="flex flex-col gap-6 py-6 md:flex-row md:items-start md:justify-between">
              <div className="flex items-start gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="bg-[#3DCF8E]/15 text-lg font-semibold text-[#208d61] dark:text-[#3DCF8E]">
                    {getInitials(profile.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-3xl font-bold tracking-tight">{profile.full_name}</h1>
                    <Badge variant="secondary">{formatRole(profile.role)}</Badge>
                  </div>
                  <p className="text-muted-foreground">{profile.email || 'No email available'}</p>
                  <div className="flex flex-wrap gap-2">
                    {(profile.teams || []).map((team) => (
                      <Badge key={team.id} variant="outline">
                        {team.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="min-w-36 rounded-xl border bg-background/80 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    Upskill Programs
                  </p>
                  <p className="mt-2 flex items-center gap-2 text-2xl font-semibold">
                    <Briefcase className="h-5 w-5 text-[#3DCF8E]" />
                    {upskillPrograms.length}
                  </p>
                </div>
                <div className="min-w-36 rounded-xl border bg-background/80 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    Overall Streak
                  </p>
                  <p className="mt-2 flex items-center gap-2 text-2xl font-semibold">
                    <Flame className="h-5 w-5 text-[#3DCF8E]" />
                    {Math.max(...upskillPrograms.map((program) => program.current_streak), 0)}
                  </p>
                </div>
                <div className="min-w-36 rounded-xl border bg-background/80 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    KPIs
                  </p>
                  <p className="mt-2 flex items-center gap-2 text-2xl font-semibold">
                    <Target className="h-5 w-5 text-[#3DCF8E]" />
                    {kpiSummary?.total_kpis || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {canManageUsers ? (
            <div className="flex justify-end">
              <Button
                className="bg-[#3DCF8E] text-white hover:bg-[#2fb577]"
                onClick={() => setAssignmentOpen(true)}
              >
                Assign KPI
              </Button>
            </div>
          ) : null}

          <Tabs defaultValue="profile" className="gap-6">
            <TabsList className="w-full justify-start bg-white dark:bg-[#1A2633]">
              <TabsTrigger value="profile">Profile Details</TabsTrigger>
              <TabsTrigger value="upskill">Upskill</TabsTrigger>
              <TabsTrigger value="kpis">KPIs</TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="mt-0">
              <UserProfileDetailsTab user={profile} />
            </TabsContent>

            <TabsContent value="upskill" className="mt-0">
              <UserUpskillOverviewTab programs={upskillPrograms} />
            </TabsContent>

            <TabsContent value="kpis" className="mt-0">
              <UserKpisOverviewTab kpis={kpis} />
            </TabsContent>
          </Tabs>
        </>
      )}

      {profile && user?.id && user?.profile?.company_id ? (
        <KpiAssignmentDrawer
          open={assignmentOpen}
          onOpenChange={setAssignmentOpen}
          developerId={profile.id}
          developerName={profile.full_name}
          templates={templates}
          reviewers={reviewers.filter((reviewer) => reviewer.reviewer_id !== profile.id)}
          onSubmit={async (request) => {
            const kpiId = await assignKpi(user.id, user.profile?.role, request);
            toast.success('KPI assigned');
            await refetchKpiSummary();
            navigate(`/kpis/assigned/${kpiId}`);
          }}
        />
      ) : null}
    </div>
  );
};
