import { useState } from 'react';
import { updateUserProfile } from '../apis/users.api';
import type { UserProfile } from '@/shared/types';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { toast } from 'sonner';

export const useUpdateProfile = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setUser, user } = useAuthStore();

  const updateProfile = async (
    userId: string,
    updates: Partial<Omit<UserProfile, 'id' | 'company_id' | 'role' | 'created_at'>>
  ) => {
    setIsSubmitting(true);
    setError(null);

    const response = await updateUserProfile(userId, updates);

    if (response.success && response.data) {
      if (user?.profile?.id === userId) {
        setUser({
          ...user,
          profile: response.data,
        });
      }
      toast.success('Profile updated successfully');
      setIsSubmitting(false);
      return response.data;
    } else {
      const err = response.error || 'Failed to update profile';
      setError(err);
      toast.error(err);
      setIsSubmitting(false);
      return null;
    }
  };

  return { updateProfile, isSubmitting, error };
};
