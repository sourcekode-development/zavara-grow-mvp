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
import { Textarea } from '@/components/ui/textarea';

interface ReviewResponseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  action: 'APPROVED' | 'CHANGES_REQUESTED';
  onSubmit: (comments?: string) => Promise<void>;
}

export const ReviewResponseDialog = ({
  open,
  onOpenChange,
  action,
  onSubmit,
}: ReviewResponseDialogProps) => {
  const [comments, setComments] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit(comments.trim() || undefined);
      setComments('');
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {action === 'APPROVED' ? 'Approve Program' : 'Request Changes'}
          </DialogTitle>
          <DialogDescription>
            {action === 'APPROVED'
              ? 'This will approve the program and close the other pending reviews for this round.'
              : 'This will send the program back to draft if no one has approved it yet.'}
          </DialogDescription>
        </DialogHeader>

        <Textarea
          rows={5}
          value={comments}
          onChange={(event) => setComments(event.target.value)}
          placeholder="Add review comments for the developer"
        />

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            className={
              action === 'APPROVED'
                ? 'bg-[#3DCF8E] hover:bg-[#2fb577]'
                : undefined
            }
            variant={action === 'APPROVED' ? 'default' : 'secondary'}
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting
              ? 'Saving...'
              : action === 'APPROVED'
                ? 'Approve'
                : 'Request Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

