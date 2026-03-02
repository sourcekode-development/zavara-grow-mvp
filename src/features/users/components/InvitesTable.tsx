import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { InviteStatus, UserRole } from '@/shared/types';
import type { InviteWithDetails } from '../types';
import { revokeInvite } from '../apis/invites.api';
import { toast } from 'sonner';

interface InvitesTableProps {
  invites: InviteWithDetails[];
  isLoading: boolean;
  onRefetch: () => void;
}

const getStatusBadgeColor = (status: string) => {
  switch (status) {
    case InviteStatus.PENDING:
      return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400';
    case InviteStatus.ACCEPTED:
      return 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400';
    case InviteStatus.EXPIRED:
      return 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400';
    case InviteStatus.REVOKED:
      return 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400';
    default:
      return 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400';
  }
};

const getRoleBadgeColor = (role: string) => {
  switch (role) {
    case UserRole.COMPANY_ADMIN:
      return 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400';
    case UserRole.TEAM_LEAD:
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400';
    case UserRole.DEVELOPER:
      return 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400';
    default:
      return 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400';
  }
};

const getRoleLabel = (role: string) => {
  switch (role) {
    case UserRole.COMPANY_ADMIN:
      return 'Company Admin';
    case UserRole.TEAM_LEAD:
      return 'Team Lead';
    case UserRole.DEVELOPER:
      return 'Developer';
    default:
      return role;
  }
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const InvitesTable = ({
  invites,
  isLoading,
  onRefetch,
}: InvitesTableProps) => {
  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false);
  const [selectedInvite, setSelectedInvite] = useState<InviteWithDetails | null>(null);
  const [isRevoking, setIsRevoking] = useState(false);

  const handleRevokeClick = (invite: InviteWithDetails) => {
    setSelectedInvite(invite);
    setRevokeDialogOpen(true);
  };

  const handleConfirmRevoke = async () => {
    if (!selectedInvite) return;

    setIsRevoking(true);
    const response = await revokeInvite(selectedInvite.id);

    if (response.success) {
      toast.success('Invite revoked successfully');
      setRevokeDialogOpen(false);
      setSelectedInvite(null);
      onRefetch();
    } else {
      toast.error(response.error || 'Failed to revoke invite');
    }

    setIsRevoking(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (invites.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-muted-foreground">No invites found</p>
        <p className="text-sm text-muted-foreground mt-1">
          Send your first invite to get started
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Invited By</TableHead>
              <TableHead>Sent Date</TableHead>
              <TableHead>Expires</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invites.map((invite) => (
              <TableRow key={invite.id}>
                <TableCell className="font-medium">{invite.email}</TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    className={getRoleBadgeColor(invite.role)}
                  >
                    {getRoleLabel(invite.role)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    className={getStatusBadgeColor(invite.status)}
                  >
                    {invite.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {invite.inviter?.full_name || 'N/A'}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDate(invite.created_at)}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDate(invite.expires_at)}
                </TableCell>
                <TableCell className="text-right">
                  {invite.status === InviteStatus.PENDING && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRevokeClick(invite)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                    >
                      Revoke
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Revoke Confirmation Dialog */}
      <Dialog open={revokeDialogOpen} onOpenChange={setRevokeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Revoke Invite</DialogTitle>
            <DialogDescription>
              Are you sure you want to revoke this invite? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm">
              <strong>Email:</strong> {selectedInvite?.email}
            </p>
            <p className="text-sm mt-1">
              <strong>Role:</strong> {selectedInvite && getRoleLabel(selectedInvite.role)}
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRevokeDialogOpen(false)}
              disabled={isRevoking}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmRevoke}
              disabled={isRevoking}
            >
              {isRevoking ? 'Revoking...' : 'Revoke Invite'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
