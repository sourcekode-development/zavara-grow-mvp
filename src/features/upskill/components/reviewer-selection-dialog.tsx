import { useEffect, useState } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ReviewerSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reviewers: Array<{ id: string; full_name: string; email?: string | null; role?: string }>;
  isLoading?: boolean;
  onSubmit: (reviewerIds: string[]) => Promise<void>;
}

export const ReviewerSelectionDialog = ({
  open,
  onOpenChange,
  reviewers,
  isLoading = false,
  onSubmit,
}: ReviewerSelectionDialogProps) => {
  const [selectedReviewerIds, setSelectedReviewerIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setSelectedReviewerIds([]);
    }
  }, [open]);

  const handleToggle = (reviewerId: string) => {
    setSelectedReviewerIds((current) =>
      current.includes(reviewerId)
        ? current.filter((id) => id !== reviewerId)
        : [...current, reviewerId]
    );
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit(selectedReviewerIds);
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Select Reviewers</DialogTitle>
          <DialogDescription>
            Multiple reviewers can be assigned. The first approval is enough.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[360px] space-y-3 overflow-y-auto">
          {reviewers.map((reviewer) => (
            <button
              type="button"
              key={reviewer.id}
              className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors ${
                selectedReviewerIds.includes(reviewer.id)
                  ? 'border-[#3DCF8E] bg-[#3DCF8E]/5'
                  : 'border-border hover:border-[#3DCF8E]/30'
              }`}
              onClick={() => handleToggle(reviewer.id)}
            >
              <Checkbox checked={selectedReviewerIds.includes(reviewer.id)} />
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-[#3DCF8E]/15 text-[#2f9f68]">
                  {reviewer.full_name
                    .split(' ')
                    .map((part) => part[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <div className="font-medium">{reviewer.full_name}</div>
                <div className="text-sm text-muted-foreground">{reviewer.email}</div>
              </div>
              <div className="ml-auto text-xs text-muted-foreground">
                {reviewer.role?.replace('_', ' ')}
              </div>
            </button>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            className="bg-[#3DCF8E] hover:bg-[#2fb577]"
            onClick={handleSubmit}
            disabled={selectedReviewerIds.length === 0 || isSubmitting || isLoading}
          >
            {isSubmitting ? 'Submitting...' : 'Submit for Review'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

