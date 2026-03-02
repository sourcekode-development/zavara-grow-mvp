// ============================================================================
// GOAL REVIEW DIALOG - Review goal with approve/reject/request changes
// ============================================================================

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
import { Label } from '@/components/ui/label';
import { CheckCircle, XCircle, Edit, AlertCircle } from 'lucide-react';
import type { GoalReviewAction, Goal } from '../types';

interface GoalReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goal: Goal;
  onReview: (action: GoalReviewAction, comments?: string) => Promise<void>;
  isLoading?: boolean;
}

export const GoalReviewDialog = ({
  open,
  onOpenChange,
  goal,
  onReview,
  isLoading = false,
}: GoalReviewDialogProps) => {
  const [selectedAction, setSelectedAction] = useState<GoalReviewAction | null>(null);
  const [comments, setComments] = useState('');
  const [step, setStep] = useState<'select' | 'confirm'>('select');

  const handleActionSelect = (action: GoalReviewAction) => {
    setSelectedAction(action);
    setStep('confirm');
  };

  const handleBack = () => {
    setStep('select');
    setSelectedAction(null);
  };

  const handleSubmit = async () => {
    if (!selectedAction) return;
    await onReview(selectedAction, comments || undefined);
    // Reset state
    setStep('select');
    setSelectedAction(null);
    setComments('');
  };

  const handleCancel = () => {
    onOpenChange(false);
    // Reset after dialog closes
    setTimeout(() => {
      setStep('select');
      setSelectedAction(null);
      setComments('');
    }, 300);
  };

  const reviewActions = [
    {
      action: 'APPROVED' as GoalReviewAction,
      label: 'Approve',
      description: 'Goal looks good, developer can start immediately',
      icon: <CheckCircle className="h-5 w-5" />,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-950/30 hover:bg-green-100 dark:hover:bg-green-950/50',
    },
    {
      action: 'MODIFIED' as GoalReviewAction,
      label: 'Modify & Approve',
      description: 'Make changes to the goal and approve it',
      icon: <Edit className="h-5 w-5" />,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-950/50',
    },
    {
      action: 'REQUESTED_CHANGES' as GoalReviewAction,
      label: 'Request Changes',
      description: 'Ask developer to revise and resubmit',
      icon: <AlertCircle className="h-5 w-5" />,
      color: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-50 dark:bg-amber-950/30 hover:bg-amber-100 dark:hover:bg-amber-950/50',
    },
    {
      action: 'REJECTED' as GoalReviewAction,
      label: 'Reject',
      description: 'Goal is not suitable, should be abandoned',
      icon: <XCircle className="h-5 w-5" />,
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-950/50',
    },
  ];

  const selectedActionData = reviewActions.find(a => a.action === selectedAction);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        {step === 'select' ? (
          <>
            <DialogHeader>
              <DialogTitle>Review Goal</DialogTitle>
              <DialogDescription>
                Review "{goal.title}" and choose an action
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-4">
              {reviewActions.map((actionItem) => (
                <button
                  key={actionItem.action}
                  onClick={() => handleActionSelect(actionItem.action)}
                  disabled={isLoading}
                  className={`w-full flex items-start gap-3 p-4 rounded-lg border-2 border-transparent transition-all ${actionItem.bgColor} disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <div className={actionItem.color}>
                    {actionItem.icon}
                  </div>
                  <div className="flex-1 text-left">
                    <div className={`font-semibold ${actionItem.color}`}>
                      {actionItem.label}
                    </div>
                    <div className="text-sm text-muted-foreground mt-0.5">
                      {actionItem.description}
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isLoading}
              >
                Cancel
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>
                Confirm: {selectedActionData?.label}
              </DialogTitle>
              <DialogDescription>
                Add optional comments to explain your decision
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className={`flex items-start gap-3 p-4 rounded-lg ${selectedActionData?.bgColor}`}>
                <div className={selectedActionData?.color}>
                  {selectedActionData?.icon}
                </div>
                <div className="flex-1">
                  <div className={`font-semibold ${selectedActionData?.color}`}>
                    {selectedActionData?.label}
                  </div>
                  <div className="text-sm text-muted-foreground mt-0.5">
                    {selectedActionData?.description}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="comments">
                  Comments {selectedAction === 'REQUESTED_CHANGES' ? '(Required)' : '(Optional)'}
                </Label>
                <Textarea
                  id="comments"
                  placeholder={
                    selectedAction === 'REQUESTED_CHANGES'
                      ? 'Explain what needs to be changed...'
                      : 'Add any comments or feedback...'
                  }
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  rows={4}
                  className="resize-none"
                />
              </div>

              {selectedAction === 'MODIFIED' && (
                <div className="text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 p-3 rounded-lg">
                  <strong>Note:</strong> You'll be redirected to edit the goal after confirming.
                </div>
              )}
            </div>

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                disabled={isLoading}
              >
                Back
              </Button>
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={
                  isLoading ||
                  (selectedAction === 'REQUESTED_CHANGES' && !comments.trim())
                }
              >
                {isLoading ? 'Processing...' : 'Confirm'}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
