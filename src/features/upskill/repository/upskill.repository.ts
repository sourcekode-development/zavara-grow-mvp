import { supabase } from '@/shared/config/supabase';
import type {
  DeveloperUpskillStats,
  UpskillModuleEffortLog,
  UpskillProgram,
  UpskillProgramReview,
  UpskillTemplateModule,
} from '@/shared/types';
import type {
  CreateUpskillModuleRequest,
  CreateUpskillProgramRequest,
  CreateUpskillTemplateRequest,
  RespondUpskillProgramReviewRequest,
  UpdateUpskillModuleRequest,
  UpdateUpskillProgramRequest,
  UpdateUpskillTemplateRequest,
  UpskillProgramFilters,
  UpskillTemplateFilters,
} from '../types';

export const fetchPrograms = async (filters?: UpskillProgramFilters) => {
  let query = supabase
    .from('upskill_programs')
    .select(`
      *,
      creator:user_profiles!upskill_programs_created_by_fkey(id, full_name, email),
      assignee:user_profiles!upskill_programs_user_id_fkey(id, full_name, email),
      approver:user_profiles!upskill_programs_approved_by_fkey(id, full_name, email),
      template:upskill_program_templates(id, title, description, total_effort, is_active, is_published, company_id, created_by, created_at, updated_at),
      modules:upskill_program_modules(id, status, effort),
      effort_logs:upskill_module_effort_logs(id, module_id, user_id, effort_used, notes, logged_on, created_at)
    `)
    .order('updated_at', { ascending: false });

  if (filters?.company_id) {
    query = query.eq('company_id', filters.company_id);
  }

  if (filters?.user_id) {
    query = query.eq('user_id', filters.user_id);
  }

  if (filters?.created_by) {
    query = query.eq('created_by', filters.created_by);
  }

  if (filters?.status) {
    if (Array.isArray(filters.status)) {
      query = query.in('status', filters.status);
    } else {
      query = query.eq('status', filters.status);
    }
  }

  if (filters?.search) {
    query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
  }

  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  return query;
};

export const fetchProgramById = async (programId: string) => {
  return supabase
    .from('upskill_programs')
    .select(`
      *,
      creator:user_profiles!upskill_programs_created_by_fkey(id, full_name, email),
      assignee:user_profiles!upskill_programs_user_id_fkey(id, full_name, email),
      approver:user_profiles!upskill_programs_approved_by_fkey(id, full_name, email),
      template:upskill_program_templates(
        id,
        title,
        description,
        total_effort,
        is_active,
        is_published,
        company_id,
        created_by,
        created_at,
        updated_at,
        modules:upskill_template_modules(*)
      ),
      modules:upskill_program_modules(*),
      reviews:upskill_program_reviews(
        *,
        reviewer:user_profiles!upskill_program_reviews_reviewer_id_fkey(id, full_name, email)
      ),
      effort_logs:upskill_module_effort_logs(*)
    `)
    .eq('id', programId)
    .single();
};

export const createProgram = async (
  userId: string,
  companyId: string,
  data: CreateUpskillProgramRequest
) => {
  return supabase
    .from('upskill_programs')
    .insert({
      company_id: companyId,
      created_by: userId,
      user_id: userId,
      template_id: data.template_id || null,
      title: data.title,
      description: data.description || null,
      total_effort: data.total_effort ?? null,
    })
    .select()
    .single();
};

export const updateProgram = async (
  programId: string,
  data: UpdateUpskillProgramRequest
) => {
  return supabase
    .from('upskill_programs')
    .update({
      ...data,
      updated_at: new Date().toISOString(),
    })
    .eq('id', programId)
    .select()
    .single();
};

export const updateProgramStatus = async (
  programId: string,
  data: Partial<UpskillProgram>
) => {
  return supabase
    .from('upskill_programs')
    .update({
      ...data,
      updated_at: new Date().toISOString(),
    })
    .eq('id', programId)
    .select()
    .single();
};

export const fetchProgramModules = async (programId: string) => {
  const { data, error } = await supabase
    .from('upskill_program_modules')
    .select('*')
    .eq('program_id', programId)
    .order('order_index', { ascending: true });

  if (error) throw error;
  return data || [];
};

export const createProgramModules = async (
  modules: CreateUpskillModuleRequest[]
) => {
  if (modules.length === 0) return { data: [], error: null };

  return supabase
    .from('upskill_program_modules')
    .insert(
      modules.map((module, index) => ({
        program_id: module.program_id,
        title: module.title,
        description: module.description || null,
        effort: module.effort ?? null,
        content: module.content || null,
        content_plain_text: module.content?.text || null,
        order_index: module.order_index ?? index,
      }))
    )
    .select();
};

