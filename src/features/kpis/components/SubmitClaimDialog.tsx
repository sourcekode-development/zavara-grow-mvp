import { useState, useEffect, useRef, type ChangeEvent } from 'react';
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
import { X } from 'lucide-react';

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

interface ScreenshotPreview {
  id: string;
  file: File;
  previewUrl: string;
}

const MAX_SCREENSHOTS = 2;
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png']);

export const SubmitClaimDialog = ({
  open,
  onOpenChange,
  metricId,
  onSuccess,
}: SubmitClaimDialogProps) => {
  const [metric, setMetric] = useState<DeveloperKpiMetric | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [screenshots, setScreenshots] = useState<ScreenshotPreview[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const { submitClaim } = useSubmitClaim();

  const { register, handleSubmit, reset, formState: { errors } } =
    useForm<ClaimFormData>({
      defaultValues: {
        description: '',
        evidence_url: '',
      },
    });

  const clearScreenshots = () => {
    setScreenshots((previous) => {
      previous.forEach((item) => URL.revokeObjectURL(item.previewUrl));
      return [];
    });
  };

  useEffect(() => {
    if (!open) {
      clearScreenshots();
      reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    return () => {
      clearScreenshots();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

    const result = await submitClaim({
      metric_id: metricId,
      description: data.description,
      attachments: data.evidence_url ? [data.evidence_url] : [],
    }, screenshots.map((item) => item.file));

    if (result.data && !result.error) {
      toast.success('Claim submitted successfully');
      clearScreenshots();
      reset();
      onOpenChange(false);
      onSuccess?.();
    } else {
      toast.error(result.error || 'Failed to submit claim');
    }

    setIsSubmitting(false);
  };

  const removeScreenshot = (id: string) => {
    setScreenshots((previous) => {
      const target = previous.find((item) => item.id === id);
      if (target) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return previous.filter((item) => item.id !== id);
    });
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFilesSelected = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);

    if (selectedFiles.length === 0) {
      return;
    }

    if (screenshots.length + selectedFiles.length > MAX_SCREENSHOTS) {
      toast.error('You can upload a maximum of 2 screenshots.');
      event.target.value = '';
      return;
    }

    const nextFiles: ScreenshotPreview[] = [];
    for (const file of selectedFiles) {
      if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
        toast.error('Only JPG, JPEG, and PNG images are allowed.');
        event.target.value = '';
        return;
      }

      if (file.size > MAX_FILE_SIZE_BYTES) {
        toast.error('Each screenshot must be 5MB or smaller.');
        event.target.value = '';
        return;
      }

      nextFiles.push({
        id: crypto.randomUUID(),
        file,
        previewUrl: URL.createObjectURL(file),
      });
    }

    setScreenshots((previous) => [...previous, ...nextFiles]);
    event.target.value = '';
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

            <div className="space-y-2">
              <Label htmlFor="evidence_url">Evidence URL (Optional)</Label>
              <Input
                id="evidence_url"
                type="url"
                {...register('evidence_url')}
                placeholder="https://github.com/..."
              />
              <p className="text-xs text-muted-foreground">
                Link to GitHub PR, Jira ticket, documentation, or any other relevant evidence
              </p>
            </div>

            <div className="space-y-2">
              <Label>Upload Screenshots (Max 2)</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,image/jpeg,image/jpg,image/png"
                multiple
                className="hidden"
                onChange={handleFilesSelected}
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleUploadClick}
                disabled={isSubmitting || screenshots.length >= MAX_SCREENSHOTS}
              >
                Upload Screenshot
              </Button>
              <p className="text-xs text-muted-foreground">
                Only JPG/PNG images. Maximum 2 screenshots, 5MB each.
              </p>
            </div>

            {screenshots.length > 0 && (
              <div className="space-y-2">
                <Label>Preview</Label>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {screenshots.map((item) => (
                    <div key={item.id} className="rounded-lg border p-2">
                      <img
                        src={item.previewUrl}
                        alt={item.file.name}
                        className="h-40 w-full rounded object-cover"
                      />
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <p className="truncate text-xs text-muted-foreground">{item.file.name}</p>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => removeScreenshot(item.id)}
                          disabled={isSubmitting}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  clearScreenshots();
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
