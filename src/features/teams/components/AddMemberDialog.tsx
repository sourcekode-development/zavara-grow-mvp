import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useTeams } from '../hooks/useTeams';
import { useAvailableUsers } from '../hooks/useAvailableUsers';

interface AddMemberDialogProps {
  teamId: string;
  companyId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const AddMemberDialog = ({
  teamId,
  companyId,
  open,
  onOpenChange,
  onSuccess,
}: AddMemberDialogProps) => {
  const { user } = useAuth();
  const { addMember } = useTeams();
  const { users, isLoading: loadingUsers } = useAvailableUsers(companyId, teamId);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedUserId) {
      setError('Please select a member to add');
      return;
    }

    if (!user?.profile) {
      setError('User profile not found');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const result = await addMember(
      {
        team_id: teamId,
        user_id: selectedUserId,
      },
      user.profile.id
    );

    setIsSubmitting(false);

    if (result.success) {
      setSelectedUserId('');
      onOpenChange(false);
      onSuccess?.();
    } else {
      setError(result.error || 'Failed to add member');
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setSelectedUserId('');
      setError(null);
      onOpenChange(false);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'COMPANY_ADMIN':
        return 'bg-purple-500/10 text-purple-600 dark:text-purple-400';
      case 'TEAM_LEAD':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400';
      case 'DEVELOPER':
        return 'bg-green-500/10 text-green-600 dark:text-green-400';
      default:
        return 'bg-gray-500/10 text-gray-600 dark:text-gray-400';
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] bg-[#F8F9FA] dark:bg-[#11181C]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add Team Member</DialogTitle>
            <DialogDescription>
              Select a user from your company to add to this team.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {loadingUsers ? (
              <div className="flex items-center justify-center py-8">
                <Spinner className="mr-2" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Loading available users...
                </span>
              </div>
            ) : users.length === 0 ? (
              <div className="text-sm text-gray-600 dark:text-gray-400 py-4 text-center">
                No available users to add. All company members are already in this team.
              </div>
            ) : (
              <div className="grid gap-2">
                <Label htmlFor="select-member">Select Member *</Label>
                <Select
                  value={selectedUserId}
                  onValueChange={setSelectedUserId}
                  disabled={isSubmitting}
                >
                  <SelectTrigger
                    id="select-member"
                    className="bg-white dark:bg-[#1A2633]"
                  >
                    <SelectValue placeholder="Choose a member..." />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-[#1A2633]">
                    {users.map((availableUser) => (
                      <SelectItem key={availableUser.id} value={availableUser.id}>
                        <div className="flex items-center gap-2">
                          <span>{availableUser.full_name}</span>
                          <Badge
                            variant="secondary"
                            className={getRoleBadgeColor(availableUser.role)}
                          >
                            {availableUser.role.replace('_', ' ')}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {selectedUserId && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {users.find((u) => u.id === selectedUserId)?.email}
                  </p>
                )}
              </div>
            )}

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
              disabled={isSubmitting || !selectedUserId || users.length === 0}
              className="bg-[#3DCF8E] hover:bg-[#2fb577] text-white"
            >
              {isSubmitting ? (
                <>
                  <Spinner className="mr-2" />
                  Adding...
                </>
              ) : (
                'Add Member'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
