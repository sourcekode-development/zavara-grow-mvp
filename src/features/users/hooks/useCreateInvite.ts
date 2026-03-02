import { useState } from 'react';
import { createInvite } from '../apis/invites.api';
import { useAuthStore } from '@/features/auth/store/auth.store';
import type { InviteFormData } from '../types';

export const useCreateInvite = () => {
  const { user } = useAuthStore();
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = async (formData: InviteFormData) => {
    if (!user?.profile?.company_id || !user?.id) {
      setError('User not authenticated');
      return { success: false };
    }

    setIsCreating(true);
    setError(null);

    const response = await createInvite({
      email: formData.email,
      role: formData.role,
      company_id: user.profile.company_id,
      invited_by: user.id,
    });

    setIsCreating(false);

    if (!response.success) {
      setError(response.error || 'Failed to create invite');
      return { success: false, error: response.error };
    }

    return { success: true, data: response.data };
  };

  return {
    createInvite: create,
    isCreating,
    error,
  };
};
