import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { RecordUpskillEffortLogRequest, UpskillProgramModuleWithMetrics } from '../types';

interface EffortLogDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  module?: UpskillProgramModuleWithMetrics | null;
  onSubmit: (request: RecordUpskillEffortLogRequest) => Promise<void>;
}

export const EffortLogDialog = ({
  open,
  onOpenChange,
  module,
  onSubmit,
}: EffortLogDialogProps) => {
  const [effortUsed, setEffortUsed] = useState('');
  const [loggedOn, setLoggedOn] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const estimatedEffort = Number(module?.effort ?? 0);
  const loggedEffort = Number(module?.logged_effort ?? 0);
  const remainingEffort = Math.max(0, estimatedEffort - loggedEffort);

  const effortUsedNumber = Number(effortUsed);
  const isValidEffortNumber = effortUsed !== '' && !Number.isNaN(effortUsedNumber);

  const effortValidationError =
    !effortUsed || effortUsed === ''
      ? undefined
      : !isValidEffortNumber
      ? 'Enter a valid number.'
      : effortUsedNumber <= 0
      ? 'Effort must be greater than 0.'
      : undefined;

  const isSubmitDisabled =
    isSubmitting ||
    !effortUsed ||
    !!effortValidationError;

  const handleSubmit = async () => {
    if (effortValidationError || !effortUsed || !isValidEffortNumber) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        effort_used: effortUsedNumber,
        logged_on: loggedOn,
        notes: notes.trim() || undefined,
      });
      setEffortUsed('');
      setNotes('');
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Log Effort</DialogTitle>
          <DialogDescription>
            {module
              ? `Record progress for "${module.title}".`
              : 'Record progress for this module.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
            Estimated effort: {Number(module?.effort || 0).toFixed(1)} | Logged so far:{' '}
            {Number(module?.logged_effort || 0).toFixed(1)}
          </div>

          <div className="space-y-2">
            <Label htmlFor="upskill-log-effort">Effort Used</Label>
            <Input
              id="upskill-log-effort"
              type="number"
              min="0.1"
              max={undefined}
              step="0.1"
              value={effortUsed}
              onChange={(event) => setEffortUsed(event.target.value)}
              placeholder="e.g. 1.5"
            />

            {effortValidationError ? (
              <p className="text-sm text-destructive">{effortValidationError}</p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Remaining estimate: {remainingEffort.toFixed(1)} hour
                {remainingEffort === 1 ? '' : 's'}.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="upskill-log-date">Activity Date</Label>
            <Input
              id="upskill-log-date"
              type="date"
              value={loggedOn}
              onChange={(event) => setLoggedOn(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="upskill-log-notes">Notes</Label>
            <Textarea
              id="upskill-log-notes"
              rows={4}
              placeholder="What did you complete in this effort log?"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            className="bg-[#3DCF8E] hover:bg-[#2fb577]"
            onClick={handleSubmit}
            disabled={isSubmitDisabled}
          >
            {isSubmitting ? 'Saving...' : 'Save Log'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

