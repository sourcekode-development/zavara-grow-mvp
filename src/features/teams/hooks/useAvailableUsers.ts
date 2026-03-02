import { useState, useEffect } from 'react';
import type { UserProfile } from '@/shared/types';
import * as teamsApi from '../apis/teams.api';

/**
 * Hook to fetch available users that can be added to a team
 */
export const useAvailableUsers = (companyId: string | undefined, teamId: string | undefined) => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    if (!companyId || !teamId) {
      setUsers([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    const response = await teamsApi.getAvailableUsersForTeam(companyId, teamId);

    if (response.success && response.data) {
      setUsers(response.data);
    } else {
      setError(response.error || 'Failed to fetch available users');
      setUsers([]);
    }

    setIsLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, [companyId, teamId]);

  return { users, isLoading, error, refetch: fetchUsers };
};
