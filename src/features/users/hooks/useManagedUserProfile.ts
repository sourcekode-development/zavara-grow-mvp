import { useCallback, useEffect, useState } from 'react';
import { getPrograms } from '@/features/upskill/apis/upskill.api';
import type { UpskillProgramWithDetails } from '@/features/upskill/types';
import { getUserDetails } from '../apis/users.api';
import type { UserWithTeams } from '../types';

interface ManagedUserProfileState {
  profile: UserWithTeams | null;
  upskillPrograms: UpskillProgramWithDetails[];
}

export const useManagedUserProfile = (userId?: string) => {
  const [state, setState] = useState<ManagedUserProfileState>({
    profile: null,
    upskillPrograms: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!userId) {
      setState({
        profile: null,
        upskillPrograms: [],
      });
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const [profileResponse, upskillPrograms] = await Promise.all([
        getUserDetails(userId),
        getPrograms({ user_id: userId }),
      ]);

      if (!profileResponse.success || !profileResponse.data) {
        throw new Error(profileResponse.error || 'Failed to load user profile');
      }

      setState({
        profile: profileResponse.data,
        upskillPrograms
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load user profile');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  return {
    ...state,
    isLoading,
    error,
    refetch: load,
  };
};
