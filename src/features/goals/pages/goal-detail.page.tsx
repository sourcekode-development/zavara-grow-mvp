import { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { useGoal } from '../hooks/useGoals';
import { useGoalActions } from '../hooks/useGoalActions';
import { GoalStatusBadge } from '../components/goal-status-badge';
import { GoalOverview } from '../components/goal-overview';
import { GoalProgress } from '../components/goal-progress';
import { SessionsEditor } from '../components/sessions-editor';
import { CheckpointCard } from '../components/checkpoint-card';
import { AssessmentViewDialog } from '../components/assessment-view-dialog';
import { ConfirmDialog } from '../components/confirm-dialog';
import { ReviewerSelectionDialog } from '../components/reviewer-selection-dialog';
import { ArrowLeft, Edit, Play, CheckCircle, Trash2, Send, Plus } from 'lucide-react';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { useSessionMutations } from '../hooks/useSessions';
import { useCheckpoints } from '../hooks/useCheckpoints';
import { toast } from 'sonner';
import type { Assessment, CadenceSession, CreateSessionRequest } from '../types';

export const GoalDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { goal, isLoading, error, refetch } = useGoal(id);
  const {
    startGoal,
    completeGoal,
    abandonGoal,
    submitForReview,
    isLoading: actionLoading,
    error: actionError,
  } = useGoalActions();

  const { createSession, updateSession, deleteSession, isLoading: sessionLoading, error: sessionError } = useSessionMutations();
  const { markCheckpointReady, getAssessment, isLoading: checkpointLoading } = useCheckpoints();

  const [showStartDialog, setShowStartDialog] = useState(false);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);
  const [showAssessmentDialog, setShowAssessmentDialog] = useState(false);

  const canEdit = goal?.status === 'DRAFT' || goal?.status === 'CHANGES_REQUESTED';
  const canSubmit = goal?.status === 'DRAFT' || goal?.status === 'CHANGES_REQUESTED';
  const canStart = goal?.status === 'APPROVED';
  const canComplete = goal?.status === 'IN_PROGRESS';
  const isOwner = goal?.user_id === user?.id;
  const isRejectedGoal = goal?.status === 'ABANDONED';
  const requiresChanges = goal?.status === 'CHANGES_REQUESTED';
  const canCreateExecutionItems =
    goal?.status === 'APPROVED' || goal?.status === 'IN_PROGRESS';
  const createBlockedReason = requiresChanges
    ? 'This goal requires modifications before you can create sessions or checkpoints.'
    : 'Sessions and checkpoints can only be created for approved goals.';

  const handleEdit = () => {
    navigate(`/goals/${id}/edit`);
  };

  const handleSubmit = async (reviewerId: string) => {
    if (!id) return;

    const success = await submitForReview(id, reviewerId);
    if (success) {
      toast.success('Goal submitted for review');
      setShowSubmitDialog(false);
      refetch();
    } else {
      toast.error(actionError || 'Failed to submit goal. Please try again.');
    }
  };

  const handleStart = async () => {
    if (!id) return;
    const success = await startGoal(id);
    if (success) {
      toast.success('Goal started successfully');
      setShowStartDialog(false);
      refetch();
    } else {
      toast.error(actionError || 'Failed to start goal');
    }
  };

  const handleComplete = async () => {
    if (!id) return;
    const success = await completeGoal(id);
    if (success) {
      toast.success('Congratulations! Goal completed!');
      setShowCompleteDialog(false);
      refetch();
    } else {
      toast.error(actionError || 'Failed to complete goal');
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    const success = await abandonGoal(id);
    if (success) {
      toast.success('Goal deleted');
    } else {
      toast.error(actionError || 'Failed to delete goal');
    }
  };

  const handleMarkCheckpointReady = async (checkpointId: string) => {
    const success = await markCheckpointReady(checkpointId);
    if (success) {
      refetch();
    }
  };

  const handleAddSession = async (sessionData: Partial<CadenceSession>): Promise<boolean> => {
    if (!id) return false;

    const requestData: CreateSessionRequest = {
      goal_id: id,
      milestone_id: sessionData.milestone_id || undefined,
      title: sessionData.title || undefined,
      description: sessionData.description || undefined,
      scheduled_date: sessionData.scheduled_date || undefined,
      duration_minutes: sessionData.duration_minutes,
      session_effort: sessionData.session_effort || 1,
      completed_effort: sessionData.completed_effort ?? 0,
    };

    const session = await createSession(requestData);
    if (session) {
      toast.success('Session added successfully');
      await refetch();
      return true;
    }
    toast.warning(
      sessionError || 'Total session effort cannot exceed goal effort. Please reduce session values.'
    );
    return false;
  };

  const handleUpdateSession = async (
    sessionId: string,
    sessionData: Partial<CadenceSession>
  ): Promise<boolean> => {
    const success = await updateSession(sessionId, {
      ...sessionData,
      milestone_id: sessionData.milestone_id || undefined,
    });
    if (success) {
      toast.success('Session updated successfully');
      await refetch();
      return true;
    }
    toast.warning(
      sessionError || 'Total session effort cannot exceed goal effort. Please reduce session values.'
    );
    return false;
  };

  const handleDeleteSession = async (sessionId: string) => {
    await deleteSession(sessionId);
    toast.success('Session deleted successfully');
    await refetch();
  };

  const handleViewAssessment = async (checkpointId: string) => {
    const assessment = await getAssessment(checkpointId);
    if (assessment) {
      setSelectedAssessment(assessment);
      setShowAssessmentDialog(true);
    } else {
      toast.error('No assessment found for this checkpoint');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-96" />
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (error || !goal) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate('/goals')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Goals
        </Button>
        <div className="rounded-lg bg-red-50 dark:bg-red-900/10 p-8 text-center">
          <h2 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-2">Goal Not Found</h2>
          <p className="text-sm text-red-600/80 dark:text-red-400/80">
            {error || 'The goal you are looking for does not exist or you do not have access to it.'}
          </p>
        </div>
      </div>
    );
  }

  if (isRejectedGoal) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate('/goals')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Goals
        </Button>
        <div className="rounded-lg bg-red-50 dark:bg-red-900/10 p-8 text-center">
          <h2 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-2">
            Status: Not Accepted
          </h2>
          <p className="text-sm text-red-600/80 dark:text-red-400/80">
            This goal was rejected during review and cannot be opened for review actions.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => navigate('/goals')} className="mb-2">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Goals
      </Button>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-bold tracking-tight mb-2">{goal.title}</h1>
            <div className="flex items-center gap-2">
              <GoalStatusBadge status={goal.status} />
              {goal.creator && (
                <span className="text-sm text-muted-foreground">Created by {goal.creator.full_name}</span>
              )}
            </div>
          </div>

          {isOwner && (
            <div className="flex items-center gap-2 shrink-0">
              {canEdit && (
                <Button variant="outline" onClick={handleEdit}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}

              {canSubmit && (
                <Button
                  onClick={() => setShowSubmitDialog(true)}
                  disabled={actionLoading}
                  className="bg-[#3DCF8E] hover:bg-[#3DCF8E]/90"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Submit for Review
                </Button>
              )}

              {canStart && (
                <Button
                  onClick={() => setShowStartDialog(true)}
                  disabled={actionLoading}
                  className="bg-[#3DCF8E] hover:bg-[#3DCF8E]/90"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Start Goal
                </Button>
              )}

              {canComplete && (
                <Button
                  onClick={() => setShowCompleteDialog(true)}
                  disabled={actionLoading}
                  className="bg-[#3DCF8E] hover:bg-[#3DCF8E]/90"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Complete
                </Button>
              )}

              {canEdit && (
                <Button
                  variant="destructive"
                  onClick={() => setShowDeleteDialog(true)}
                  disabled={actionLoading}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      <ReviewerSelectionDialog
        open={showSubmitDialog}
        onOpenChange={setShowSubmitDialog}
        onSubmit={handleSubmit}
        isLoading={actionLoading}
      />

      <ConfirmDialog
        open={showStartDialog}
        onOpenChange={setShowStartDialog}
        title="Start Goal"
        description="Ready to begin this goal?"
        actionLabel="Start Goal"
        onConfirm={handleStart}
      />

      <ConfirmDialog
        open={showCompleteDialog}
        onOpenChange={setShowCompleteDialog}
        title="Complete Goal"
        description="Mark this goal as completed."
        actionLabel="Complete"
        onConfirm={handleComplete}
      />

      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Delete Goal"
        description="This will set the goal as abandoned."
        actionLabel="Delete"
        onConfirm={handleDelete}
        variant="destructive"
      />

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-6">
          <GoalOverview goal={goal} />
        </div>

        <div className="space-y-6">
          <GoalProgress goal={goal} />
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Cadence Sessions</h2>
        <SessionsEditor
          sessions={goal.active_sessions || []}
          goalId={id!}
          milestones={[]}
          onAddSession={handleAddSession}
          onUpdateSession={handleUpdateSession}
          onDeleteSession={handleDeleteSession}
          isLoading={sessionLoading}
          canCreate={canCreateExecutionItems}
          hideCreateActions={isRejectedGoal}
          createBlockedReason={createBlockedReason}
        />
      </div>

      {goal.checkpoints && goal.checkpoints.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Checkpoints</h2>
            {isRejectedGoal ? (
              <div className="text-sm font-medium text-red-600 dark:text-red-400">
                Status: Not Accepted
              </div>
            ) : canCreateExecutionItems ? (
              <Button size="sm" variant="outline" onClick={() => navigate(`/goals/${id}/edit?tab=checkpoints`)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Checkpoint
              </Button>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <Button size="sm" variant="outline" disabled>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Checkpoint
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent>{createBlockedReason}</TooltipContent>
              </Tooltip>
            )}
          </div>
          <div className="space-y-3">
            {goal.checkpoints.map((checkpoint) => (
              <CheckpointCard
                key={checkpoint.id}
                checkpoint={checkpoint}
                onMarkReady={handleMarkCheckpointReady}
                onViewAssessment={handleViewAssessment}
                isOwner={goal.user_id === user?.id}
                isReviewer={checkpoint.assigned_reviewer_id === user?.id}
                canEdit
                isLoading={checkpointLoading}
              />
            ))}
          </div>
        </div>
      )}

      {(!goal.checkpoints || goal.checkpoints.length === 0) && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Checkpoints</h2>
          <div className="p-8 border-2 border-dashed rounded-lg text-center">
            <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-sm text-muted-foreground mb-4">
              No checkpoints configured yet. Add checkpoints to validate progress.
            </p>
            {isRejectedGoal ? (
              <div className="text-sm font-medium text-red-600 dark:text-red-400">
                Status: Not Accepted
              </div>
            ) : canCreateExecutionItems ? (
              <Button
                size="sm"
                onClick={() => navigate(`/goals/${id}/edit?tab=checkpoints`)}
                className="bg-[#3DCF8E] hover:bg-[#3DCF8E]/90"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add First Checkpoint
              </Button>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <Button size="sm" className="bg-[#3DCF8E] hover:bg-[#3DCF8E]/90" disabled>
                      <Plus className="h-4 w-4 mr-2" />
                      Add First Checkpoint
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent>{createBlockedReason}</TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>
      )}

      {selectedAssessment && (
        <AssessmentViewDialog
          open={showAssessmentDialog}
          onOpenChange={setShowAssessmentDialog}
          assessment={selectedAssessment}
        />
      )}
    </div>
  );
};
