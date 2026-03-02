/* eslint-disable @typescript-eslint/no-explicit-any */
import * as usersRepo from '../repository/users.repository';
import type { ApiResponse } from '@/shared/types';
import type { UserWithTeams, UserFilters, PaginatedUsers } from '../types';

/**
 * USERS API LAYER
 * 🚨 CRITICAL: This layer consumes the repository layer.
 * Components/Hooks should ONLY interact with this layer, never directly with repository.
 * During NestJS migration, we'll replace these functions with axios/fetch calls.
 */

// ============================================================================
// USER OPERATIONS
// ============================================================================

export const fetchUsers = async (
  companyId: string,
  filters?: UserFilters
): Promise<ApiResponse<PaginatedUsers>> => {
  try {
    const { users, count } = await usersRepo.getUsersByCompanyId(
      companyId,
      filters
    );

    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const totalPages = Math.ceil(count / limit);

    return {
      success: true,
      data: {
        users,
        total: count,
        page,
        limit,
        totalPages,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to fetch users',
    };
  }
};

export const searchUsers = async (
  companyId: string,
  searchTerm: string
): Promise<ApiResponse<UserWithTeams[]>> => {
  try {
    const { users } = await usersRepo.getUsersByCompanyId(companyId, {
      search: searchTerm,
      limit: 50, // Limit search results
    });

    return {
      success: true,
      data: users,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to search users',
    };
  }
};

export const getUserDetails = async (
  userId: string
): Promise<ApiResponse<UserWithTeams>> => {
  try {
    const user = await usersRepo.getUserById(userId);

    return {
      success: true,
      data: user,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to fetch user details',
    };
  }
};
