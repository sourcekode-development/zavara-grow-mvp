/* eslint-disable @typescript-eslint/no-explicit-any */
import * as invitesRepo from '../repository/invites.repository';
import * as usersRepo from '../repository/users.repository';
import type { ApiResponse, InviteStatus } from '@/shared/types';
import type { CreateInviteRequest, InviteWithDetails } from '../types';

/**
 * INVITES API LAYER
 * 🚨 CRITICAL: This layer consumes the repository layer.
 * Components/Hooks should ONLY interact with this layer, never directly with repository.
 * During NestJS migration, we'll replace these functions with axios/fetch calls.
 */

// ============================================================================
// INVITE OPERATIONS
// ============================================================================

/**
 * Generate a secure invite token (UUID v4)
 */
const generateInviteToken = (): string => {
  return crypto.randomUUID();
};

/**
 * Calculate expiry date (7 days from now)
 */
const calculateExpiryDate = (): string => {
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + 7);
  return expiryDate.toISOString();
};

/**
 * Create a new invite
 */
export const createInvite = async (
  request: CreateInviteRequest
): Promise<ApiResponse<InviteWithDetails>> => {
  try {
    // Check if pending invite already exists for this email
    const existingInvite = await invitesRepo.getPendingInviteByEmail(
      request.email
    );

    if (existingInvite) {
      return {
        success: false,
        error: 'A pending invite already exists for this email address',
      };
    }

    // Generate token and calculate expiry
    const token = generateInviteToken();
    const expiresAt = calculateExpiryDate();

    // Create invite
    const invite = await invitesRepo.createInvite({
      company_id: request.company_id,
      email: request.email,
      role: request.role,
      invited_by: request.invited_by,
      token,
      expires_at: expiresAt,
    });

    // Fetch inviter details and construct result
    let inviter: { full_name: string; email: string } | undefined;
    
    if (invite.invited_by) {
      const inviters = await usersRepo.getUsersByIds([invite.invited_by]);
      if (inviters.length > 0) {
        inviter = {
          full_name: inviters[0].full_name,
          email: inviters[0].email,
        };
      }
    }

    const inviteWithDetails: InviteWithDetails = {
      id: invite.id,
      company_id: invite.company_id,
      email: invite.email,
      role: invite.role,
      invited_by: invite.invited_by,
      token: invite.token,
      status: invite.status,
      expires_at: invite.expires_at,
      created_at: invite.created_at,
      company: invite.company,
      inviter,
    };

    return {
      success: true,
      data: inviteWithDetails,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to create invite',
    };
  }
};

/**
 * Fetch all invites for a company
 */
export const fetchInvites = async (
  companyId: string
): Promise<ApiResponse<InviteWithDetails[]>> => {
  try {
    const invites = await invitesRepo.getInvitesByCompanyId(companyId);

    // Get unique inviter IDs
    const inviterIds = [...new Set(
      invites
        .map(invite => invite.invited_by)
        .filter((id): id is string => id !== null && id !== undefined)
    )];

    // Fetch all inviter details at once
    const inviters = await usersRepo.getUsersByIds(inviterIds);
    const invitersMap = new Map(
      inviters.map(user => [user.id, { full_name: user.full_name, email: user.email }])
    );

    // Enrich invites with inviter details
    const invitesWithDetails: InviteWithDetails[] = invites.map(invite => {
      const inviter = invite.invited_by ? invitersMap.get(invite.invited_by) : undefined;
      
      return {
        id: invite.id,
        company_id: invite.company_id,
        email: invite.email,
        role: invite.role,
        invited_by: invite.invited_by,
        token: invite.token,
        status: invite.status,
        expires_at: invite.expires_at,
        created_at: invite.created_at,
        company: invite.company,
        inviter,
      };
    });

    return {
      success: true,
      data: invitesWithDetails,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to fetch invites',
    };
  }
};

/**
 * Revoke an invite (update status to REVOKED)
 */
export const revokeInvite = async (
  inviteId: string
): Promise<ApiResponse<void>> => {
  try {
    await invitesRepo.updateInviteStatus(inviteId, 'REVOKED' as InviteStatus);

    return {
      success: true,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to revoke invite',
    };
  }
};

/**
 * Check if an email has a pending invite
 */
export const checkInviteForEmail = async (
  email: string
): Promise<ApiResponse<InviteWithDetails | null>> => {
  try {
    const invite = await invitesRepo.getInviteByEmail(email);

    // Check if invite is expired
    if (invite && new Date(invite.expires_at) < new Date()) {
      // Update status to expired
      await invitesRepo.updateInviteStatus(invite.id, 'EXPIRED' as InviteStatus);
      return {
        success: false,
        error: 'This invite has expired. Please request a new one.',
      };
    }

    return {
      success: true,
      data: invite as InviteWithDetails | null,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to check invite',
    };
  }
};
