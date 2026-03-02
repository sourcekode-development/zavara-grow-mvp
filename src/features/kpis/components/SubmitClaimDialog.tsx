import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useSubmitClaim } from '../hooks/useSubmissions';
import { developerKpisRepository } from '../repository/developer-kpis.repository';
import type { DeveloperKpiMetric } from '../types';

interface SubmitClaimDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  metricId: string | null;
  onSuccess?: () => void;
}

interface ClaimFormData {
  description: string;
  evidence_url: string;
}

export const SubmitClaimDialog = ({
  open,
  onOpenChange,
  metricId,
  onSuccess,
}: SubmitClaimDialogProps) => {
  const [metric, setMetric] = useState<DeveloperKpiMetric | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { submitClaim } = useSubmitClaim();

  const { register, handleSubmit, reset, formState: { errors } } =
    useForm<ClaimFormData>({
      defaultValues: {
        description: '',
        evidence_url: '',
      },
    });

  // Fetch metric details
  useEffect(() => {
    const fetchMetricDetails = async () => {
      if (!open || !metricId) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      const { data } = await developerKpisRepository.getMetricById(metricId);
      if (data) {
        setMetric(data);
      }
      setIsLoading(false);
    };

    fetchMetricDetails();
  }, [open, metricId]);

  const onSubmit = async (data: ClaimFormData) => {
    if (!metricId) return;

    setIsSubmitting(true);

    const attachments = data.evidence_url ? [data.evidence_url] : [];

    const result = await submitClaim({
      metric_id: metricId,
      description: data.description,
      attachments,
    });

    if (result.data && !result.error) {
      toast.success('Claim submitted successfully');
      reset();
      onOpenChange(false);
      onSuccess?.();
    } else {
      toast.error(result.error || 'Failed to submit claim');
    }

    setIsSubmitting(false);
  };

  const remaining = metric
    ? metric.target_points - metric.accumulated_points
    : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Submit Claim</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            Loading metric details...
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Metric Info */}
            {metric && (
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <div>
                  <span className="text-sm font-medium">Metric: </span>
                  <span className="text-sm text-muted-foreground">
                    {metric.name}
                  </span>
                </div>
                <div>
                  <span className="text-sm font-medium">Progress: </span>
                  <span className="text-sm text-muted-foreground">
                    {metric.accumulated_points} / {metric.target_points} points
                  </span>
                </div>
                <div>
                  <span className="text-sm font-medium">Remaining: </span>
                  <span className="text-sm font-semibold text-[#3DCF8E]">
                    {remaining} points
                  </span>
                </div>
              </div>
            )}

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                {...register('description', {
                  required: 'Description is required',
                  minLength: {
                    value: 10,
                    message: 'Description must be at least 10 characters',
                  },
                })}
                placeholder="Describe what you accomplished and how it contributes to this metric..."
                rows={5}
              />
              {errors.description && (
                <p className="text-sm text-red-500">
                  {errors.description.message}
                </p>
              )}
            </div>

            {/* Evidence URL */}
            <div className="space-y-2">
              <Label htmlFor="evidence_url">Evidence URL (Optional)</Label>
              <Input
                type="url"
                {...register('evidence_url')}
                placeholder="https://github.com/..."
              />
              <p className="text-xs text-muted-foreground">
                Link to GitHub PR, Jira ticket, documentation, or any other relevant evidence
              </p>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  reset();
                  onOpenChange(false);
                }}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || isLoading}>
                {isSubmitting ? 'Submitting...' : 'Submit Claim'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};