export const updateProgramModule = async (
  moduleId: string,
  data: UpdateUpskillModuleRequest
) => {
  return supabase
    .from('upskill_program_modules')
    .update({
      ...data,
      content_plain_text: data.content?.text ?? undefined,
      updated_at: new Date().toISOString(),
    })
    .eq('id', moduleId)
    .select()
    .single();
};

export const deleteProgramModule = async (moduleId: string) => {
  return supabase
    .from('upskill_program_modules')
    .delete()
    .eq('id', moduleId);
};

export const fetchProgramByIdForModule = async (moduleId: string) => {
  return supabase
    .from('upskill_program_modules')
    .select('id, program_id')
    .eq('id', moduleId)
    .maybeSingle();
};

export const fetchProgramLogs = async (programId: string) => {
  const { data, error } = await supabase
    .from('upskill_module_effort_logs')
    .select('*')
    .eq('program_id', programId)
    .order('logged_on', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []) as UpskillModuleEffortLog[];
};

export const createEffortLog = async (
  log: Omit<UpskillModuleEffortLog, 'id' | 'created_at'>
) => {
  return supabase
    .from('upskill_module_effort_logs')
    .insert(log)
    .select()
    .single();
};

export const createProgramReviews = async (
  reviews: Array<{
    program_id: string;
    review_round: number;
    reviewer_id: string;
  }>
) => {
  return supabase
    .from('upskill_program_reviews')
    .insert(reviews)
    .select();
};

export const fetchReviewsByProgramRound = async (
  programId: string,
  reviewRound: number
) => {
  const { data, error } = await supabase
    .from('upskill_program_reviews')
    .select(`
      *,
      reviewer:user_profiles!upskill_program_reviews_reviewer_id_fkey(id, full_name, email)
    `)
    .eq('program_id', programId)
    .eq('review_round', reviewRound)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data || [];
};

