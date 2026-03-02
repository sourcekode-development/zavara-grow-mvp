import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Clock, Target, User, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { useCheckpoints } from '../hooks/useCheckpoints';
import { CheckpointReviewForm } from '../components/checkpoint-review-form';
import { EmptyState } from '../components/empty-state';
import type { Checkpoint } from '../types';
import type { AssessmentFormData } from '../components/assessment-form';

export const CheckpointsListPage = () => {
  const { user } = useAuthStore();
  const { checkpoints, isLoading, error, fetchPendingCheckpoints, startReview, submitAssessment } = useCheckpoints();
  const [selectedCheckpoint, setSelectedCheckpoint] = useState<Checkpoint | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchPendingCheckpoints();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const handleReviewClick = async (checkpoint: Checkpoint) => {
    setSelectedCheckpoint(checkpoint);
    setIsDialogOpen(true);
    
    // Mark the checkpoint as "Review In Progress" when reviewer opens it
    if (checkpoint.status === 'READY_FOR_REVIEW') {
      await startReview(checkpoint.id);
      // Refresh to update the status badge
      fetchPendingCheckpoints();
    }
  };

  const handleSubmitReview = async (passed: boolean, assessmentData: AssessmentFormData) => {
    if (!selectedCheckpoint?.id) return;

    setIsSubmitting(true);
    const success = await submitAssessment(selectedCheckpoint.id, {
      checkpoint_id: selectedCheckpoint.id,
      passed,
      feedback_text: assessmentData.feedback,
      strengths: assessmentData.strengths,
      areas_for_improvement: assessmentData.improvements,
      action_items: assessmentData.action_items.map(item => ({ task: item })),
    });

    setIsSubmitting(false);
    
    if (success) {
      setIsDialogOpen(false);
      setSelectedCheckpoint(null);
      // Refresh the list
      fetchPendingCheckpoints();
    }
  };

  // Show checkpoints that are ready for review
  const pendingCheckpoints = checkpoints.filter((c) => 
    c.status === 'READY_FOR_REVIEW' || c.status === 'REVIEW_IN_PROGRESS'
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Checkpoint Reviews</h1>
        <p className="text-muted-foreground mt-1">
          Review checkpoints that developers have marked as ready for review
        </p>
      </div>

      {/* Stats */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 dark:bg-yellow-900/30">
              <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{pendingCheckpoints.length}</p>
              <p className="text-sm text-muted-foreground">
                Checkpoints ready for review
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error State */}
      {error && (
        <div className="rounded-lg bg-red-50 dark:bg-red-900/10 p-4 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6 space-y-3">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-9 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && pendingCheckpoints.length === 0 && (
        <EmptyState
          icon={Clock}
          title="No Checkpoints to Review"
          description="There are no checkpoints waiting for review. When developers mark checkpoints as ready, they'll appear here."
        />
      )}

      {/* Checkpoints List */}
      {!isLoading && pendingCheckpoints.length > 0 && (
        <div className="space-y-4">
          {pendingCheckpoints.map((checkpoint) => (
            <Card key={checkpoint.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="h-5 w-5 text-[#3DCF8E]" />
                      <h3 className="font-semibold text-lg">
                        {checkpoint.goal?.title || 'Goal'}
                      </h3>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      Milestone: {checkpoint.milestone?.title || 'N/A'}
                    </p>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      {checkpoint.reviewer && (
                        <div className="flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5" />
                          <span>Reviewer: {checkpoint.reviewer.full_name}</span>
                        </div>
                      )}
                      {checkpoint.scheduled_date && (
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>Scheduled: {format(new Date(checkpoint.scheduled_date), 'MMM dd, yyyy')}</span>
                        </div>
                      )}
                      {checkpoint.review_started_at && (
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5" />
                          <span>
                            Review Started: {format(new Date(checkpoint.review_started_at), 'MMM dd, yyyy')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                    <Clock className="h-3.5 w-3.5 mr-1" />
                    {checkpoint.status === 'REVIEW_IN_PROGRESS' ? 'Review In Progress' : 'Ready for Review'}
                  </Badge>
                </div>

                {checkpoint.developer_notes && (
                  <div className="mb-4 p-3 bg-muted rounded-lg">
                    <p className="text-sm font-medium mb-1">Developer Notes:</p>
                    <p className="text-sm text-muted-foreground">
                      {checkpoint.developer_notes}
                    </p>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    onClick={() => handleReviewClick(checkpoint)}
                    className="bg-[#3DCF8E] hover:bg-[#3DCF8E]/90"
                  >
                    Review Checkpoint
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Review Drawer */}
      <Drawer open={isDialogOpen} onOpenChange={setIsDialogOpen} direction="right">
        <DrawerContent className="h-full overflow-y-auto">
          <DrawerHeader>
            <DrawerTitle>Review Checkpoint</DrawerTitle>
          </DrawerHeader>
          <div className="p-4 pb-8">
            {selectedCheckpoint && (
              <CheckpointReviewForm
                checkpoint={selectedCheckpoint}
                onSubmit={handleSubmitReview}
                isLoading={isSubmitting}
              />
            )}
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
};
