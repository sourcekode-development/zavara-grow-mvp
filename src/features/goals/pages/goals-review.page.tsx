// ============================================================================
// GOALS REVIEW PAGE - TEAM_LEAD / COMPANY_ADMIN review pending goals
// ============================================================================

import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useGoals } from '../hooks/useGoals';
import { useGoalActions } from '../hooks/useGoalActions';
import { GoalReviewDialog } from '../components/goal-review-dialog';
import { FileText, Calendar, User, CheckCircle, AlertTriangle } from 'lucide-react';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { toast } from 'sonner';
import type { Goal, GoalReviewAction } from '../types';
import { formatDistanceToNow } from 'date-fns';

export const GoalsReviewPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { goals, isLoading, refetch } = useGoals({
    status: 'PENDING_REVIEW',
  });
  const { reviewGoal, isLoading: actionLoading } = useGoalActions();

  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [showReviewDialog, setShowReviewDialog] = useState(false);

  const handleReviewClick = (goal: Goal) => {
    setSelectedGoal(goal);
    setShowReviewDialog(true);
  };

  const handleReview = async (action: GoalReviewAction, comments?: string) => {
    if (!selectedGoal || !user?.id) return;

    const success = await reviewGoal(selectedGoal.id, user.id, action, comments);

    if (success) {
      let message = 'Goal reviewed successfully';
      
      switch (action) {
        case 'APPROVED':
          message = '✅ Goal approved! Developer can now start.';
          break;
        case 'REQUESTED_CHANGES':
          message = '📝 Changes requested. Developer will be notified.';
          break;
        case 'MODIFIED':
          message = '✏️ Goal approved with modifications.';
          // Navigate to edit page if modified
          setShowReviewDialog(false);
          navigate(`/goals/${selectedGoal.id}/edit`);
          return;
        case 'REJECTED':
          message = '❌ Goal rejected.';
          break;
      }

      toast.success(message);
      setShowReviewDialog(false);
      setSelectedGoal(null);
      refetch();
    } else {
      toast.error('Failed to review goal');
    }
  };

  const handleViewGoal = (goalId: string) => {
    navigate(`/goals/${goalId}`);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      </div>
    );
  }

  const pendingGoals = goals || [];

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Goals Pending Review</h1>
        <p className="text-muted-foreground mt-1">
          Review and approve goals submitted by developers
        </p>
      </div>

      {/* Stats */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Review Queue</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <span className="text-2xl font-bold">{pendingGoals.length}</span>
            <span className="text-muted-foreground">
              {pendingGoals.length === 1 ? 'goal' : 'goals'} awaiting review
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Goals List */}
      {pendingGoals.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold">All caught up!</h3>
              <p className="text-muted-foreground mt-2">
                There are no goals waiting for your review at the moment.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {pendingGoals.map((goal) => (
            <Card key={goal.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400">
                        Pending Review
                      </Badge>
                      {goal.template_id && (
                        <Badge variant="outline" className="text-xs">
                          From Template
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-xl">{goal.title}</CardTitle>
                    {goal.description && (
                      <CardDescription className="mt-2 line-clamp-2">
                        {goal.description}
                      </CardDescription>
                    )}
                  </div>
                </div>

                {/* Goal Metadata */}
                <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <User className="h-4 w-4" />
                    <span>{goal.assignee?.full_name || 'Unknown'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" />
                    <span>
                      Submitted {formatDistanceToNow(new Date(goal.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  {goal.milestones && goal.milestones.length > 0 && (
                    <div className="flex items-center gap-1.5">
                      <FileText className="h-4 w-4" />
                      <span>{goal.milestones.length} milestone{goal.milestones.length !== 1 ? 's' : ''}</span>
                    </div>
                  )}
                </div>

                {/* Milestones Preview */}
                {goal.milestones && goal.milestones.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <div className="text-sm font-medium">Milestones:</div>
                    <div className="space-y-1.5">
                      {goal.milestones.slice(0, 3).map((milestone) => (
                        <div
                          key={milestone.id}
                          className="flex items-center gap-2 text-sm bg-muted/50 px-3 py-2 rounded"
                        >
                          <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                          <span className="flex-1">{milestone.title}</span>
                          {milestone.duration_days && (
                            <span className="text-xs text-muted-foreground">
                              {milestone.duration_days}d
                            </span>
                          )}
                        </div>
                      ))}
                      {goal.milestones.length > 3 && (
                        <div className="text-xs text-muted-foreground pl-5">
                          +{goal.milestones.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardHeader>

              <CardContent className="pt-0">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewGoal(goal.id)}
                  >
                    View Details
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleReviewClick(goal)}
                    disabled={actionLoading}
                    className="bg-[#3DCF8E] hover:bg-[#34B67A] text-white"
                  >
                    Review Goal
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Review Dialog */}
      {selectedGoal && (
        <GoalReviewDialog
          open={showReviewDialog}
          onOpenChange={setShowReviewDialog}
          goal={selectedGoal}
          onReview={handleReview}
          isLoading={actionLoading}
        />
      )}
    </div>
  );
};
