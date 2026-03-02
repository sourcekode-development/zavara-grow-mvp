/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useCallback } from 'react';
import { fetchUsers } from '../apis/users.api';
import { useAuthStore } from '@/features/auth/store/auth.store';
import type { UserFilters, PaginatedUsers } from '../types';
import type { UserRole } from '@/shared/types';

export const useUsers = () => {
  const { user } = useAuthStore();
  const [data, setData] = useState<PaginatedUsers>({
    users: [],
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | undefined>(undefined);
  const [page, setPage] = useState(1);

  const loadUsers = useCallback(async () => {
    if (!user?.profile?.company_id) return;

    setIsLoading(true);
    setError(null);

    const filters: UserFilters = {
      page,
      limit: 20,
      search: activeSearch || undefined,
      role: roleFilter,
    };

    const response = await fetchUsers(user.profile.company_id, filters);

    if (response.success && response.data) {
      setData(response.data);
    } else {
      setError(response.error || 'Failed to load users');
    }

    setIsLoading(false);
  }, [user, page, activeSearch, roleFilter]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleSearch = () => {
    setActiveSearch(searchTerm);
    setPage(1); // Reset to first page on new search
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setActiveSearch('');
    setPage(1);
  };

  const refetch = () => {
    loadUsers();
  };

  return {
    users: data.users,
    total: data.total,
    page: data.page,
    limit: data.limit,
    totalPages: data.totalPages,
    isLoading,
    error,
    searchTerm,
    setSearchTerm,
    roleFilter,
    setRoleFilter,
    setPage,
    handleSearch,
    handleClearSearch,
    refetch,
  };
};
