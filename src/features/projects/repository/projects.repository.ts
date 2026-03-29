import { supabase } from '@/shared/config/supabase';
import type {
  Client,
  CreateClientRequest,
  CreateProjectMemberRequest,
  CreateProjectRequest,
  Project,
  ProjectMember,
  UpdateClientRequest,
  UpdateProjectMemberRequest,
  UpdateProjectRequest,
} from '../types';

interface CountRow {
  count: number;
}

interface ClientRow extends Client {
  creator?: {
    id: string;
    full_name: string;
    email?: string | null;
    role: 'COMPANY_ADMIN' | 'TEAM_LEAD' | 'DEVELOPER';
  };
  projects?: CountRow[];
}

interface ProjectRow extends Project {
  client?: Client | null;
  creator?: {
    id: string;
    full_name: string;
    email?: string | null;
    role: 'COMPANY_ADMIN' | 'TEAM_LEAD' | 'DEVELOPER';
  };
  project_members?: Array<Pick<ProjectMember, 'id' | 'left_at' | 'removed_at'>>;
}

interface ProjectMembershipJoinRow {
  project: ProjectRow[] | null;
}

interface ProjectMemberRow extends ProjectMember {
  profile: {
    id: string;
    full_name: string;
    email?: string | null;
    role: 'COMPANY_ADMIN' | 'TEAM_LEAD' | 'DEVELOPER';
  };
  assigned_by_profile?: {
    id: string;
    full_name: string;
    email?: string | null;
    role: 'COMPANY_ADMIN' | 'TEAM_LEAD' | 'DEVELOPER';
  };
  removed_by_profile?: {
    id: string;
    full_name: string;
    email?: string | null;
    role: 'COMPANY_ADMIN' | 'TEAM_LEAD' | 'DEVELOPER';
  } | null;
}

export const getClientsByCompany = async (companyId: string) => {
  const { data, error } = await supabase
    .from('clients')
    .select(`
      *,
      creator:user_profiles!clients_created_by_fkey(id, full_name, email, role),
      projects(count)
    `)
    .eq('company_id', companyId)
    .order('name', { ascending: true });

  if (error) throw error;
  return ((data || []) as ClientRow[]).map((client) => ({
    ...client,
    project_count: client.projects?.[0]?.count || 0,
  }));
};

export const createClient = async (
  payload: CreateClientRequest & { created_by: string }
) => {
  const { data, error } = await supabase
    .from('clients')
    .insert({
      ...payload,
      description: payload.description?.trim() || null,
    })
    .select(`
      *,
      creator:user_profiles!clients_created_by_fkey(id, full_name, email, role),
      projects(count)
    `)
    .single();

  if (error) throw error;
  return data as ClientRow;
};

export const updateClient = async (clientId: string, updates: UpdateClientRequest) => {
  const { data, error } = await supabase
    .from('clients')
    .update({
      ...updates,
      description:
        updates.description === undefined ? undefined : updates.description?.trim() || null,
    })
    .eq('id', clientId)
    .select(`
      *,
      creator:user_profiles!clients_created_by_fkey(id, full_name, email, role),
      projects(count)
    `)
    .single();

  if (error) throw error;
  return data as ClientRow;
};

export const getProjectsByCompany = async (companyId: string) => {
  const { data, error } = await supabase
    .from('projects')
    .select(`
      *,
      client:clients(*),
      creator:user_profiles!projects_created_by_fkey(id, full_name, email, role),
      project_members(id, left_at, removed_at)
    `)
    .eq('company_id', companyId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []) as ProjectRow[];
};

export const getProjectsByUserMembership = async (userId: string) => {
  const { data, error } = await supabase
    .from('project_members')
    .select(`
      project:projects(
        *,
        client:clients(*),
        creator:user_profiles!projects_created_by_fkey(id, full_name, email, role),
        project_members(id, left_at, removed_at)
      )
    `)
    .eq('user_id', userId)
    .order('joined_at', { ascending: false });

  if (error) throw error;
  return (data || []) as ProjectMembershipJoinRow[];
};

export const getProjectById = async (projectId: string) => {
  const { data, error } = await supabase
    .from('projects')
    .select(`
      *,
      client:clients(*),
      creator:user_profiles!projects_created_by_fkey(id, full_name, email, role),
      project_members(id, left_at, removed_at)
    `)
    .eq('id', projectId)
    .single();

  if (error) throw error;
  return data as ProjectRow;
};

export const createProject = async (
  payload: CreateProjectRequest & { created_by: string }
) => {
  const { data, error } = await supabase
    .from('projects')
    .insert({
      ...payload,
      client_id: payload.client_id || null,
      description: payload.description?.trim() || null,
    })
    .select(`
      *,
      client:clients(*),
      creator:user_profiles!projects_created_by_fkey(id, full_name, email, role),
      project_members(id, left_at, removed_at)
    `)
    .single();

  if (error) throw error;
  return data as ProjectRow;
};

