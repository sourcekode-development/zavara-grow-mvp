import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Spinner } from '@/components/ui/spinner';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useTeams } from '../hooks/useTeams';
import type { TeamWithDetails, UpdateTeamFormData } from '../types';

interface EditTeamDialogProps {
  team: TeamWithDetails | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const EditTeamDialog = ({
  team,
  open,
  onOpenChange,
  onSuccess,
}: EditTeamDialogProps) => {
  const { user } = useAuth();
  const { updateTeam } = useTeams();
  const [formData, setFormData] = useState<UpdateTeamFormData>({
    name: team?.name || '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('Team name is required');
      return;
    }

    if (!user?.profile || !team) {
      setError('User profile or team not found');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const result = await updateTeam(
      team.id,
      { name: formData.name.trim() },
      user.profile.id,
      user.profile.role
    );

    setIsSubmitting(false);

    if (result.success) {
      onOpenChange(false);
      onSuccess?.();
    } else {
      setError(result.error || 'Failed to update team');
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setError(null);
      onOpenChange(false);
    }
  };

  // Sync form data when team changes
  if (team && formData.name !== team.name && !isSubmitting) {
    setFormData({ name: team.name });
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px] bg-[#F8F9FA] dark:bg-[#11181C]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Team</DialogTitle>
            <DialogDescription>
              Update the team name. This will be visible to all team members.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-team-name">Team Name *</Label>
              <Input
                id="edit-team-name"
                placeholder="e.g., Frontend Squad, Cloud Infrastructure"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                disabled={isSubmitting}
                className="bg-white dark:bg-[#1A2633]"
              />
            </div>

            {error && (
              <div className="text-sm text-red-500 dark:text-red-400">
                {error}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !formData.name.trim()}
              className="bg-[#3DCF8E] hover:bg-[#2fb577] text-white"
            >
              {isSubmitting ? (
                <>
                  <Spinner className="mr-2" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
