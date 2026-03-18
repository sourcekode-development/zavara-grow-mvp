import { useState } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { ProgramStatusBadge } from '../components/program-status-badge';
import { ReviewProgramPreviewDialog } from '../components/review-program-preview-dialog';
import { ReviewResponseDialog } from '../components/review-response-dialog';
import { useUpskillActions, useUpskillReviewQueue } from '../hooks/useUpskill';
import type { UpskillProgramWithDetails } from '../types';

export const UpskillReviewPage = () => {
  const { user } = useAuthStore();
  const { reviewQueue, isLoading, refetch } = useUpskillReviewQueue(user?.id);
  const { respondToReview, isLoading: isSaving } = useUpskillActions();
  const [dialogState, setDialogState] = useState<{
    reviewId: string;
    action: 'APPROVED' | 'CHANGES_REQUESTED';
  } | null>(null);
  const [selectedReview, setSelectedReview] = useState<{
    reviewId: string;
    program: UpskillProgramWithDetails;
  } | null>(null);

  const handleRespond = async (comments?: string) => {
    if (!dialogState || !user?.id) return;
    const updated = await respondToReview(dialogState.reviewId, user.id, {
      decision: dialogState.action,
      comments,
    });

    if (!updated) {
      toast.error('Failed to submit review response');
      return;
    }

    toast.success(
      dialogState.action === 'APPROVED'
        ? 'Program approved'
        : 'Changes requested'
    );
    await refetch();
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Up Skill Reviews</h1>
        <p className="mt-1 text-muted-foreground">
          Review submitted programs. The first approval closes the remaining pending reviews.
        </p>
      </div>

      {isLoading && <div className="text-sm text-muted-foreground">Loading review queue...</div>}

      {!isLoading && reviewQueue.length === 0 && (
        <div className="rounded-2xl border border-dashed px-6 py-14 text-center text-sm text-muted-foreground">
          No pending up skill reviews right now.
        </div>
      )}

      <div className="grid gap-4">
        {reviewQueue.map((review) => (
          <Card key={review.id}>
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div>
                <CardTitle>{review.program?.title || 'Program'}</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  {review.program?.description || 'No description yet.'}
                </p>
              </div>
              <ProgramStatusBadge status={review.program?.status || 'PENDING_REVIEW'} />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-lg bg-muted/50 p-3">
                  <div className="text-xs text-muted-foreground">Creator</div>
                  <div className="font-medium">
                    {review.program?.creator?.full_name || 'Unknown'}
                  </div>
                </div>
                <div className="rounded-lg bg-muted/50 p-3">
                  <div className="text-xs text-muted-foreground">Modules</div>
                  <div className="font-medium">
                    {review.program?.total_modules || review.program?.modules?.length || 0}
                  </div>
                </div>
                <div className="rounded-lg bg-muted/50 p-3">
                  <div className="text-xs text-muted-foreground">Estimated Effort</div>
                  <div className="font-medium">
                    {Number(review.program?.total_effort || 0).toFixed(1)}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  onClick={() => {
                    if (review.program) {
                      setSelectedReview({
                        reviewId: review.id,
                        program: review.program as UpskillProgramWithDetails,
                      });
                    }
                  }}
                >
                  View Full Details
                </Button>
                <Button
                  className="bg-[#3DCF8E] hover:bg-[#2fb577]"
                  onClick={() =>
                    setDialogState({ reviewId: review.id, action: 'APPROVED' })
                  }
                >
                  Approve
                </Button>
                <Button
                  variant="outline"
                  onClick={() =>
                    setDialogState({
                      reviewId: review.id,
                      action: 'CHANGES_REQUESTED',
                    })
                  }
                >
                  Request Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {dialogState && (
        <ReviewResponseDialog
          open={!!dialogState}
          onOpenChange={(open) => !open && setDialogState(null)}
          action={dialogState.action}
          onSubmit={handleRespond}
        />
      )}

      {selectedReview && (
        <ReviewProgramPreviewDialog
          open={!!selectedReview}
          onOpenChange={(open) => !open && setSelectedReview(null)}
          program={selectedReview.program}
          onApprove={() => {
            setSelectedReview(null);
            setDialogState({
              reviewId: selectedReview.reviewId,
              action: 'APPROVED',
            });
          }}
          onRequestChanges={() => {
            setSelectedReview(null);
            setDialogState({
              reviewId: selectedReview.reviewId,
              action: 'CHANGES_REQUESTED',
            });
          }}
        />
      )}

      {isSaving && <div className="text-sm text-muted-foreground">Saving review...</div>}
    </div>
  );
};