export const updateProgramReview = async (
  reviewId: string,
  data: Partial<UpskillProgramReview> & RespondUpskillProgramReviewRequest
) => {
  return supabase
    .from('upskill_program_reviews')
    .update({
      ...data,
      responded_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', reviewId)
    .select()
    .single();
};

export const autoClosePendingReviews = async (
  programId: string,
  reviewRound: number,
  keepReviewId: string
) => {
  return supabase
    .from('upskill_program_reviews')
    .update({
      decision: 'AUTO_CLOSED',
      updated_at: new Date().toISOString(),
    })
    .eq('program_id', programId)
    .eq('review_round', reviewRound)
    .eq('decision', 'PENDING')
    .neq('id', keepReviewId);
};

export const fetchPendingReviewsForReviewer = async (reviewerId: string) => {
  return supabase
    .from('upskill_program_reviews')
    .select(`
      *,
      program:upskill_programs(
        *,
        creator:user_profiles!upskill_programs_created_by_fkey(id, full_name, email),
        assignee:user_profiles!upskill_programs_user_id_fkey(id, full_name, email),
        approver:user_profiles!upskill_programs_approved_by_fkey(id, full_name, email),
        modules:upskill_program_modules(
          id,
          program_id,
          template_module_id,
          order_index,
          title,
          description,
          effort,
          content,
          content_plain_text,
          status,
          created_at,
          updated_at
        )
      )
    `)
    .eq('reviewer_id', reviewerId)
    .eq('decision', 'PENDING')
    .order('created_at', { ascending: false });
};

export const fetchReviewById = async (reviewId: string) => {
  return supabase
    .from('upskill_program_reviews')
    .select('*')
    .eq('id', reviewId)
    .maybeSingle();
};

export const fetchTemplates = async (filters?: UpskillTemplateFilters) => {
  let query = supabase
    .from('upskill_program_templates')
    .select(`
      *,
      creator:user_profiles!upskill_program_templates_created_by_fkey(id, full_name, email),
      modules:upskill_template_modules(*)
    `)
    .order('updated_at', { ascending: false });

  if (filters?.company_id) {
    query = query.eq('company_id', filters.company_id);
  }

  if (filters?.search) {
    query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
  }

  if (filters?.is_active !== undefined) {
    query = query.eq('is_active', filters.is_active);
  }

  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  return query;
};

export const fetchTemplateById = async (templateId: string) => {
  return supabase
    .from('upskill_program_templates')
    .select(`
      *,
      creator:user_profiles!upskill_program_templates_created_by_fkey(id, full_name, email),
      modules:upskill_template_modules(*)
    `)
    .eq('id', templateId)
    .single();
};

export const createTemplate = async (
  userId: string,
  companyId: string,
  data: CreateUpskillTemplateRequest
) => {
  return supabase
    .from('upskill_program_templates')
    .insert({
      company_id: companyId,
      created_by: userId,
      title: data.title,
      description: data.description || null,
      total_effort: data.total_effort ?? null,
      is_active: data.is_active ?? true,
      is_published: data.is_published ?? false,
    })
    .select()
    .single();
};

export const updateTemplate = async (
  templateId: string,
  data: UpdateUpskillTemplateRequest
) => {
  const { ...templateData } = data;
  return supabase
    .from('upskill_program_templates')
    .update({
      title: templateData.title,
      description: templateData.description ?? undefined,
      total_effort: templateData.total_effort ?? null,
      is_active: templateData.is_active,
      is_published: templateData.is_published,
      updated_at: new Date().toISOString(),
    })
    .eq('id', templateId)
    .select()
    .single();
};

export const deleteTemplate = async (templateId: string) => {
  return supabase
    .from('upskill_program_templates')
    .delete()
    .eq('id', templateId);
};

export const replaceTemplateModules = async (
  templateId: string,
  modules: CreateUpskillTemplateRequest['modules']
) => {
  const { error: deleteError } = await supabase
    .from('upskill_template_modules')
    .delete()
    .eq('template_id', templateId);

  if (deleteError) {
    throw deleteError;
  }

  if (!modules || modules.length === 0) {
    return { data: [], error: null };
  }

  return supabase
    .from('upskill_template_modules')
    .insert(
      modules.map((module, index) => ({
        template_id: templateId,
        title: module.title,
        description: module.description || null,
        effort: module.effort ?? null,
        content: module.content || null,
        content_plain_text: module.content?.text || null,
        order_index: module.order_index ?? index,
      }))
    )
    .select();
};

export const fetchPotentialReviewers = async (
  companyId: string,
  excludeUserId?: string
) => {
  let query = supabase
    .from('user_profiles')
    .select('id, full_name, email, role')
    .eq('company_id', companyId)
    .in('role', ['TEAM_LEAD', 'COMPANY_ADMIN'])
    .order('full_name', { ascending: true });

  if (excludeUserId) {
    query = query.neq('id', excludeUserId);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
};

export const fetchDeveloperStats = async (userId: string) => {
  const { data, error } = await supabase
    .from('developer_upskill_stats')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  return data as DeveloperUpskillStats | null;
};

export const upsertDeveloperStats = async (data: DeveloperUpskillStats) => {
  return supabase
    .from('developer_upskill_stats')
    .upsert(data)
    .select()
    .single();
};

export const fetchTeamMembers = async (teamId: string) => {
  const { data, error } = await supabase
    .from('team_members')
    .select(`
      user_id,
      profile:user_profiles!team_members_user_id_fkey(id, full_name, email)
    `)
    .eq('team_id', teamId);

  if (error) throw error;
  return data || [];
};

export const fetchProgramsByUserIds = async (userIds: string[]) => {
  if (userIds.length === 0) return [];

  const { data, error } = await supabase
    .from('upskill_programs')
    .select(`
      *,
      modules:upskill_program_modules(id, status, effort),
      effort_logs:upskill_module_effort_logs(id, module_id, user_id, effort_used, notes, logged_on, created_at)
    `)
    .in('user_id', userIds)
    .in('status', ['APPROVED', 'IN_PROGRESS', 'COMPLETED'])
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const fetchDeveloperStatsByUserIds = async (userIds: string[]) => {
  if (userIds.length === 0) return [];

  const { data, error } = await supabase
    .from('developer_upskill_stats')
    .select('*')
    .in('user_id', userIds);

  if (error) throw error;
  return data || [];
};

export const fetchTemplateModules = async (templateId: string) => {
  const { data, error } = await supabase
    .from('upskill_template_modules')
    .select('*')
    .eq('template_id', templateId)
    .order('order_index', { ascending: true });

  if (error) throw error;
  return (data || []) as UpskillTemplateModule[];
};

export const fetchProgramCountsByUser = async (userId: string) => {
  const { count: startedCount, error: startedError } = await supabase
    .from('upskill_programs')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .in('status', ['IN_PROGRESS', 'COMPLETED']);

  if (startedError) throw startedError;

  const { count: completedCount, error: completedError } = await supabase
    .from('upskill_programs')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('status', 'COMPLETED');

  if (completedError) throw completedError;

  return {
    startedCount: startedCount || 0,
    completedCount: completedCount || 0,
  };
};
