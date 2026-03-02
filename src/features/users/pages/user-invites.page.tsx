import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { InvitesTable } from '../components/InvitesTable';
import { InviteUserDialog } from '../components/InviteUserDialog';
import { useInvites } from '../hooks/useInvites';

export const UserInvitesPage = () => {
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const { invites, isLoading, refetch } = useInvites();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Invites</h1>
          <p className="text-muted-foreground">
            Manage user invitations and their status
          </p>
        </div>
        <Button
          className="bg-[#3DCF8E] hover:bg-[#3DCF8E]/90"
          onClick={() => setInviteDialogOpen(true)}
        >
          Send Invite
        </Button>
      </div>

      <InvitesTable
        invites={invites}
        isLoading={isLoading}
        onRefetch={refetch}
      />

      <InviteUserDialog
        open={inviteDialogOpen}
        onOpenChange={setInviteDialogOpen}
        onSuccess={refetch}
      />
    </div>
  );
};