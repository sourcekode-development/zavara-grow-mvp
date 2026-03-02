-- ============================================================================
-- Migration: Create Base Tables for Zavara Grow MVP
-- Created: 2026-02-28 14:30:00 UTC
-- Description: Initial schema setup for the Zavara Grow platform
--
-- This migration creates:
-- - Core hierarchy tables (companies, teams, users)
-- - Blueprint templates (goals, KPIs)
-- - Execution tables (goals, milestones, cadence)
-- - Assessment tables (checkpoints, assessments)
-- - KPI review tables (developer KPIs, reviews)
--
-- Notes:
-- - All tables have RLS enabled but no policies defined yet
-- - All tables include created_at and updated_at timestamps
-- - Enums are created before tables that reference them
-- ============================================================================

-- ============================================================================
-- ENUMS
-- ============================================================================

-- user roles within the platform
create type user_role as enum (
  'COMPANY_ADMIN',
  'TEAM_LEAD',
  'DEVELOPER'
);

-- invitation status for company invites
create type invite_status as enum (
  'PENDING',
  'ACCEPTED',
  'EXPIRED',
  'REVOKED'
);

-- goal execution status
create type goal_status as enum (
  'NOT_STARTED',
  'IN_PROGRESS',
  'BLOCKED',
  'COMPLETED'
);

-- milestone status
create type milestone_status as enum (
  'PENDING',
  'ACTIVE',
  'COMPLETED'
);

-- cadence session status
create type cadence_session_status as enum (
  'PENDING',
  'COMPLETED',
  'MISSED'
);

-- checkpoint types
create type checkpoint_type as enum (
  'MANUAL_REVIEW',
  'AI_INTERVIEW'
);

-- checkpoint status with soft flag for attention needed
create type checkpoint_status as enum (
  'PENDING',
  'NEEDS_ATTENTION',
  'PASSED'
);

-- kpi cycle types
create type kpi_cycle_type as enum (
  'QUARTERLY',
  'HALF_YEARLY',
  'ANNUALLY',
  'CUSTOM'
);

-- kpi assignment status
create type kpi_status as enum (
  'DRAFT',
  'ACTIVE',
  'ARCHIVED'
);

-- kpi review status
create type kpi_review_status as enum (
  'DRAFT',
  'SUBMITTED',
  'ACKNOWLEDGED_BY_DEV'
);

-- ============================================================================
-- CORE HIERARCHY TABLES
-- ============================================================================

-- companies table: top-level tenant organization
create table companies (
    id uuid primary key default gen_random_uuid (),
    name text not null,
    created_at timestamp
    with
        time zone default now() not null,
        updated_at timestamp
    with
        time zone default now() not null
);

-- enable row level security
alter table companies enable row level security;

-- company invites: secure waiting room before user creation
create table company_invites (
    id uuid primary key default gen_random_uuid (),
    company_id uuid not null references companies (id) on delete cascade,
    email text not null,
    role user_role not null,
    invited_by uuid references auth.users (id) on delete set null,
    token text unique not null,
    status invite_status default 'PENDING' not null,
    expires_at timestamp
    with
        time zone not null,
        created_at timestamp
    with
        time zone default now() not null,
        updated_at timestamp
    with
        time zone default now() not null
);

-- index for quick email lookups during invite validation
create index idx_company_invites_email on company_invites (email);

create index idx_company_invites_token on company_invites (token);

create index idx_company_invites_status on company_invites (status);

-- enable row level security
alter table company_invites enable row level security;

-- user profiles: extends supabase auth.users with company context
create table user_profiles (
    id uuid primary key references auth.users (id) on delete cascade,
    company_id uuid not null references companies (id) on delete cascade,
    full_name text not null,
    email text UNIQUE not null,
    role user_role not null,
    created_at timestamp
    with
        time zone default now() not null,
        updated_at timestamp
    with
        time zone default now() not null
);

-- index for company-based queries
create index idx_user_profiles_company_id on user_profiles (company_id);

create index idx_user_profiles_role on user_profiles (role);

-- enable row level security
alter table user_profiles enable row level security;

-- teams: sub-divisions within a company
create table teams (
    id uuid primary key default gen_random_uuid (),
    company_id uuid not null references companies (id) on delete cascade,
    name text not null,
    created_by uuid not null references user_profiles (id) on delete cascade,
    created_at timestamp
    with
        time zone default now() not null,
        updated_at timestamp
    with
        time zone default now() not null
);

-- index for company-based team queries
create index idx_teams_company_id on teams (company_id);

create index idx_teams_created_by on teams (created_by);

-- enable row level security
alter table teams enable row level security;

