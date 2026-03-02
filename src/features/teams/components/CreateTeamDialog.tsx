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
import type { CreateTeamFormData } from '../types';

interface CreateTeamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const CreateTeamDialog = ({
  open,
  onOpenChange,
  onSuccess,
}: CreateTeamDialogProps) => {
  const { user } = useAuth();
  const { createTeam } = useTeams();
  const [formData, setFormData] = useState<CreateTeamFormData>({
    name: '',
    company_id: user?.profile?.company_id || '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('Team name is required');
      return;
    }

    if (!user?.profile) {
      setError('User profile not found');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const result = await createTeam(
      {
        name: formData.name.trim(),
        company_id: user.profile.company_id,
      },
      user.profile.id
    );

    setIsSubmitting(false);

    if (result.success) {
      setFormData({ name: '', company_id: user.profile.company_id });
      onOpenChange(false);
      onSuccess?.();
    } else {
      setError(result.error || 'Failed to create team');
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setFormData({ name: '', company_id: user?.profile?.company_id || '' });
      setError(null);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px] bg-[#F8F9FA] dark:bg-[#11181C]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Team</DialogTitle>
            <DialogDescription>
              Add a new team to organize your developers. Team Leads can manage teams they create.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="team-name">Team Name *</Label>
              <Input
                id="team-name"
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
                  Creating...
                </>
              ) : (
                'Create Team'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
