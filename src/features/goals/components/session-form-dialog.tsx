import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import type { CadenceSession, CadenceSessionStatus } from '../types';

interface SessionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (sessionData: Partial<CadenceSession>) => void;
  session?: CadenceSession | null;
  goalId: string;
  milestones?: Array<{ id: string; title: string }>;
}

export const SessionFormDialog = ({
  open,
  onOpenChange,
  onSave,
  session,
  goalId,
  milestones = [],
}: SessionFormDialogProps) => {
  const [formData, setFormData] = useState<Partial<CadenceSession>>({
    goal_id: goalId,
    title: '',
    description: '',
    scheduled_date: null,
    duration_minutes: 60,
    status: 'TO_DO',
    notes: '',
    milestone_id: null,
  });

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  useEffect(() => {
    if (session) {
      setFormData({
        ...session,
        goal_id: goalId,
      });
      if (session.scheduled_date) {
        setSelectedDate(new Date(session.scheduled_date));
      }
    } else {
      setFormData({
        goal_id: goalId,
        title: '',
        description: '',
        scheduled_date: null,
        duration_minutes: 60,
        status: 'TO_DO',
        notes: '',
        milestone_id: null,
      });
      setSelectedDate(undefined);
    }
  }, [session, goalId]);

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    setFormData({
      ...formData,
      scheduled_date: date ? date.toISOString().split('T')[0] : null,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onOpenChange(false);
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

          <div className="grid grid-cols-2 gap-4">
            {/* Scheduled Date */}
            <div className="space-y-2">
              <Label>Scheduled Date</Label>
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
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={handleDateSelect}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Duration */}
            <div className="space-y-2">
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Input
                id="duration"
                type="number"
                min="15"
                step="15"
                value={formData.duration_minutes || 60}
                onChange={(e) =>
                  setFormData({ ...formData, duration_minutes: parseInt(e.target.value) || 60 })
                }
              />
            </div>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
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
          </div>

          {/* Notes */}
          {/* <div className="space-y-2">
            <Label htmlFor="notes">Session Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add notes or summary for this session..."
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
            />
          </div> */}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-[#3DCF8E] hover:bg-[#3DCF8E]/90">
              {session ? 'Update Session' : 'Add Session'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