-- team members: junction table for team membership
create table team_members (
    team_id uuid not null references teams (id) on delete cascade,
    user_id uuid not null references user_profiles (id) on delete cascade,
    added_by uuid references user_profiles (id) on delete set null,
    joined_at timestamp
    with
        time zone default now() not null,
        created_at timestamp
    with
        time zone default now() not null,
        updated_at timestamp
    with
        time zone default now() not null,
        -- composite primary key prevents duplicate memberships
        primary key (team_id, user_id)
);

-- index for user-based team lookups
create index idx_team_members_user_id on team_members (user_id);

-- enable row level security
alter table team_members enable row level security;

-- ============================================================================
-- BLUEPRINT TEMPLATES
-- ============================================================================

-- goal templates: reusable blueprints for upskilling paths
create table goal_templates (
    id uuid primary key default gen_random_uuid (),
    company_id uuid references companies (id) on delete cascade,
    -- null company_id means global zavara template
    title text not null,
    description text,
    created_at timestamp
    with
        time zone default now() not null,
        updated_at timestamp
    with
        time zone default now() not null
);

-- index for company-specific and global template queries
create index idx_goal_templates_company_id on goal_templates (company_id);

-- enable row level security
alter table goal_templates enable row level security;

-- ============================================================================
-- EXECUTION ENGINE (GOALS & MILESTONES)
-- ============================================================================

-- goals: assigned upskilling objectives with fixed deadlines
create table goals (
    id uuid primary key default gen_random_uuid (),
    user_id uuid not null references user_profiles (id) on delete cascade,
    assigned_by uuid not null references user_profiles (id) on delete cascade,
    template_id uuid references goal_templates (id) on delete set null,
    -- nullable to allow custom goals not from templates
    title text not null,
    status goal_status default 'NOT_STARTED' not null,
    start_date date not null,
    target_end_date date not null,
    created_at timestamp
    with
        time zone default now() not null,
        updated_at timestamp
    with
        time zone default now() not null
);

-- indexes for user and status-based queries
create index idx_goals_user_id on goals (user_id);

create index idx_goals_assigned_by on goals (assigned_by);

create index idx_goals_status on goals (status);

create index idx_goals_template_id on goals (template_id);

-- enable row level security
alter table goals enable row level security;

-- milestones: chronological phases within a goal
create table milestones (
    id uuid primary key default gen_random_uuid (),
    goal_id uuid not null references goals (id) on delete cascade,
    title text not null,
    order_index integer not null,
    -- 1, 2, 3 for chronological sorting
    status milestone_status default 'PENDING' not null,
    created_at timestamp
    with
        time zone default now() not null,
        updated_at timestamp
    with
        time zone default now() not null
);

-- index for goal-based milestone queries
create index idx_milestones_goal_id on milestones (goal_id);

create index idx_milestones_status on milestones (status);

-- enable row level security
alter table milestones enable row level security;

-- ============================================================================
-- CADENCE TRACKING (PRE-GENERATED CALENDAR)
-- ============================================================================

-- cadence sessions: pre-created honor-system learning sessions
create table cadence_sessions (
    id uuid primary key default gen_random_uuid (),
    goal_id uuid not null references goals (id) on delete cascade,
    milestone_id uuid not null references milestones (id) on delete cascade,
    scheduled_date date not null,
    duration_minutes integer not null,
    -- e.g., 60 for 1 hour
    status cadence_session_status default 'PENDING' not null,
    summary_text text,
    -- honor-system summary submitted by developer
    calendar_event_id text,
    -- for future google/outlook calendar integration
    created_at timestamp
    with
        time zone default now() not null,
        updated_at timestamp
    with
        time zone default now() not null
);

-- indexes for date-based queries and cron job processing
create index idx_cadence_sessions_goal_id on cadence_sessions (goal_id);

create index idx_cadence_sessions_milestone_id on cadence_sessions (milestone_id);

create index idx_cadence_sessions_scheduled_date on cadence_sessions (scheduled_date);

create index idx_cadence_sessions_status on cadence_sessions (status);

-- enable row level security
alter table cadence_sessions enable row level security;

-- ============================================================================
-- QUALITY CONTROL (CHECKPOINTS & ASSESSMENTS)
-- ============================================================================

-- checkpoints: scheduled validation points for developer knowledge
create table checkpoints (
    id uuid primary key default gen_random_uuid (),
    goal_id uuid not null references goals (id) on delete cascade,
    milestone_id uuid references milestones (id) on delete set null,
    -- nullable if not tied to specific milestone
    scheduled_date date not null,
    type checkpoint_type not null,
    status checkpoint_status default 'PENDING' not null,
    created_at timestamp
    with
        time zone default now() not null,
        updated_at timestamp
    with
        time zone default now() not null
);

