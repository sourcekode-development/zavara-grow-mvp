import { supabase } from '@/shared/config/supabase';
import type { Team } from '@/shared/types';

/**
 * TEAMS REPOSITORY LAYER
 * 🚨 CRITICAL: This is the ONLY file that should contain direct Supabase calls.
 * NO business logic here - just raw database operations.
 * This layer will be deleted during NestJS migration.
 */

// ============================================================================
// TEAMS CRUD OPERATIONS
// ============================================================================

export const getAllTeamsByCompany = async (companyId: string) => {
  const { data, error } = await supabase
    .from('teams')
    .select(`
      *,
      creator:user_profiles!teams_created_by_fkey(id, full_name, email, role),
      team_members(count)
    `)
    .eq('company_id', companyId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  
  // Transform the data to include member_count
  return (data || []).map((team) => ({
    ...team,
    member_count: team.team_members?.[0]?.count || 0,
    team_members: undefined, // Remove the raw count data
  }));
};

export const getTeamsByCreator = async (userId: string) => {
  const { data, error } = await supabase
    .from('teams')
    .select(`
      *,
      creator:user_profiles!teams_created_by_fkey(id, full_name, email, role),
      team_members(count)
    `)
    .eq('created_by', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  
  return (data || []).map((team) => ({
    ...team,
    member_count: team.team_members?.[0]?.count || 0,
    team_members: undefined,
  }));
};

export const getTeamsByUserId = async (userId: string) => {
  // Get teams where user is a member
  const { data, error } = await supabase
    .from('team_members')
    .select(`
      team:teams(
        *,
        creator:user_profiles!teams_created_by_fkey(id, full_name, email, role)
      )
    `)
    .eq('user_id', userId);

  if (error) throw error;
  
  return (data || []).map((item) => item.team).filter(Boolean);
};

export const getTeamById = async (teamId: string) => {
  const { data, error } = await supabase
    .from('teams')
    .select(`
      *,
      creator:user_profiles!teams_created_by_fkey(id, full_name, email, role)
    `)
    .eq('id', teamId)
    .single();

  if (error) throw error;
  return data;
};

export const createTeam = async (teamData: {
  company_id: string;
  name: string;
  created_by: string;
}) => {
  const { data, error } = await supabase
    .from('teams')
    .insert(teamData)
    .select(`
      *,
      creator:user_profiles!teams_created_by_fkey(id, full_name, email, role)
    `)
    .single();

  if (error) throw error;
  return data as Team;
};

export const updateTeam = async (teamId: string, updates: { name: string }) => {
  const { data, error } = await supabase
    .from('teams')
    .update(updates)
    .eq('id', teamId)
    .select(`
      *,
      creator:user_profiles!teams_created_by_fkey(id, full_name, email, role)
    `)
    .single();

  if (error) throw error;
  return data as Team;
};

export const deleteTeam = async (teamId: string) => {
  // First delete all team members
  await supabase
    .from('team_members')
    .delete()
    .eq('team_id', teamId);

  // Then delete the team
  const { error } = await supabase
    .from('teams')
    .delete()
    .eq('id', teamId);

  if (error) throw error;
};

// ============================================================================
// TEAM MEMBERS OPERATIONS
// ============================================================================

export const getTeamMembers = async (teamId: string) => {
  const { data, error } = await supabase
    .from('team_members')
    .select(`
      *,
      profile:user_profiles!team_members_user_id_fkey(id, full_name, email, role, company_id),
      adder:user_profiles!team_members_added_by_fkey(id, full_name, email, role)
    `)
    .eq('team_id', teamId)
    .order('joined_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const addTeamMember = async (memberData: {
  team_id: string;
  user_id: string;
  added_by: string;
}) => {
  const { data, error } = await supabase
    .from('team_members')
    .insert(memberData)
    .select(`
      *,
      profile:user_profiles!team_members_user_id_fkey(id, full_name, email, role, company_id),
      adder:user_profiles!team_members_added_by_fkey(id, full_name, email, role)
    `)
    .single();

  if (error) throw error;
  return data;
};

export const removeTeamMember = async (teamId: string, userId: string) => {
  const { error } = await supabase
    .from('team_members')
    .delete()
    .eq('team_id', teamId)
    .eq('user_id', userId);

  if (error) throw error;
};

export const checkTeamMembership = async (teamId: string, userId: string) => {
  const { data, error } = await supabase
    .from('team_members')
    .select('*')
    .eq('team_id', teamId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  return !!data;
};

// ============================================================================
// MEMBER PROGRESS QUERIES
// ============================================================================

export const getMemberRecentGoal = async (userId: string) => {
  const { data, error } = await supabase
    .from('goals')
    .select('id, title, status, start_date, target_end_date, total_sessions, completed_sessions')
    .eq('user_id', userId)
    .in('status', ['IN_PROGRESS', 'APPROVED', 'ON_HOLD', 'BLOCKED'])
    .order('start_date', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
};

export const getMemberRecentKpi = async (userId: string) => {
  const { data, error } = await supabase
    .from('developer_kpis')
    .select(`
      id,
      title,
      status,
      start_date,
      end_date,
      metrics:developer_kpi_metrics(accumulated_points, target_points)
    `)
    .eq('user_id', userId)
    .eq('status', 'ACTIVE')
    .order('start_date', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
};

// ============================================================================
// USERS QUERY FOR MEMBER ADDITION
// ============================================================================

export const getAvailableUsersForTeam = async (
  companyId: string,
  teamId: string
) => {
  // Get all company users
  const { data: allUsers, error: usersError } = await supabase
    .from('user_profiles')
    .select('id, full_name, email, role')
    .eq('company_id', companyId)
    .order('full_name', { ascending: true });

  if (usersError) throw usersError;

  // Get existing team members
  const { data: existingMembers, error: membersError } = await supabase
    .from('team_members')
    .select('user_id')
    .eq('team_id', teamId);

  if (membersError) throw membersError;

  // Filter out existing members
  const existingMemberIds = new Set(existingMembers?.map((m) => m.user_id) || []);
  return (allUsers || []).filter((user) => !existingMemberIds.has(user.id));
};
