import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon, Info } from 'lucide-react';
import { format } from 'date-fns';
import type { Checkpoint, CheckpointType, CheckpointTriggerType, CreateCheckpointRequest } from '../types';
import { fetchUsers } from '@/features/users/apis/users.api';
import { useAuthStore } from '@/features/auth/store/auth.store';

interface CheckpointFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: CreateCheckpointRequest) => Promise<void>;
  goalId: string;
  milestones: Array<{ id: string; title: string }>;
  checkpoint?: Checkpoint | null;
  isLoading?: boolean;
}

interface Reviewer {
  id: string;
  full_name: string;
  role: string;
}

export const CheckpointFormDialog = ({
  open,
  onOpenChange,
  onSave,
  goalId,
  milestones = [],
  checkpoint,
  isLoading = false,
}: CheckpointFormDialogProps) => {
  const { user } = useAuthStore();
  const [reviewers, setReviewers] = useState<Reviewer[]>([]);
  const [loadingReviewers, setLoadingReviewers] = useState(false);
  
  const [formData, setFormData] = useState<Partial<CreateCheckpointRequest>>({
    goal_id: goalId,
    title: '',
    description: '',
    type: 'MANUAL_REVIEW',
    trigger_type: 'MANUAL',
    milestone_id: undefined,
    trigger_config: undefined,
    scheduled_date: undefined,
    assigned_reviewer_id: undefined,
  });

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [afterDays, setAfterDays] = useState<string>('');

  // Load reviewers
  useEffect(() => {
    const loadReviewers = async () => {
      if (!user?.profile?.company_id || !open) return;
      
      setLoadingReviewers(true);
      try {
        const response = await fetchUsers(user.profile.company_id, {
          role: 'TEAM_LEAD', // Filter by TEAM_LEAD first
        });
        
        if (response.success && response.data) {
          // Get both TEAM_LEAD and COMPANY_ADMIN users
          const adminResponse = await fetchUsers(user.profile.company_id, {
            role: 'COMPANY_ADMIN',
          });
          
          const allReviewers = [
            ...response.data.users,
            ...(adminResponse.success && adminResponse.data ? adminResponse.data.users : []),
          ];
          setReviewers(allReviewers);
        }
      } catch (error) {
        console.error('Failed to load reviewers:', error);
      } finally {
        setLoadingReviewers(false);
      }
    };

    loadReviewers();
  }, [user?.profile?.company_id, open]);

  // Initialize form when checkpoint provided (edit mode)
  useEffect(() => {
    if (checkpoint) {
      setFormData({
        goal_id: goalId,
        title: checkpoint.title,
        description: checkpoint.description || '',
        type: checkpoint.type,
        trigger_type: checkpoint.trigger_type || 'MANUAL',
        milestone_id: checkpoint.milestone_id || undefined,
        trigger_config: checkpoint.trigger_config || undefined,
        scheduled_date: checkpoint.scheduled_date || undefined,
        assigned_reviewer_id: checkpoint.assigned_reviewer_id || undefined,
      });

      if (checkpoint.scheduled_date) {
        setSelectedDate(new Date(checkpoint.scheduled_date));
      }

      if (checkpoint.trigger_config?.after_days) {
        setAfterDays(checkpoint.trigger_config.after_days.toString());
      }
    } else {
      // Reset for new checkpoint
      setFormData({
        goal_id: goalId,
        title: '',
        description: '',
        type: 'MANUAL_REVIEW',
        trigger_type: 'MANUAL',
        milestone_id: undefined,
        trigger_config: undefined,
        scheduled_date: undefined,
        assigned_reviewer_id: undefined,
      });
      setSelectedDate(undefined);
      setAfterDays('');
    }
  }, [checkpoint, goalId, open]);

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    setFormData({
      ...formData,
      scheduled_date: date ? date.toISOString().split('T')[0] : undefined,
    });
  };

  const handleTriggerTypeChange = (value: CheckpointTriggerType) => {
    setFormData({
      ...formData,
      trigger_type: value,
      trigger_config: undefined,
      milestone_id: undefined,
    });
    setAfterDays('');
  };

  const handleAfterDaysChange = (value: string) => {
    setAfterDays(value);
    const days = parseInt(value);
    if (!isNaN(days) && days > 0) {
      setFormData({
        ...formData,
        trigger_config: {
          after_days: days,
          from_start: true,
        },
      });
    } else {
      setFormData({
        ...formData,
        trigger_config: undefined,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title?.trim()) {
      return;
    }

    // Validation
    if (formData.trigger_type === 'AFTER_DAYS' && !formData.trigger_config?.after_days) {
      return;
    }

    if (formData.trigger_type === 'AFTER_MILESTONE' && !formData.milestone_id) {
      return;
    }

    const requestData: CreateCheckpointRequest = {
      goal_id: goalId,
      title: formData.title.trim(),
      description: formData.description?.trim() || undefined,
      type: formData.type as CheckpointType,
      trigger_type: formData.trigger_type,
      trigger_config: formData.trigger_config || undefined,
      milestone_id: formData.milestone_id,
      scheduled_date: formData.scheduled_date,
      assigned_reviewer_id: formData.assigned_reviewer_id,
    };

    await onSave(requestData);
    onOpenChange(false);
  };

  const isFormValid = () => {
    if (!formData.title?.trim()) return false;
    if (formData.trigger_type === 'AFTER_DAYS' && !formData.trigger_config?.after_days) return false;
    if (formData.trigger_type === 'AFTER_MILESTONE' && !formData.milestone_id) return false;
    return true;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{checkpoint ? 'Edit Checkpoint' : 'Add New Checkpoint'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">
              Checkpoint Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              placeholder="e.g., Week 2 Progress Review"
              value={formData.title || ''}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="What will be reviewed at this checkpoint?"
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Checkpoint Type */}
            <div className="space-y-2">
              <Label htmlFor="type">Checkpoint Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value as CheckpointType })}
              >
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MANUAL_REVIEW">Manual Review</SelectItem>
                  <SelectItem value="AI_INTERVIEW">AI Interview</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Trigger Type */}
            <div className="space-y-2">
              <Label htmlFor="trigger">Trigger</Label>
              <Select
                value={formData.trigger_type || 'MANUAL'}
                onValueChange={(value) => handleTriggerTypeChange(value as CheckpointTriggerType)}
              >
                <SelectTrigger id="trigger">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MANUAL">Manual</SelectItem>
                  <SelectItem value="AFTER_DAYS">After Days</SelectItem>
                  <SelectItem value="AFTER_MILESTONE">After Milestone</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Conditional Fields Based on Trigger Type */}
          {formData.trigger_type === 'AFTER_DAYS' && (
            <div className="space-y-2">
              <Label htmlFor="afterDays">
                Days from Start <span className="text-red-500">*</span>
              </Label>
              <Input
                id="afterDays"
                type="number"
                min="1"
                placeholder="e.g., 7"
                value={afterDays}
                onChange={(e) => handleAfterDaysChange(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground flex items-start gap-1">
                <Info className="h-3 w-3 mt-0.5 shrink-0" />
                Checkpoint will be triggered after this many days from goal start
              </p>
            </div>
          )}

          {formData.trigger_type === 'AFTER_MILESTONE' && milestones.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="milestone">
                Select Milestone <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.milestone_id || 'none'}
                onValueChange={(value) =>
                  setFormData({ ...formData, milestone_id: value === 'none' ? undefined : value })
                }
              >
                <SelectTrigger id="milestone">
                  <SelectValue placeholder="Choose a milestone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Select Milestone</SelectItem>
                  {milestones.map((milestone) => (
                    <SelectItem key={milestone.id} value={milestone.id}>
                      {milestone.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground flex items-start gap-1">
                <Info className="h-3 w-3 mt-0.5 shrink-0" />
                Checkpoint will be triggered when this milestone is completed
              </p>
            </div>
          )}

          {formData.trigger_type === 'AFTER_MILESTONE' && milestones.length === 0 && (
            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                No milestones available. Please add milestones to the goal first.
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {/* Scheduled Date */}
            <div className="space-y-2">
              <Label>Scheduled Date (Optional)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, 'MMM dd, yyyy') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={selectedDate} onSelect={handleDateSelect} />
                </PopoverContent>
              </Popover>
            </div>

            {/* Assign Reviewer */}
            <div className="space-y-2">
              <Label htmlFor="reviewer">Assign Reviewer (Optional)</Label>
              <Select
                value={formData.assigned_reviewer_id || 'none'}
                onValueChange={(value) =>
                  setFormData({ ...formData, assigned_reviewer_id: value === 'none' ? undefined : value })
                }
                disabled={loadingReviewers}
              >
                <SelectTrigger id="reviewer">
                  <SelectValue placeholder={loadingReviewers ? 'Loading...' : 'Select reviewer'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Reviewer</SelectItem>
                  {reviewers.map((reviewer) => (
                    <SelectItem key={reviewer.id} value={reviewer.id}>
                      {reviewer.full_name} ({reviewer.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-[#3DCF8E] hover:bg-[#3DCF8E]/90"
              disabled={isLoading || !isFormValid()}
            >
              {checkpoint ? 'Update Checkpoint' : 'Add Checkpoint'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
