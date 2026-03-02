// ============================================================================
// REVIEWER SELECTION DIALOG - Select TEAM_LEAD or COMPANY_ADMIN to review goal
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { UserCheck, Users } from 'lucide-react';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { fetchUsers } from '@/features/users/apis/users.api';
import type { UserWithTeams } from '@/features/users/types';

interface ReviewerSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (reviewerId: string) => Promise<void>;
  isLoading?: boolean;
}

export const ReviewerSelectionDialog = ({
  open,
  onOpenChange,
  onSubmit,
  isLoading = false,
}: ReviewerSelectionDialogProps) => {
  const { user } = useAuthStore();
  const [reviewers, setReviewers] = useState<UserWithTeams[]>([]);
  const [selectedReviewerId, setSelectedReviewerId] = useState<string | null>(null);
  const [loadingReviewers, setLoadingReviewers] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadReviewers = useCallback(async () => {
    if (!user?.profile?.company_id) return;

    setLoadingReviewers(true);
    setError(null);

    try {
      // Fetch TEAM_LEAD users
      const teamLeadsResponse = await fetchUsers(user.profile.company_id, {
        role: 'TEAM_LEAD',
        limit: 100,
      });

      // Fetch COMPANY_ADMIN users
      const adminsResponse = await fetchUsers(user.profile.company_id, {
        role: 'COMPANY_ADMIN',
        limit: 100,
      });

      const allReviewers: UserWithTeams[] = [];
      
      if (teamLeadsResponse.success && teamLeadsResponse.data) {
        allReviewers.push(...teamLeadsResponse.data.users);
      }

      if (adminsResponse.success && adminsResponse.data) {
        allReviewers.push(...adminsResponse.data.users);
      }

      // Filter out current user
      const filteredReviewers = allReviewers.filter(r => r.id !== user.id);

      setReviewers(filteredReviewers);

      // Auto-select if only one reviewer available
      if (filteredReviewers.length === 1) {
        setSelectedReviewerId(filteredReviewers[0].id);
      }
    } catch (err) {
      setError('Failed to load reviewers');
      console.error('Error loading reviewers:', err);
    } finally {
      setLoadingReviewers(false);
    }
  }, [user?.profile?.company_id, user?.id]);

  useEffect(() => {
    if (open && user?.profile?.company_id) {
      loadReviewers();
    }
  }, [open, user?.profile?.company_id, loadReviewers]);

  const handleSubmit = async () => {
    if (!selectedReviewerId) return;
    
    console.log('📤 Reviewer selected, submitting:', selectedReviewerId);
    
    try {
      await onSubmit(selectedReviewerId);
      handleClose();
    } catch (error) {
      console.error('❌ Error in reviewer dialog submit:', error);
      // Don't close dialog on error so user can retry
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => {
      setSelectedReviewerId(null);
      setError(null);
    }, 300);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleBadgeColor = (role: string) => {
    return role === 'COMPANY_ADMIN'
      ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
      : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-[#3DCF8E]" />
            Select Reviewer
          </DialogTitle>
          <DialogDescription>
            Choose a Team Lead or Admin to review your goal
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {loadingReviewers ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3 p-3">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-600 dark:text-red-400">
              {error}
            </div>
          ) : reviewers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <UserCheck className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="font-medium">No reviewers available</p>
              <p className="text-sm mt-1">
                Contact your admin to add Team Leads or Admins
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {reviewers.map((reviewer) => (
                <button
                  key={reviewer.id}
                  onClick={() => setSelectedReviewerId(reviewer.id)}
                  disabled={isLoading}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all hover:shadow-sm ${
                    selectedReviewerId === reviewer.id
                      ? 'border-[#3DCF8E] bg-[#3DCF8E]/5'
                      : 'border-transparent bg-muted/50 hover:bg-muted'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-[#3DCF8E]/10 text-[#3DCF8E] font-semibold">
                      {getInitials(reviewer.full_name)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 text-left">
                    <div className="font-semibold">{reviewer.full_name}</div>
                    <div className="text-sm text-muted-foreground">
                      {reviewer.email}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={`text-xs ${getRoleBadgeColor(reviewer.role)}`}>
                        {reviewer.role.replace('_', ' ')}
                      </Badge>
                      {reviewer.teams && reviewer.teams.length > 0 && (
                        <span className="text-xs text-muted-foreground">
                          • {reviewer.teams.length} team{reviewer.teams.length !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>

                  {selectedReviewerId === reviewer.id && (
                    <UserCheck className="h-5 w-5 text-[#3DCF8E]" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={!selectedReviewerId || isLoading || loadingReviewers}
            className="bg-[#3DCF8E] hover:bg-[#34B67A]"
          >
            {isLoading ? 'Submitting...' : 'Submit for Review'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
