/* eslint-disable @typescript-eslint/no-explicit-any */
import * as authRepo from '../repository/auth.repository';
import type {
  LoginCredentials,
  SignupData,
  ApiResponse,
  AuthResponse,
  SignupCheckResult,
  CompanyCreationData,
} from '@/shared/types';
import { UserRole } from '@/shared/types';

/**
 * AUTH API LAYER
 * 🚨 CRITICAL: This layer consumes the repository layer.
 * Components/Hooks should ONLY interact with this layer, never directly with repository.
 * During NestJS migration, we'll replace these functions with axios/fetch calls.
 */

// ============================================================================
// AUTHENTICATION
// ============================================================================

export const login = async (
  credentials: LoginCredentials
): Promise<ApiResponse<AuthResponse>> => {
  try {
    const authData = await authRepo.signInUser(credentials);

    if (!authData.user) {
      return {
        success: false,
        error: 'Invalid login credentials',
      };
    }

    // Fetch user profile
    const profile = await authRepo.getUserProfileById(authData.user.id);

    return {
      success: true,
      data: {
        user: {
          id: authData.user.id,
          email: authData.user.email!,
          profile,
        },
        profile,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Login failed. Please try again.',
    };
  }
};

export const logout = async (): Promise<ApiResponse<void>> => {
  try {
    await authRepo.signOutUser();
    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Logout failed',
    };
  }
};

export const getCurrentUser = async (): Promise<ApiResponse<AuthResponse>> => {
  try {
    const user = await authRepo.getCurrentAuthUser();

    if (!user) {
      return {
        success: false,
        error: 'No authenticated user',
      };
    }

    const profile = await authRepo.getUserProfileById(user.id);

    return {
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email!,
          profile,
        },
        profile,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to get current user',
    };
  }
};

// ============================================================================
// SIGNUP FLOW
// ============================================================================

/**
 * KEY METHOD: Checks if user has account or pending invite
 * This drives the conditional signup flow
 */
export const checkSignupStatus = async (
  email: string
): Promise<ApiResponse<SignupCheckResult>> => {
  try {
    // Check if user profile exists
    const existingProfile = await authRepo.getUserProfileByEmail(email);

    if (existingProfile) {
      return {
        success: true,
        data: {
          hasAccount: true,
          hasInvite: false,
        },
      };
    }

    // Check if there's a pending invite
    const invite = await authRepo.getInviteByEmail(email);

    if (invite) {
      return {
        success: true,
        data: {
          hasAccount: false,
          hasInvite: true,
          invite,
        },
      };
    }

    // User is new - can create company
    return {
      success: true,
      data: {
        hasAccount: false,
        hasInvite: false,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to check signup status',
    };
  }
};

/**
 * Create new company with admin user
 */
export const createCompanyWithAdmin = async (
  data: CompanyCreationData
): Promise<ApiResponse<AuthResponse>> => {
  try {
    // 1. Create auth user
    const authData = await authRepo.signUpUser(
      data.user_data.email,
      data.user_data.password
    );

    if (!authData.user) {
      return {
        success: false,
        error: 'Failed to create user account',
      };
    }

    // 2. If email confirmation is required, user needs to verify email first
    // We still create the profile so they can log in after confirmation
    if (!authData.session) {
      // Email confirmation required - create minimal profile
      const company = await authRepo.createCompany(data.company_name);
      
      await authRepo.createUserProfile({
        id: authData.user.id,
        company_id: company.id,
        full_name: data.user_data.full_name,
        role: UserRole.COMPANY_ADMIN,
        email: data.user_data.email,
      });

      return {
        success: false,
        error: 'Please check your email to confirm your account before logging in.',
      };
    }

    // 3. Create company
    const company = await authRepo.createCompany(data.company_name);

    // 4. Create user profile as COMPANY_ADMIN
    const profile = await authRepo.createUserProfile({
      id: authData.user.id,
      company_id: company.id,
      full_name: data.user_data.full_name,
      role: UserRole.COMPANY_ADMIN,
      email: data.user_data.email,
    });

    return {
      success: true,
      data: {
        user: {
          id: authData.user.id,
          email: authData.user.email!,
          profile,
        },
        profile,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to create company and account',
    };
  }
};

/**
 * Accept invite and create user account
 */
export const acceptInviteAndSignup = async (
  inviteId: string,
  userData: SignupData
): Promise<ApiResponse<AuthResponse>> => {
  try {
    // 1. Get invite details
    const invite = await authRepo.getInviteByEmail(userData.email);

    if (!invite || invite.id !== inviteId) {
      return {
        success: false,
        error: 'Invalid or expired invitation',
      };
    }

    // 2. Create auth user
    const authData = await authRepo.signUpUser(
      userData.email,
      userData.password
    );

    if (!authData.user) {
      return {
        success: false,
        error: 'Failed to create user account',
      };
    }

    // 3. If email confirmation is required, create profile but don't log in yet
    if (!authData.session) {
      await authRepo.createUserProfile({
        id: authData.user.id,
        company_id: invite.company_id,
        full_name: userData.full_name,
        role: invite.role,
        email: userData.email,
      });

      await authRepo.updateInviteStatus(inviteId, 'ACCEPTED');

      return {
        success: false,
        error: 'Please check your email to confirm your account before logging in.',
      };
    }

    // 4. Create user profile with invite's role and company
    const profile = await authRepo.createUserProfile({
      id: authData.user.id,
      company_id: invite.company_id,
      full_name: userData.full_name,
      role: invite.role,
      email: userData.email,
    });

    // 5. Update invite status to ACCEPTED
    await authRepo.updateInviteStatus(inviteId, 'ACCEPTED');

    return {
      success: true,
      data: {
        user: {
          id: authData.user.id,
          email: authData.user.email!,
          profile,
        },
        profile,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to accept invitation',
    };
  }
};
