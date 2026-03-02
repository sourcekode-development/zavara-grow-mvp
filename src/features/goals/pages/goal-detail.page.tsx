import { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Button } from '@/components/ui/button';
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
import type { CadenceSession, CreateSessionRequest, Assessment } from '../types';

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
  
  const { createSession, updateSession, deleteSession, isLoading: sessionLoading } = useSessionMutations();
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

  const handleEdit = () => {
    navigate(`/goals/${id}/edit`);
  };

  const handleSubmit = async (reviewerId: string) => {
    if (!id) return;
    
    console.log('🚀 Submitting goal for review:', { goalId: id, reviewerId });
    
    const success = await submitForReview(id, reviewerId);
    
    console.log('✅ Submit result:', success, 'Error:', actionError);
    
    if (success) {
      toast.success('Goal submitted for review');
      setShowSubmitDialog(false);
      refetch();
    } else {
      console.error('❌ Submit failed. Error message:', actionError);
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
      toast.success('Congratulations! Goal completed! 🎉');
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
      // Navigation handled by abandonGoal
    } else {
      toast.error(actionError || 'Failed to delete goal');
    }
  };

  const handleAddSession = async (sessionData: Partial<CadenceSession>) => {
    if (!id) return;
    const requestData: CreateSessionRequest = {
      goal_id: id,
      milestone_id: sessionData.milestone_id || undefined,
      title: sessionData.title || undefined,
      description: sessionData.description || undefined,
      scheduled_date: sessionData.scheduled_date || undefined,
      duration_minutes: sessionData.duration_minutes,
    };
    const session = await createSession(requestData);
    if (session) {
      toast.success('Session added successfully');
      refetch();
    }
  };

  const handleUpdateSession = async (sessionId: string, sessionData: Partial<CadenceSession>) => {
    await updateSession(sessionId, {
      ...sessionData,
      milestone_id: sessionData.milestone_id || undefined,
    });
    toast.success('Session updated successfully');
    refetch();
  };

  const handleDeleteSession = async (sessionId: string) => {
    await deleteSession(sessionId);
    toast.success('Session deleted successfully');
    refetch();
  };

  const handleMarkCheckpointReady = async (checkpointId: string) => {
    const success = await markCheckpointReady(checkpointId);
    if (success) {
      refetch();
    }
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
        {/* Header Skeleton */}
        <div className="space-y-2">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-96" />
        </div>

        {/* Content Skeleton */}
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
          <h2 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-2">
            Goal Not Found
          </h2>
          <p className="text-sm text-red-600/80 dark:text-red-400/80">
            {error || 'The goal you are looking for does not exist or you do not have access to it.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button variant="ghost" onClick={() => navigate('/goals')} className="mb-2">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Goals
      </Button>

      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-bold tracking-tight mb-2">
              {goal.title}
            </h1>
            <div className="flex items-center gap-2">
              <GoalStatusBadge status={goal.status} />
              {goal.creator && (
                <span className="text-sm text-muted-foreground">
                  Created by {goal.creator.full_name}
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
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

      {/* Confirmation Dialogs */}
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
        description="Ready to begin your upskilling journey? Starting this goal will activate daily tracking and streak monitoring."
        actionLabel="Start Goal"
        onConfirm={handleStart}
      />

      <ConfirmDialog
        open={showCompleteDialog}
        onOpenChange={setShowCompleteDialog}
        title="Complete Goal"
        description="Congratulations on finishing! Mark this goal as completed to celebrate your achievement."
        actionLabel="Complete"
        onConfirm={handleComplete}
      />

      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Delete Goal"
        description="This will permanently delete this goal. This action cannot be undone."
        actionLabel="Delete"
        onConfirm={handleDelete}
        variant="destructive"
      />

      {/* Content Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Left Column */}
        <div className="space-y-6">
          <GoalOverview goal={goal} />
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <GoalProgress goal={goal} />
        </div>
      </div>

      {/* Milestones Section */}
      {goal.milestones && goal.milestones.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Milestones</h2>
          <div className="space-y-3">
            {goal.milestones.map((milestone, index) => (
              <div
                key={milestone.id}
                className="p-4 border rounded-lg bg-card hover:shadow-sm transition-shadow"
              >
                <div className="flex items-start gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#3DCF8E]/10 text-[#3DCF8E] font-semibold text-sm shrink-0">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold">{milestone.title}</h3>
                    {milestone.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {milestone.description}
                      </p>
                    )}
                    {milestone.duration_days && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Duration: {milestone.duration_days} days
                      </p>
                    )}
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                    {milestone.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cadence Sessions Section */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Cadence Sessions</h2>
        <SessionsEditor
          sessions={goal.active_sessions || []}
          goalId={id!}
          milestones={goal.milestones?.map((m) => ({ id: m.id, title: m.title }))}
          onAddSession={handleAddSession}
          onUpdateSession={handleUpdateSession}
          onDeleteSession={handleDeleteSession}
          isLoading={sessionLoading}
        />
      </div>

      {/* Checkpoints Section */}
      {goal.checkpoints && goal.checkpoints.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Checkpoints</h2>
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate(`/goals/${id}/edit?tab=checkpoints`)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Checkpoint
            </Button>
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
                canEdit={true}
                isLoading={checkpointLoading}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty Checkpoints State */}
      {(!goal.checkpoints || goal.checkpoints.length === 0) && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Checkpoints</h2>
          <div className="p-8 border-2 border-dashed rounded-lg text-center">
            <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-sm text-muted-foreground mb-4">
              No checkpoints configured yet. Add checkpoints to track and validate progress at key milestones.
            </p>
            <Button
              size="sm"
              onClick={() => navigate(`/goals/${id}/edit?tab=checkpoints`)}
              className="bg-[#3DCF8E] hover:bg-[#3DCF8E]/90"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add First Checkpoint
            </Button>
          </div>
        </div>
      )}

      {/* Assessment View Dialog */}
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
