import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { KpiMetricProgress, SubmitClaimRequest } from '../types';

interface ClaimSubmissionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  metric: KpiMetricProgress | null;
  kpiId: string;
  onSubmit: (request: SubmitClaimRequest) => Promise<void>;
}

export const ClaimSubmissionDialog = ({
  open,
  onOpenChange,
  metric,
  kpiId,
  onSubmit,
}: ClaimSubmissionDialogProps) => {
  const [evidenceText, setEvidenceText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setEvidenceText('');
    setError(null);
  }, [open, metric]);

  const handleSubmit = async () => {
    if (!metric || !evidenceText.trim()) {
      setError('Evidence is required');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        kpi_id: kpiId,
        kpi_metric_id: metric.kpi_metric_id,
        evidence_text: evidenceText.trim(),
      });
      onOpenChange(false);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Failed to submit claim');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Submit Claim</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border bg-muted/30 p-3">
            <div className="font-medium">{metric?.name}</div>
            <div className="mt-1 text-sm text-muted-foreground">
              Remaining points: {metric?.remaining_points ?? 0} / {metric?.max_points ?? 0}
            </div>
          </div>

          <Textarea
            rows={6}
            value={evidenceText}
            onChange={(event) => setEvidenceText(event.target.value)}
            placeholder="Describe the evidence, impact, and any context the reviewer should know."
          />

          {error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300">
              {error}
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-[#3DCF8E] text-white hover:bg-[#2fb577]"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Claim'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
