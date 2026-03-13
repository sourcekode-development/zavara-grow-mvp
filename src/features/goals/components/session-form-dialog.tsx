import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Loader2 } from 'lucide-react';
import type { CadenceSession, CadenceSessionStatus } from '../types';

interface SessionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (sessionData: Partial<CadenceSession>) => Promise<boolean>;
  session?: CadenceSession | null;
  goalId: string;
  milestones?: Array<{ id: string; title: string }>;
  canEditProgress?: boolean;
}

export const SessionFormDialog = ({
  open,
  onOpenChange,
  onSave,
  session,
  goalId,
  milestones = [],
  canEditProgress = true,
}: SessionFormDialogProps) => {
  const progressLockedMessage = 'Goal is not started. Please start the goal first.';
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<Partial<CadenceSession>>({
    goal_id: goalId,
    title: '',
    description: '',
    scheduled_date: null,
    duration_minutes: 60,
    session_effort: 1,
    completed_effort: 0,
    status: 'TO_DO',
    notes: '',
    milestone_id: null,
  });

  useEffect(() => {
    if (session) {
      setFormData({
        ...session,
        goal_id: goalId,
      });
    } else {
      setFormData({
        goal_id: goalId,
        title: '',
        description: '',
        scheduled_date: null,
        duration_minutes: 60,
        session_effort: 1,
        completed_effort: 0,
        status: 'TO_DO',
        notes: '',
        milestone_id: null,
      });
    }
  }, [session, goalId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const success = await onSave(formData);
      if (success) {
        onOpenChange(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const statusOptions: Array<{ value: CadenceSessionStatus; label: string }> = [
    { value: 'TO_DO', label: 'To Do' },
    { value: 'IN_PROGRESS', label: 'In Progress' },
    { value: 'COMPLETED', label: 'Completed' },
    { value: 'DUE', label: 'Due' },
    { value: 'MISSED', label: 'Missed' },
    { value: 'SKIPPED', label: 'Skipped' },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{session ? 'Edit Session' : 'Add New Session'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Session Title</Label>
            <Input
              id="title"
              placeholder="e.g., AWS Lambda Deep Dive"
              value={formData.title || ''}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="What will be covered in this session?"
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          {/* Milestone Selection */}
          {milestones.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="milestone">Milestone (Optional)</Label>
              <Select
                value={formData.milestone_id || 'none'}
                onValueChange={(value) =>
                  setFormData({ ...formData, milestone_id: value === 'none' ? null : value })
                }
              >
                <SelectTrigger id="milestone">
                  <SelectValue placeholder="Select a milestone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Milestone</SelectItem>
                  {milestones.map((milestone) => (
                    <SelectItem key={milestone.id} value={milestone.id}>
                      {milestone.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="sessionEffort">Session Effort</Label>
            <Input
              id="sessionEffort"
              type="number"
              min="0.1"
              step="0.1"
              value={formData.session_effort || 1}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  session_effort: Number(e.target.value) || 1,
                })
              }
            />
            <p className="text-xs text-muted-foreground">
              Planned effort for this session. Supports decimals (example: 0.5).
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="completedEffort">Completed Effort</Label>
            {canEditProgress ? (
              <Input
                id="completedEffort"
                type="number"
                min="0"
                step="0.1"
                value={formData.completed_effort ?? 0}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    completed_effort: Number(e.target.value) || 0,
                  })
                }
              />
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="block">
                    <Input
                      id="completedEffort"
                      type="number"
                      min="0"
                      step="0.1"
                      value={formData.completed_effort ?? 0}
                      disabled
                      title={progressLockedMessage}
                      onChange={() => {}}
                    />
                  </span>
                </TooltipTrigger>
                <TooltipContent>{progressLockedMessage}</TooltipContent>
              </Tooltip>
            )}
            <p className="text-xs text-muted-foreground">
              Actual effort completed in this session. Supports decimals (example: 2.5).
            </p>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            {canEditProgress ? (
              <Select
                value={formData.status || 'TO_DO'}
                onValueChange={(value) =>
                  setFormData({ ...formData, status: value as CadenceSessionStatus })
                }
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="block">
                    <Select
                      value={formData.status || 'TO_DO'}
                      disabled
                      onValueChange={() => {}}
                    >
                      <SelectTrigger id="status" title={progressLockedMessage}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </span>
                </TooltipTrigger>
                <TooltipContent>{progressLockedMessage}</TooltipContent>
              </Tooltip>
            )}
            {!canEditProgress && (
              <p className="text-xs text-muted-foreground">
                {progressLockedMessage}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-[#3DCF8E] hover:bg-[#3DCF8E]/90"
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isSubmitting
                ? session
                  ? 'Updating...'
                  : 'Creating...'
                : session
                  ? 'Update Session'
                  : 'Add Session'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
