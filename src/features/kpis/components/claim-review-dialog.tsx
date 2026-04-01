import { useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { Claim, KpiMetricProgress, ReviewClaimRequest } from '../types';
import { ClaimAuditTimeline } from './claim-audit-timeline';
import { ClaimStatusBadge } from './claim-status-badge';

interface ClaimReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  claim: Claim | null;
  metric: KpiMetricProgress | null;
  onSubmit: (request: ReviewClaimRequest) => Promise<void>;
}

export const ClaimReviewDialog = ({
  open,
  onOpenChange,
  claim,
  metric,
  onSubmit,
}: ClaimReviewDialogProps) => {
  const [awardedPoints, setAwardedPoints] = useState('');
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setAwardedPoints('');
    setCommentText('');
    setError(null);
  }, [open, claim?.id]);

  const remainingPoints = useMemo(() => {
    if (!metric) return 0;
    return metric.remaining_points;
  }, [metric]);

  const handleSubmit = async (status: 'APPROVED' | 'REJECTED') => {
    if (!claim) return;
    if (status === 'APPROVED' && (!awardedPoints || Number(awardedPoints) <= 0)) {
      setError('Enter a positive point value to approve this claim');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        status,
        awarded_points: status === 'APPROVED' ? Number(awardedPoints) : null,
        comment_text: commentText.trim() || undefined,
      });
      onOpenChange(false);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Failed to review claim');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!claim || !metric) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Review Claim</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border p-4">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold">{metric.name}</h3>
              <ClaimStatusBadge status={claim.status} />
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Submitted by {claim.submitter?.full_name || 'Unknown user'}
            </p>
            <p className="mt-3 whitespace-pre-wrap text-sm">{claim.evidence_text}</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border bg-muted/30 p-4">
              <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Remaining
              </div>
              <div className="mt-2 text-2xl font-semibold">
                {remainingPoints} / {metric.max_points}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Awarded Points</label>
              <Input
                type="number"
                min="0"
                max={remainingPoints}
                value={awardedPoints}
                onChange={(event) => setAwardedPoints(event.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Feedback Comment</label>
            <Textarea
              rows={4}
              value={commentText}
              onChange={(event) => setCommentText(event.target.value)}
              placeholder="Optional feedback for the submitter"
            />
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Audit Trail</h4>
            <ClaimAuditTimeline logs={claim.audit_logs || []} />
          </div>

          {error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300">
              {error}
            </div>
          ) : null}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => handleSubmit('REJECTED')}
            disabled={isSubmitting}
          >
            Reject
          </Button>
          <Button
            onClick={() => handleSubmit('APPROVED')}
            disabled={isSubmitting}
            className="bg-[#3DCF8E] text-white hover:bg-[#2fb577]"
          >
            Approve
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
