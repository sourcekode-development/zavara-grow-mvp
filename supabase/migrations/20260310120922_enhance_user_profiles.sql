-- ============================================================================
-- Migration: Enhance User Profiles
-- Created: 2026-03-10 12:09:22 UTC
-- Description: Adds additional resource tracking fields to user_profiles
--
-- Affected Tables: user_profiles
-- Special Considerations: All new fields are optional
-- ============================================================================

-- Create Enum for Allocation Status
create type allocation_status_enum as enum ('BILLABLE', 'BENCH', 'INTERNAL_PROJECT');

-- Add new fields to user_profiles
alter table user_profiles
  add column seniority_level text,
  add column core_skills jsonb default '[]'::jsonb,
  add column industry_domains jsonb default '[]'::jsonb,
  add column certifications jsonb default '[]'::jsonb,
  add column allocation_status allocation_status_enum,
  add column github_url text,
  add column linkedin_url text;

-- RLS Updates for user_profiles

-- Developers can update their own profile
create policy "users_can_update_own_profile"
  on user_profiles
  for update
  using (
    auth.uid() = id
  )
  with check (
    auth.uid() = id
  );

-- Company Admins can update any profile within their company
create policy "company_admins_can_update_profiles"
  on user_profiles
  for update
  using (
    exists (
      select 1 from user_profiles admin_profile
      where admin_profile.id = auth.uid()
      and admin_profile.role = 'COMPANY_ADMIN'
      and admin_profile.company_id = user_profiles.company_id
    )
  )
  with check (
    exists (
      select 1 from user_profiles admin_profile
      where admin_profile.id = auth.uid()
      and admin_profile.role = 'COMPANY_ADMIN'
      and admin_profile.company_id = user_profiles.company_id
    )
  );

-- Team Leads can update any profile within their company (or team if more strict, but we'll allow company-wide for MVP management)
create policy "team_leads_can_update_profiles"
  on user_profiles
  for update
  using (
    exists (
      select 1 from user_profiles lead_profile
      where lead_profile.id = auth.uid()
      and lead_profile.role = 'TEAM_LEAD'
      and lead_profile.company_id = user_profiles.company_id
    )
  )
  with check (
    exists (
      select 1 from user_profiles lead_profile
      where lead_profile.id = auth.uid()
      and lead_profile.role = 'TEAM_LEAD'
      and lead_profile.company_id = user_profiles.company_id
    )
  );
