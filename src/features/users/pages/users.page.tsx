import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { UserRole } from '@/shared/types';
import { UserSearchBar } from '../components/UserSearchBar';
import { UsersTable } from '../components/UsersTable';
import { InviteUserDialog } from '../components/InviteUserDialog';
import { useUsers } from '../hooks/useUsers';

export const UsersPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const {
    users,
    page,
    totalPages,
    isLoading,
    searchTerm,
    setSearchTerm,
    setPage,
    handleSearch,
    handleClearSearch,
    refetch,
  } = useUsers();

  const canViewFullProfiles =
    user?.profile?.role === UserRole.COMPANY_ADMIN ||
    user?.profile?.role === UserRole.TEAM_LEAD;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">All Users</h1>
          <p className="text-muted-foreground">
            Manage user accounts and permissions
          </p>
        </div>
        <Button
          className="bg-[#3DCF8E] hover:bg-[#3DCF8E]/90"
          onClick={() => setInviteDialogOpen(true)}
        >
          Invite User
        </Button>
      </div>

      <UserSearchBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onSearch={handleSearch}
        onClear={handleClearSearch}
      />

      <UsersTable
        users={users}
        isLoading={isLoading}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        onViewUser={
          canViewFullProfiles ? (userId) => navigate(`/users/${userId}`) : undefined
        }
      />

      <InviteUserDialog
        open={inviteDialogOpen}
        onOpenChange={setInviteDialogOpen}
        onSuccess={refetch}
      />
    </div>
  );
};
