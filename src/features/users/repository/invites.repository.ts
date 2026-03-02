import { supabase } from '@/shared/config/supabase';
import type { CompanyInvite, InviteStatus } from '@/shared/types';

/**
 * INVITES REPOSITORY LAYER
 * 🚨 CRITICAL: This is the ONLY file that should contain direct Supabase calls for invites.
 * NO business logic here - just raw database operations.
 * This layer will be deleted during NestJS migration.
 */

// ============================================================================
// INVITE QUERIES
// ============================================================================

export const createInvite = async (inviteData: {
  company_id: string;
  email: string;
  role: string;
  invited_by: string;
  token: string;
  expires_at: string;
}) => {
  const { data, error } = await supabase
    .from('company_invites')
    .insert(inviteData)
    .select(`
      *,
      company:companies(
        id,
        name
      )
    `)
    .single();

  if (error) throw error;
  return data as CompanyInvite;
};

export const getInvitesByCompanyId = async (companyId: string) => {
  const { data, error } = await supabase
    .from('company_invites')
    .select(`
      *,
      company:companies(
        id,
        name
      )
    `)
    .eq('company_id', companyId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as CompanyInvite[];
};

export const getInviteByToken = async (token: string) => {
  const { data, error } = await supabase
    .from('company_invites')
    .select(`
      *,
      company:companies(
        id,
        name
      )
    `)
    .eq('token', token)
    .single();

  if (error) throw error;
  return data as CompanyInvite;
};

export const getInviteByEmail = async (email: string) => {
  const { data, error } = await supabase
    .from('company_invites')
    .select(`
      *,
      company:companies(
        id,
        name
      )
    `)
    .eq('email', email)
    .eq('status', 'PENDING')
    .maybeSingle();

  if (error) throw error;
  return data as CompanyInvite | null;
};

export const getPendingInviteByEmail = async (email: string) => {
  const { data, error } = await supabase
    .from('company_invites')
    .select('*')
    .eq('email', email)
    .eq('status', 'PENDING')
    .maybeSingle();

  if (error) throw error;
  return data as CompanyInvite | null;
};

export const updateInviteStatus = async (
  inviteId: string,
  status: InviteStatus
) => {
  const { data, error } = await supabase
    .from('company_invites')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', inviteId)
    .select()
    .single();

  if (error) throw error;
  return data as CompanyInvite;
};

export const deleteInvite = async (inviteId: string) => {
  const { error } = await supabase
    .from('company_invites')
    .delete()
    .eq('id', inviteId);

  if (error) throw error;
};
