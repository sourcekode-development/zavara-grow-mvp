import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ArrowLeft, Edit, Play, Plus, Send, Sparkles, Trophy } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { useUpskillStore } from '../store/upskill.store';
import { EffortLogDialog } from '../components/effort-log-dialog';
import { ModuleEditorDialog } from '../components/module-editor-dialog';
import { ModuleStatusBadge } from '../components/module-status-badge';
import { ProgramDashboard } from '../components/program-dashboard';
import { ProgramStatusBadge } from '../components/program-status-badge';
import { ReviewerSelectionDialog } from '../components/reviewer-selection-dialog';
import { useUpskillActions, useUpskillProgram } from '../hooks/useUpskill';
import type { UpskillProgramModuleWithMetrics } from '../types';

export const UpskillProgramDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const { reviewers } = useUpskillStore();
  const { program, dashboard, isLoading, error, refetch } = useUpskillProgram(id);
  const {
    fetchReviewers,
    createModule,
    updateModule,
    deleteModule,
    recordEffortLog,
    submitProgramForReview,
    startProgram,
    completeProgram,
    promoteProgramToTemplate,
    isLoading: isMutating,
  } = useUpskillActions();

  const [moduleDialogOpen, setModuleDialogOpen] = useState(false);
  const [effortDialogOpen, setEffortDialogOpen] = useState(false);
  const [reviewerDialogOpen, setReviewerDialogOpen] = useState(false);
  const [selectedModule, setSelectedModule] = useState<UpskillProgramModuleWithMetrics | null>(
    null
  );

  useEffect(() => {
    if (
      reviewerDialogOpen &&
      user?.profile?.company_id
    ) {
      fetchReviewers(user.profile.company_id, user.id);
    }
  }, [reviewerDialogOpen, user?.id, user?.profile?.company_id, fetchReviewers]);

  const isOwner = useMemo(() => program?.user_id === user?.id, [program?.user_id, user?.id]);
  const modules = (program?.modules || []) as UpskillProgramModuleWithMetrics[];
  const canMutate = program?.status !== 'COMPLETED';

  if (!id) {
    return null;
  }

  const handleRefresh = async () => {
    await refetch();
  };

  const handleModuleSave = async (
    payload:
      | {
          program_id: string;
          title: string;
          description?: string;
          effort?: number | null;
          content?: { type: 'plain_text'; text: string } | null;
        }
      | {
          title?: string;
          description?: string | null;
          effort?: number | null;
          content?: { type: 'plain_text'; text: string } | null;
          status?: 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'WONT_DO';
        }
  ) => {
    const updated = selectedModule
      ? await updateModule(selectedModule.id, payload)
      : await createModule(payload as {
          program_id: string;
          title: string;
          description?: string;
          effort?: number | null;
          content?: { type: 'plain_text'; text: string } | null;
        });

    if (!updated) {
      toast.error('Failed to save module');
      return;
    }

    toast.success(selectedModule ? 'Module updated' : 'Module added');
    await handleRefresh();
  };

  const handleEffortLog = async (request: {
    effort_used: number;
    notes?: string;
    logged_on: string;
  }) => {
    if (!selectedModule || !user?.id) return;
    const updated = await recordEffortLog(selectedModule.id, user.id, request);
    if (!updated) {
      toast.error('Failed to save effort log');
      return;
    }
    toast.success('Effort logged');
    await handleRefresh();
  };

  const handleSubmitForReview = async (reviewerIds: string[]) => {
    const updated = await submitProgramForReview(id, reviewerIds);
    if (!updated) {
      toast.error('Failed to submit program for review');
      return;
    }
    toast.success('Program submitted for review');
    await handleRefresh();
  };

  const handleStart = async () => {
    const updated = await startProgram(id);
    if (!updated) {
      toast.error('Failed to start program');
      return;
    }
    toast.success('Program started');
    await handleRefresh();
  };

  const handleComplete = async () => {
    const updated = await completeProgram(id);
    if (!updated) {
      toast.error('All modules must be completed or marked as wont do');
      return;
    }
    toast.success('Program completed');
    await handleRefresh();
  };

  const handlePromote = async () => {
    if (!user?.id || !user.profile?.company_id) return;
    await promoteProgramToTemplate(id, user.id, user.profile.company_id);
    toast.success('Template created from program');
  };

  const handleDeleteModule = async (moduleId: string) => {
    const updated = await deleteModule(moduleId);
    if (!updated) {
      toast.error('Failed to delete module');
      return;
    }
    toast.success('Module deleted');
    await handleRefresh();
  };

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => navigate('/up-skill')}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Up Skill
      </Button>

      {isLoading && <Skeleton className="h-[520px] rounded-xl" />}

      {!isLoading && error && (
        <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700 dark:bg-red-900/10 dark:text-red-300">
          {error}
        </div>
      )}

      {!isLoading && program && (
        <>
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-3xl font-bold tracking-tight">{program.title}</h1>
                <ProgramStatusBadge status={program.status} />
              </div>
              <p className="max-w-3xl text-muted-foreground">
                {program.description || 'No description yet.'}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {isOwner && canMutate && (
                <Button variant="outline" onClick={() => navigate(`/up-skill/${id}/edit`)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Program
                </Button>
              )}
              {isOwner && canMutate && (
                <Button variant="outline" onClick={handlePromote}>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Save as Template
                </Button>
              )}
              {isOwner && program.status === 'DRAFT' && (
                <Button className="bg-[#3DCF8E] hover:bg-[#2fb577]" onClick={() => setReviewerDialogOpen(true)}>
                  <Send className="mr-2 h-4 w-4" />
                  Submit for Review
                </Button>
              )}
              {isOwner && program.status === 'APPROVED' && (
                <Button className="bg-[#3DCF8E] hover:bg-[#2fb577]" onClick={handleStart}>
                  <Play className="mr-2 h-4 w-4" />
                  Start Program
                </Button>
              )}
              {isOwner && program.status === 'IN_PROGRESS' && (
                <Button className="bg-[#3DCF8E] hover:bg-[#2fb577]" onClick={handleComplete}>
                  <Trophy className="mr-2 h-4 w-4" />
                  Complete Program
                </Button>
              )}
            </div>
          </div>

          <ProgramDashboard dashboard={dashboard} />

          <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Modules</CardTitle>
                {isOwner && canMutate && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedModule(null);
                      setModuleDialogOpen(true);
                    }}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Module
                  </Button>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {modules.length === 0 && (
                  <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                    No modules yet. Add them as you discover the best path.
                  </div>
                )}

                {modules.map((module) => (
                  <div
                    key={module.id}
                    className="rounded-xl border border-border/60 p-4"
                  >
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold">{module.title}</h3>
                          <ModuleStatusBadge status={module.status} />
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {module.description || 'No description yet.'}
                        </p>
                        <div className="text-xs text-muted-foreground">
                          Estimated effort {Number(module.effort || 0).toFixed(1)} | Logged effort{' '}
                          {Number(module.logged_effort || 0).toFixed(1)} | Logs {module.log_count}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {isOwner && canMutate && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedModule(module);
                              setModuleDialogOpen(true);
                            }}
                          >
                            Edit
                          </Button>
                        )}
                        {isOwner && program.status === 'IN_PROGRESS' && (
                          <Button
                            size="sm"
                            className="bg-[#3DCF8E] hover:bg-[#2fb577]"
                            onClick={() => {
                              setSelectedModule(module);
                              setEffortDialogOpen(true);
                            }}
                          >
                            Log Effort
                          </Button>
                        )}
                        {isOwner && canMutate && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteModule(module.id)}
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                    </div>

                    {module.content?.text && (
                      <div className="mt-4 rounded-lg bg-muted/40 p-3 text-sm whitespace-pre-wrap">
                        {module.content.text}
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Review Activity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {(program.reviews || []).length === 0 && (
                  <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                    No review activity yet.
                  </div>
                )}
                {(program.reviews || []).map((review) => (
                  <div key={review.id} className="rounded-xl border border-border/60 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="font-medium">
                          {review.reviewer?.full_name || 'Reviewer'}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Round {review.review_round}
                        </div>
                      </div>
                      <ProgramStatusBadge
                        status={
                          review.decision === 'APPROVED'
                            ? 'APPROVED'
                            : review.decision === 'PENDING'
                              ? 'PENDING_REVIEW'
                              : 'DRAFT'
                        }
                      />
                    </div>
                    {review.comments && (
                      <p className="mt-3 text-sm text-muted-foreground">
                        {review.comments}
                      </p>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {program && (
        <>
          <ModuleEditorDialog
            open={moduleDialogOpen}
            onOpenChange={setModuleDialogOpen}
            programId={program.id}
            module={selectedModule}
            onSave={handleModuleSave}
          />

          <EffortLogDialog
            open={effortDialogOpen}
            onOpenChange={setEffortDialogOpen}
            module={selectedModule}
            onSubmit={handleEffortLog}
          />

          <ReviewerSelectionDialog
            open={reviewerDialogOpen}
            onOpenChange={setReviewerDialogOpen}
            reviewers={reviewers}
            isLoading={isMutating}
            onSubmit={handleSubmitForReview}
          />
        </>
      )}
    </div>
  );
};

