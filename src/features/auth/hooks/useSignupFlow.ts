import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import * as authApi from '../apis/auth.api';
import { useAuthStore } from '../store/auth.store';
import type { SignupData, CompanyCreationData, SignupCheckResult } from '@/shared/types';

const signupSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirm_password: z.string(),
}).refine((data) => data.password === data.confirm_password, {
  message: "Passwords don't match",
  path: ['confirm_password'],
});

const companySchema = z.object({
  company_name: z.string().min(2, 'Company name must be at least 2 characters'),
});

export type SignupStep = 'email_check' | 'has_account' | 'has_invite' | 'create_company';

export const useSignupFlow = () => {
  const setUser = useAuthStore((state) => state.setUser);
  const [currentStep, setCurrentStep] = useState<SignupStep>('email_check');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signupCheckResult, setSignupCheckResult] = useState<SignupCheckResult | null>(null);

  const signupForm = useForm<SignupData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      full_name: '',
      email: '',
      password: '',
      confirm_password: '',
    },
  });

  const companyForm = useForm<{ company_name: string }>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      company_name: '',
    },
  });

  /**
   * Step 1: Check if user exists or has invite
   */
  const checkEmail = async (email: string) => {
    setIsSubmitting(true);
    setError(null);

    const response = await authApi.checkSignupStatus(email);

    if (!response.success || !response.data) {
      setError(response.error || 'Failed to verify email');
      setIsSubmitting(false);
      return;
    }

    setSignupCheckResult(response.data);

    if (response.data.hasAccount) {
      setCurrentStep('has_account');
    } else if (response.data.hasInvite) {
      setCurrentStep('has_invite');
    } else {
      setCurrentStep('create_company');
    }

    setIsSubmitting(false);
  };

  /**
   * Step 2a: Accept invite and create account
   */
  const acceptInviteAndSignup = async (userData: SignupData) => {
    if (!signupCheckResult?.invite) {
      setError('No invite found');
      return false;
    }

    setIsSubmitting(true);
    setError(null);

    const response = await authApi.acceptInviteAndSignup(
      signupCheckResult.invite.id,
      userData
    );

    if (!response.success || !response.data) {
      setError(response.error || 'Failed to create account');
      setIsSubmitting(false);
      return false;
    }

    setUser(response.data.user);
    setIsSubmitting(false);
    return true;
  };

  /**
   * Step 2b: Create company and admin account
   */
  const createCompanyAndSignup = async (companyData: CompanyCreationData) => {
    setIsSubmitting(true);
    setError(null);

    const response = await authApi.createCompanyWithAdmin(companyData);

    if (!response.success || !response.data) {
      setError(response.error || 'Failed to create company');
      setIsSubmitting(false);
      return false;
    }

    setUser(response.data.user);
    setIsSubmitting(false);
    return true;
  };

  const resetFlow = () => {
    setCurrentStep('email_check');
    setSignupCheckResult(null);
    setError(null);
    signupForm.reset();
    companyForm.reset();
  };

  return {
    currentStep,
    signupForm,
    companyForm,
    isSubmitting,
    error,
    signupCheckResult,
    checkEmail,
    acceptInviteAndSignup,
    createCompanyAndSignup,
    resetFlow,
    clearError: () => setError(null),
  };
};
