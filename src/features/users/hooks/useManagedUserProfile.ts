import { useCallback, useEffect, useState } from 'react';
import { getPrograms } from '@/features/upskill/apis/upskill.api';
import { getAssignedKpis } from '@/features/kpis/apis/kpis.api';
import type { AssignedKpi } from '@/features/kpis/types';
import type { UpskillProgramWithDetails } from '@/features/upskill/types';
import { getUserDetails } from '../apis/users.api';
import type { UserWithTeams } from '../types';

interface ManagedUserProfileState {
  profile: UserWithTeams | null;
  upskillPrograms: UpskillProgramWithDetails[];
  kpis: AssignedKpi[];
}

export const useManagedUserProfile = (userId?: string) => {
  const [state, setState] = useState<ManagedUserProfileState>({
    profile: null,
    upskillPrograms: [],
    kpis: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!userId) {
      setState({
        profile: null,
        upskillPrograms: [],
        kpis: [],
      });
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const [profileResponse, upskillPrograms, kpis] = await Promise.all([
        getUserDetails(userId),
        getPrograms({ user_id: userId }),
        getAssignedKpis({ developer_id: userId, status: 'ALL' }),
      ]);

      if (!profileResponse.success || !profileResponse.data) {
        throw new Error(profileResponse.error || 'Failed to load user profile');
      }

      setState({
        profile: profileResponse.data,
        upskillPrograms,
        kpis,
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
