import { useState, useEffect } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import * as teamsApi from '../apis/teams.api';

/**
 * Hook to check user permissions for a specific team
 */
export const useTeamPermissions = (teamId: string | undefined) => {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState({
    canEdit: false,
    canDelete: false,
    canManageMembers: false,
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!teamId || !user?.profile) {
      setPermissions({
        canEdit: false,
        canDelete: false,
        canManageMembers: false,
      });
      return;
    }

    const fetchPermissions = async () => {
      setIsLoading(true);
      try {
        const perms = await teamsApi.checkUserPermissions(
          teamId,
          user.profile!.id,
          user.profile!.role
        );
        setPermissions(perms);
      } catch {
        setPermissions({
          canEdit: false,
          canDelete: false,
          canManageMembers: false,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchPermissions();
  }, [teamId, user]);

  return { permissions, isLoading };
};
