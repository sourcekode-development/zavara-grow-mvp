/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable react-hooks/preserve-manual-memoization */
import { useState, useEffect, useCallback } from 'react';
import { fetchInvites } from '../apis/invites.api';
import { useAuthStore } from '@/features/auth/store/auth.store';
import type { InviteWithDetails } from '../types';

export const useInvites = () => {
  const { user } = useAuthStore();
  const [invites, setInvites] = useState<InviteWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadInvites = useCallback(async () => {
    if (!user?.profile?.company_id) return;

    setIsLoading(true);
    setError(null);

    const response = await fetchInvites(user.profile.company_id);

    if (response.success && response.data) {
      setInvites(response.data);
    } else {
      setError(response.error || 'Failed to load invites');
    }

    setIsLoading(false);
  }, [user?.profile?.company_id]);

  useEffect(() => {
    loadInvites();
  }, [loadInvites]);

  const refetch = () => {
    loadInvites();
  };

  return {
    invites,
    isLoading,
    error,
    refetch,
  };
};