export const updateProject = async (projectId: string, updates: UpdateProjectRequest) => {
  const { data, error } = await supabase
    .from('projects')
    .update({
      ...updates,
      client_id: updates.client_id === undefined ? undefined : updates.client_id || null,
      description:
        updates.description === undefined ? undefined : updates.description?.trim() || null,
    })
    .eq('id', projectId)
    .select(`
      *,
      client:clients(*),
      creator:user_profiles!projects_created_by_fkey(id, full_name, email, role),
      project_members(id, left_at, removed_at)
    `)
    .single();

  if (error) throw error;
  return data as ProjectRow;
};

export const getProjectMembers = async (projectId: string) => {
  const { data, error } = await supabase
    .from('project_members')
    .select(`
      *,
      profile:user_profiles!project_members_user_id_fkey(id, full_name, email, role),
      assigned_by_profile:user_profiles!project_members_assigned_by_fkey(id, full_name, email, role),
      removed_by_profile:user_profiles!project_members_removed_by_fkey(id, full_name, email, role)
    `)
    .eq('project_id', projectId)
    .order('joined_at', { ascending: false });

  if (error) throw error;
  return (data || []) as ProjectMemberRow[];
};

export const createProjectMember = async (
  payload: CreateProjectMemberRequest & { assigned_by: string }
) => {
  const { data, error } = await supabase
    .from('project_members')
    .insert(payload)
    .select(`
      *,
      profile:user_profiles!project_members_user_id_fkey(id, full_name, email, role),
      assigned_by_profile:user_profiles!project_members_assigned_by_fkey(id, full_name, email, role),
      removed_by_profile:user_profiles!project_members_removed_by_fkey(id, full_name, email, role)
    `)
    .single();

  if (error) throw error;
  return data as ProjectMemberRow;
};

export const updateProjectMember = async (
  projectMemberId: string,
  updates: UpdateProjectMemberRequest
) => {
  const { data, error } = await supabase
    .from('project_members')
    .update(updates)
    .eq('id', projectMemberId)
    .select(`
      *,
      profile:user_profiles!project_members_user_id_fkey(id, full_name, email, role),
      assigned_by_profile:user_profiles!project_members_assigned_by_fkey(id, full_name, email, role),
      removed_by_profile:user_profiles!project_members_removed_by_fkey(id, full_name, email, role)
    `)
    .single();

  if (error) throw error;
  return data as ProjectMemberRow;
};

export const softRemoveProjectMember = async (
  projectMemberId: string,
  payload: { left_at: string; removed_at: string; removed_by: string }
) => {
  const { data, error } = await supabase
    .from('project_members')
    .update(payload)
    .eq('id', projectMemberId)
    .select(`
      *,
      profile:user_profiles!project_members_user_id_fkey(id, full_name, email, role),
      assigned_by_profile:user_profiles!project_members_assigned_by_fkey(id, full_name, email, role),
      removed_by_profile:user_profiles!project_members_removed_by_fkey(id, full_name, email, role)
    `)
    .single();

  if (error) throw error;
  return data as ProjectMemberRow;
};

export const getActiveProjectMemberByUser = async (projectId: string, userId: string) => {
  const { data, error } = await supabase
    .from('project_members')
    .select('id')
    .eq('project_id', projectId)
    .eq('user_id', userId)
    .is('left_at', null)
    .is('removed_at', null)
    .maybeSingle();

  if (error) throw error;
  return data;
};

export const getActivePrimaryReviewer = async (projectId: string) => {
  const { data, error } = await supabase
    .from('project_members')
    .select('id, user_id')
    .eq('project_id', projectId)
    .eq('is_primary_reviewer', true)
    .is('left_at', null)
    .is('removed_at', null)
    .maybeSingle();

  if (error) throw error;
  return data;
};

export const getAvailableUsersForProject = async (companyId: string, projectId: string) => {
  const { data: users, error: usersError } = await supabase
    .from('user_profiles')
    .select('id, full_name, email, role')
    .eq('company_id', companyId)
    .order('full_name', { ascending: true });

  if (usersError) throw usersError;

  const { data: activeMembers, error: activeMembersError } = await supabase
    .from('project_members')
    .select('user_id')
    .eq('project_id', projectId)
    .is('left_at', null)
    .is('removed_at', null);

  if (activeMembersError) throw activeMembersError;

  const activeUserIds = new Set((activeMembers || []).map((member) => member.user_id));
  return (users || []).filter((user) => !activeUserIds.has(user.id));
};
