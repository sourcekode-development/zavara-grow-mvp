import { supabase } from '@/shared/config/supabase';
import type { UserWithTeams, UserFilters } from '../types';

/**
 * USERS REPOSITORY LAYER
 * 🚨 CRITICAL: This is the ONLY file that should contain direct Supabase calls for users.
 * NO business logic here - just raw database operations.
 * This layer will be deleted during NestJS migration.
 */

// ============================================================================
// USER QUERIES
// ============================================================================

export const getUsersByCompanyId = async (
  companyId: string,
  filters?: UserFilters
) => {
  let query = supabase
    .from('user_profiles')
    .select(`
      *,
      teams:team_members!team_members_user_id_fkey(
        team:teams(
          id,
          name
        )
      )
    `, { count: 'exact' })
    .eq('company_id', companyId);

  // Apply role filter
  if (filters?.role) {
    query = query.eq('role', filters.role);
  }

  // Apply search filter (name or email)
  if (filters?.search) {
    query = query.or(`full_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
  }

  // Apply pagination
  const page = filters?.page || 1;
  const limit = filters?.limit || 20;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) throw error;

  // Transform the data to flatten team structure
  const users = data?.map((user) => ({
    ...user,
    teams: user.teams?.map((tm: { team: { id: string; name: string } }) => tm.team).filter(Boolean) || [],
  })) || [];

  return { users: users as UserWithTeams[], count: count || 0 };
};

export const getUserById = async (userId: string) => {
  const { data, error } = await supabase
    .from('user_profiles')
    .select(`
      *,
      teams:team_members!team_members_user_id_fkey(
        team:teams(
          id,
          name
        )
      )
    `)
    .eq('id', userId)
    .single();

  if (error) throw error;

  // Transform the data
  const user = {
    ...data,
    teams: data.teams?.map((tm: { team: { id: string; name: string } }) => tm.team).filter(Boolean) || [],
  };

  return user as UserWithTeams;
};

export const getUserCount = async (companyId: string, filters?: UserFilters) => {
  let query = supabase
    .from('user_profiles')
    .select('id', { count: 'exact', head: true })
    .eq('company_id', companyId);

  // Apply role filter
  if (filters?.role) {
    query = query.eq('role', filters.role);
  }

  // Apply search filter
  if (filters?.search) {
    query = query.or(`full_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
  }

  const { count, error } = await query;

  if (error) throw error;
  return count || 0;
};

export const getUsersByIds = async (userIds: string[]) => {
  if (userIds.length === 0) return [];

  const { data, error } = await supabase
    .from('user_profiles')
    .select('id, full_name, email')
    .in('id', userIds);

  if (error) throw error;
  return data || [];
};
