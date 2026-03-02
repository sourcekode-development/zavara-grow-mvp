import { supabase } from '@/shared/config/supabase';
import type {
  LoginCredentials,
  UserProfile,
  CompanyInvite,
  Company,
} from '@/shared/types';

/**
 * AUTH REPOSITORY LAYER
 * 🚨 CRITICAL: This is the ONLY file that should contain direct Supabase calls.
 * NO business logic here - just raw database operations.
 * This layer will be deleted during NestJS migration.
 */

// ============================================================================
// AUTHENTICATION OPERATIONS
// ============================================================================

export const signUpUser = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) throw error;
  return data;
};

export const signInUser = async (credentials: LoginCredentials) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: credentials.email,
    password: credentials.password,
  });

  if (error) throw error;
  return data;
};

export const signOutUser = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

export const getCurrentSession = async () => {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
};

export const getCurrentAuthUser = async () => {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data.user;
};

// ============================================================================
// USER PROFILE OPERATIONS
// ============================================================================

export const getUserProfileById = async (userId: string) => {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) throw error;
  return data as UserProfile;
};

export const getUserProfileByEmail = async (email: string) => {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('email', email)
    .maybeSingle();

  if (error) throw error;
  return data as UserProfile | null;
};

export const createUserProfile = async (profileData: {
  id: string;
  company_id: string;
  full_name: string;
  role: string;
  email: string;
}) => {
  const { data, error } = await supabase
    .from('user_profiles')
    .insert(profileData)
    .select()
    .single();

  if (error) throw error;
  return data as UserProfile;
};

// ============================================================================
// COMPANY OPERATIONS
// ============================================================================

export const createCompany = async (companyName: string) => {
  const { data, error } = await supabase
    .from('companies')
    .insert({ name: companyName })
    .select()
    .single();

  if (error) throw error;
  return data as Company;
};

export const getCompanyById = async (companyId: string) => {
  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .eq('id', companyId)
    .single();

  if (error) throw error;
  return data as Company;
};

// ============================================================================
// COMPANY INVITE OPERATIONS
// ============================================================================

export const getInviteByEmail = async (email: string) => {
  const { data, error } = await supabase
    .from('company_invites')
    .select(`
      *,
      company:companies(*)
    `)
    .eq('email', email)
    .eq('status', 'PENDING')
    .gte('expires_at', new Date().toISOString())
    .maybeSingle();

  if (error) throw error;
  return data as CompanyInvite | null;
};

export const getInviteByToken = async (token: string) => {
  const { data, error } = await supabase
    .from('company_invites')
    .select(`
      *,
      company:companies(*)
    `)
    .eq('token', token)
    .eq('status', 'PENDING')
    .gte('expires_at', new Date().toISOString())
    .single();

  if (error) throw error;
  return data as CompanyInvite;
};

export const updateInviteStatus = async (
  inviteId: string,
  status: string
) => {
  const { data, error } = await supabase
    .from('company_invites')
    .update({ status })
    .eq('id', inviteId)
    .select()
    .single();

  if (error) throw error;
  return data as CompanyInvite;
};