-- indexes for goal and date-based checkpoint queries
create index idx_checkpoints_goal_id on checkpoints (goal_id);

create index idx_checkpoints_milestone_id on checkpoints (milestone_id);

create index idx_checkpoints_status on checkpoints (status);

create index idx_checkpoints_scheduled_date on checkpoints (scheduled_date);

-- enable row level security
alter table checkpoints enable row level security;

-- assessments: detailed evaluation results for checkpoints
create table assessments (
    id uuid primary key default gen_random_uuid (),
    checkpoint_id uuid not null references checkpoints (id) on delete cascade,
    reviewer_id uuid references user_profiles (id) on delete set null,
    -- null means ai agent performed review
    score integer,
    -- e.g., out of 100
    feedback_text text,
    action_items jsonb,
    -- dynamic pivot micro-goals: [{"task": "...", "duration": 30}]
    created_at timestamp
    with
        time zone default now() not null,
        updated_at timestamp
    with
        time zone default now() not null
);

-- index for checkpoint-based assessment queries
create index idx_assessments_checkpoint_id on assessments (checkpoint_id);

create index idx_assessments_reviewer_id on assessments (reviewer_id);

-- enable row level security
alter table assessments enable row level security;

-- ============================================================================
-- KPI BLUEPRINTS (PERFORMANCE REVIEW TEMPLATES)
-- ============================================================================

-- kpi templates: master blueprints for performance reviews
create table kpi_templates (
    id uuid primary key default gen_random_uuid (),
    company_id uuid references companies (id) on delete cascade,
    -- null means global zavara template
    title text not null,
    description text,
    cycle_type kpi_cycle_type not null,
    created_at timestamp
    with
        time zone default now() not null,
        updated_at timestamp
    with
        time zone default now() not null
);

-- index for company-specific and global template queries
create index idx_kpi_templates_company_id on kpi_templates (company_id);

-- enable row level security
alter table kpi_templates enable row level security;

-- kpi template metrics: weighted performance criteria within a template
create table kpi_template_metrics (
    id uuid primary key default gen_random_uuid (),
    template_id uuid not null references kpi_templates (id) on delete cascade,
    name text not null,
    -- e.g., "code quality & bug rate"
    weightage_percentage numeric(5, 2) not null,
    -- e.g., 30.50 (must sum to 100 across template)
    description text,
    -- defines what a 5/5 rating looks like
    created_at timestamp
    with
        time zone default now() not null,
        updated_at timestamp
    with
        time zone default now() not null,
        -- constraint to ensure weightage is between 0 and 100
        constraint chk_weightage_range check (
            weightage_percentage >= 0
            and weightage_percentage <= 100
        )
);

-- index for template-based metric queries
create index idx_kpi_template_metrics_template_id on kpi_template_metrics (template_id);

-- enable row level security
alter table kpi_template_metrics enable row level security;

-- ============================================================================
-- ACTIVE KPI ASSIGNMENTS (SNAPSHOTS)
-- ============================================================================

-- developer kpis: immutable snapshots of kpi templates assigned to developers
create table developer_kpis (
    id uuid primary key default gen_random_uuid (),
    user_id uuid not null references user_profiles (id) on delete cascade,
    assigned_by uuid not null references user_profiles (id) on delete cascade,
    original_template_id uuid references kpi_templates (id) on delete set null,
    -- loose reference for analytics
    title text not null,
    cycle_type kpi_cycle_type not null,
    start_date date not null,
    end_date date,
    -- nullable for open-ended or custom cycles
    status kpi_status default 'DRAFT' not null,
    created_at timestamp
    with
        time zone default now() not null,
        updated_at timestamp
    with
        time zone default now() not null
);

-- indexes for user and status-based kpi queries
create index idx_developer_kpis_user_id on developer_kpis (user_id);

create index idx_developer_kpis_assigned_by on developer_kpis (assigned_by);

create index idx_developer_kpis_status on developer_kpis (status);

-- enable row level security
alter table developer_kpis enable row level security;

-- developer kpi metrics: snapshotted metrics with weightages for a developer
create table developer_kpi_metrics (
    id uuid primary key default gen_random_uuid (),
    developer_kpi_id uuid not null references developer_kpis (id) on delete cascade,
    name text not null,
    weightage_percentage numeric(5, 2) not null,
    description text,
    created_at timestamp
    with
        time zone default now() not null,
        updated_at timestamp
    with
        time zone default now() not null,
        -- constraint to ensure weightage is between 0 and 100
        constraint chk_dev_metric_weightage_range check (
            weightage_percentage >= 0
            and weightage_percentage <= 100
        )
);

