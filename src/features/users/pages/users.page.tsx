import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { UserSearchBar } from '../components/UserSearchBar';
import { UsersTable } from '../components/UsersTable';
import { InviteUserDialog } from '../components/InviteUserDialog';
import { useUsers } from '../hooks/useUsers';

export const UsersPage = () => {
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
      />

      <InviteUserDialog
        open={inviteDialogOpen}
        onOpenChange={setInviteDialogOpen}
        onSuccess={refetch}
      />
    </div>
  );
};
