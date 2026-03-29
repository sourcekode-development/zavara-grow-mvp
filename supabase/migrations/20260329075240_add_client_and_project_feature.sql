-- ============================================================================
-- Migration: add client and project feature
-- Created: 2026-03-29 07:52:40 UTC
-- Description: Adds company-scoped clients, projects, and project membership
-- history tracking with soft-removal support for assignments.
--
-- Affected Tables: clients, projects, project_members
-- Special Considerations:
-- - additive only; safe for existing production data
-- - no RLS policies are added in this migration
-- - project membership removal is modeled as a soft delete
-- ============================================================================

create type project_kind_enum as enum (
  'CLIENT_DELIVERY',
  'INTERNAL_PRODUCT',
  'INTERNAL_INITIATIVE'
);

create type project_status_enum as enum (
  'ACTIVE',
  'ON_HOLD',
  'COMPLETED',
  'ARCHIVED'
);

create type project_member_role_enum as enum (
  'DEVELOPER',
  'PROJECT_MANAGER',
  'DELIVERY_OWNER'
);

create table clients (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  name text not null,
  description text,
  created_by uuid not null references user_profiles(id) on delete restrict,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  constraint clients_name_not_blank check (char_length(trim(name)) > 0)
);

create unique index idx_clients_company_lower_name_unique
  on clients(company_id, lower(name));

create index idx_clients_company_id on clients(company_id);
create index idx_clients_created_by on clients(created_by);

create trigger update_clients_updated_at
before update on clients
for each row execute function update_updated_at_column();

create table projects (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  client_id uuid references clients(id) on delete set null,
  name text not null,
  description text,
  project_kind project_kind_enum not null,
  status project_status_enum default 'ACTIVE' not null,
  created_by uuid not null references user_profiles(id) on delete restrict,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  constraint projects_name_not_blank check (char_length(trim(name)) > 0)
);

create unique index idx_projects_company_lower_name_unique
  on projects(company_id, lower(name));

create index idx_projects_company_id on projects(company_id);
create index idx_projects_client_id on projects(client_id);
create index idx_projects_created_by on projects(created_by);
create index idx_projects_status on projects(status);

create trigger update_projects_updated_at
before update on projects
for each row execute function update_updated_at_column();

create table project_members (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  user_id uuid not null references user_profiles(id) on delete restrict,
  project_role project_member_role_enum not null,
  joined_at date not null,
  left_at date,
  is_primary_reviewer boolean default false not null,
  assigned_by uuid not null references user_profiles(id) on delete restrict,
  removed_by uuid references user_profiles(id) on delete set null,
  removed_at timestamp with time zone,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  constraint project_members_valid_dates check (left_at is null or left_at >= joined_at)
);

create index idx_project_members_project_id on project_members(project_id);
create index idx_project_members_user_id on project_members(user_id);
create index idx_project_members_active_project on project_members(project_id, user_id)
  where left_at is null and removed_at is null;
create index idx_project_members_history_user on project_members(user_id, joined_at desc);
create index idx_project_members_primary_reviewer on project_members(project_id)
  where is_primary_reviewer = true and left_at is null and removed_at is null;

create unique index idx_project_members_unique_active_assignment
  on project_members(project_id, user_id)
  where left_at is null and removed_at is null;

create unique index idx_project_members_unique_active_primary_reviewer
  on project_members(project_id)
  where is_primary_reviewer = true and left_at is null and removed_at is null;

create trigger update_project_members_updated_at
before update on project_members
for each row execute function update_updated_at_column();