-- index for developer kpi-based metric queries
create index idx_developer_kpi_metrics_developer_kpi_id on developer_kpi_metrics (developer_kpi_id);

-- enable row level security
alter table developer_kpi_metrics enable row level security;

-- ============================================================================
-- KPI GRADING (PERFORMANCE REVIEWS)
-- ============================================================================

-- kpi reviews: periodic performance evaluations based on snapshotted metrics
create table kpi_reviews (
    id uuid primary key default gen_random_uuid (),
    developer_kpi_id uuid not null references developer_kpis (id) on delete cascade,
    reviewer_id uuid not null references user_profiles (id) on delete cascade,
    review_period_label text not null,
    -- e.g., "q1 2026" or "h2 2026"
    status kpi_review_status default 'DRAFT' not null,
    final_score numeric(5, 2),
    -- calculated weighted score
    manager_summary text,
    -- overall feedback for the cycle
    created_at timestamp
    with
        time zone default now() not null,
        updated_at timestamp
    with
        time zone default now() not null
);

-- indexes for developer kpi and status-based review queries
create index idx_kpi_reviews_developer_kpi_id on kpi_reviews (developer_kpi_id);

create index idx_kpi_reviews_reviewer_id on kpi_reviews (reviewer_id);

create index idx_kpi_reviews_status on kpi_reviews (status);

-- enable row level security
alter table kpi_reviews enable row level security;

-- kpi review scores: individual metric ratings and calculated values
create table kpi_review_scores (
    id uuid primary key default gen_random_uuid (),
    review_id uuid not null references kpi_reviews (id) on delete cascade,
    metric_id uuid not null references developer_kpi_metrics (id) on delete cascade,
    rating integer not null,
    -- e.g., 1 to 5 scale
    calculated_value numeric(5, 2) not null,
    -- pre-calculated: (rating / max_rating) * weightage
    comments text,
    -- manager's specific feedback for this metric
    created_at timestamp
    with
        time zone default now() not null,
        updated_at timestamp
    with
        time zone default now() not null,
        -- constraint to ensure rating is within valid range
        constraint chk_rating_range check (
            rating >= 1
            and rating <= 5
        )
);

-- index for review-based score queries
create index idx_kpi_review_scores_review_id on kpi_review_scores (review_id);

create index idx_kpi_review_scores_metric_id on kpi_review_scores (metric_id);

-- enable row level security
alter table kpi_review_scores enable row level security;

-- ============================================================================
-- UPDATED_AT TRIGGERS
-- ============================================================================

-- function to automatically update updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- apply updated_at trigger to all tables with updated_at column
create trigger update_companies_updated_at before update on companies
  for each row execute function update_updated_at_column();

create trigger update_company_invites_updated_at before update on company_invites
  for each row execute function update_updated_at_column();

create trigger update_user_profiles_updated_at before update on user_profiles
  for each row execute function update_updated_at_column();

create trigger update_teams_updated_at before update on teams
  for each row execute function update_updated_at_column();

create trigger update_team_members_updated_at before update on team_members
  for each row execute function update_updated_at_column();

create trigger update_goal_templates_updated_at before update on goal_templates
  for each row execute function update_updated_at_column();

create trigger update_goals_updated_at before update on goals
  for each row execute function update_updated_at_column();

create trigger update_milestones_updated_at before update on milestones
  for each row execute function update_updated_at_column();

create trigger update_cadence_sessions_updated_at before update on cadence_sessions
  for each row execute function update_updated_at_column();

create trigger update_checkpoints_updated_at before update on checkpoints
  for each row execute function update_updated_at_column();

create trigger update_assessments_updated_at before update on assessments
  for each row execute function update_updated_at_column();

create trigger update_kpi_templates_updated_at before update on kpi_templates
  for each row execute function update_updated_at_column();

create trigger update_kpi_template_metrics_updated_at before update on kpi_template_metrics
  for each row execute function update_updated_at_column();

create trigger update_developer_kpis_updated_at before update on developer_kpis
  for each row execute function update_updated_at_column();

create trigger update_developer_kpi_metrics_updated_at before update on developer_kpi_metrics
  for each row execute function update_updated_at_column();

create trigger update_kpi_reviews_updated_at before update on kpi_reviews
  for each row execute function update_updated_at_column();

create trigger update_kpi_review_scores_updated_at before update on kpi_review_scores
  for each row execute function update_updated_at_column();

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================