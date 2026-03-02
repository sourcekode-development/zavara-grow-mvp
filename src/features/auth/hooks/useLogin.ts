import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from './useAuth';
import type { LoginCredentials } from '@/shared/types';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const useLogin = () => {
  const { login } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<LoginCredentials>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const handleLogin = async (data: LoginCredentials) => {
    setIsSubmitting(true);
    setError(null);

    const result = await login(data);

    if (!result.success) {
      setError(result.error || 'Login failed');
      setIsSubmitting(false);
      return false;
    }

    setIsSubmitting(false);
    return true;
  };

  return {
    form,
    handleLogin,
    isSubmitting,
    error,
    clearError: () => setError(null),
  };
};
