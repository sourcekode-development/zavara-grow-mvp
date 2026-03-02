import { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { useReviewSubmission } from '../hooks/useSubmissions';
import type { KpiMetricSubmissionWithDetails } from '../types';

interface ReviewClaimDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  submission: KpiMetricSubmissionWithDetails | null;
  onSuccess?: () => void;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'PENDING':
      return 'bg-yellow-500 dark:bg-yellow-600';
    case 'APPROVED':
      return 'bg-[#3DCF8E] dark:bg-[#3DCF8E]';
    case 'REJECTED':
      return 'bg-red-500 dark:bg-red-600';
    default:
      return 'bg-gray-500';
  }
};

export const ReviewClaimDrawer = ({
  open,
  onOpenChange,
  submission,
  onSuccess,
}: ReviewClaimDrawerProps) => {
  const [reviewerComments, setReviewerComments] = useState('');
  const [pointsAwarded, setPointsAwarded] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { reviewSubmission } = useReviewSubmission();

  const handleReview = async (status: 'APPROVED' | 'REJECTED') => {
    if (!submission) return;

    // For approval, require points awarded
    if (status === 'APPROVED') {
      const points = Number(pointsAwarded);
      if (!points || points <= 0) {
        toast.error('Please enter valid points to award');
        return;
      }

      const metric = submission.metric;
      const remainingPoints = (metric?.target_points || 0) - (metric?.accumulated_points || 0);
      if (points > remainingPoints) {
        toast.error(`Cannot award more than remaining ${remainingPoints} points`);
        return;
      }
    }

    setIsSubmitting(true);

    const result = await reviewSubmission(
      submission.id,
      status,
      status === 'APPROVED' ? Number(pointsAwarded) : undefined,
      reviewerComments
    );

    if (result.data && !result.error) {
      toast.success(`Claim ${status.toLowerCase()}`);
      setReviewerComments('');
      setPointsAwarded('');
      onOpenChange(false);
      onSuccess?.();
    } else {
      toast.error(result.error || 'Failed to review claim');
    }

    setIsSubmitting(false);
  };

  if (!submission) return null;

  const isPending = submission.status === 'PENDING';
  const metric = submission.metric;
  const developer = metric?.developer_kpi?.developer;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[600px] sm:max-w-[600px] overflow-y-auto p-4">
        <SheetHeader>
          <SheetTitle>Review Claim</SheetTitle>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Status Badge */}
          <div className="flex items-center justify-between">
            <Badge className={getStatusColor(submission.status)}>
              {submission.status}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {new Date(submission.created_at).toLocaleString()}
            </span>
          </div>

          {/* Developer Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Developer Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <span className="text-sm font-medium">Name: </span>
                <span className="text-sm text-muted-foreground">
                  {developer?.full_name || 'N/A'}
                </span>
              </div>
              {developer?.email && (
                <div>
                  <span className="text-sm font-medium">Email: </span>
                  <span className="text-sm text-muted-foreground">
                    {developer.email}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Metric Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Metric Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <span className="text-sm font-medium">Metric: </span>
                <span className="text-sm text-muted-foreground">
                  {metric?.name || 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-sm font-medium">Category: </span>
                <Badge variant="outline">
                  {metric?.category?.name || 'N/A'}
                </Badge>
              </div>
              <div>
                <span className="text-sm font-medium">Points Awarded: </span>
                <span className="text-sm font-semibold text-[#3DCF8E]">
                  {submission.points_awarded || 0} pts
                </span>
              </div>
              <div>
                <span className="text-sm font-medium">Progress: </span>
                <span className="text-sm text-muted-foreground">
                  {metric?.accumulated_points || 0} / {metric?.target_points || 0} pts
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Claim Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Claim Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {submission.description || 'No description provided'}
              </p>
            </CardContent>
          </Card>

          {/* Evidence */}
          {submission.attachments && submission.attachments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Evidence</CardTitle>
              </CardHeader>
              <CardContent>
                <a
                  href={submission.attachments[0]}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-[#3DCF8E] hover:underline"
                >
                  <ExternalLink className="h-4 w-4" />
                  View Evidence
                </a>
              </CardContent>
            </Card>
          )}

          {/* Reviewer Comments (if already reviewed) */}
          {!isPending && submission.reviewer_comments && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Review Comments</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {submission.reviewer_comments}
                </p>
                {submission.reviewer && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Reviewed by: {submission.reviewer.full_name}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Review Form (only for pending) */}
          {isPending && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="points_awarded">Points to Award *</Label>
                <Input
                  id="points_awarded"
                  type="number"
                  placeholder="Enter points (max: remaining points)"
                  value={pointsAwarded}
                  onChange={(e) => setPointsAwarded(e.target.value)}
                  min={0}
                  max={(metric?.target_points || 0) - (metric?.accumulated_points || 0)}
                />
                <p className="text-xs text-muted-foreground">
                  Remaining: {(metric?.target_points || 0) - (metric?.accumulated_points || 0)} pts
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="reviewer_comments">Review Comments (Optional)</Label>
                <Textarea
                  id="reviewer_comments"
                  placeholder="Add notes about your decision..."
                  value={reviewerComments}
                  onChange={(e) => setReviewerComments(e.target.value)}
                  rows={4}
                />
              </div>
            </div>
          )}
        </div>

        <SheetFooter className="mt-6">
          {isPending ? (
            <div className="flex gap-2 w-full">
              <Button
                variant="outline"
                onClick={() => handleReview('REJECTED')}
                disabled={isSubmitting}
                className="flex-1"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Reject
              </Button>
              <Button
                onClick={() => handleReview('APPROVED')}
                disabled={isSubmitting}
                className="flex-1"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Approve
              </Button>
            </div>
          ) : (
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};
