-- ============================================================================
-- Migration: Restructure KPI Tables for Evidence-Based Performance Tracking
-- Created: 2026-03-01 00:00:00 UTC
-- Description: Transforms KPI system from weighted-percentage model to
--              points-based evidence ledger with submission workflow
--
-- Changes:
-- - Drops old KPI tables (kpi_review_scores, kpi_reviews, developer_kpi_metrics,
--   developer_kpis, kpi_template_metrics, kpi_templates)
-- - Creates new kpi_categories table for metric organization
-- - Recreates kpi_templates with total_target_points (1000 standard)
-- - Recreates kpi_template_metrics with target_points instead of weightage
-- - Recreates developer_kpis with simplified status (ACTIVE, COMPLETED, ARCHIVED)
-- - Recreates developer_kpi_metrics with accumulated_points tracking
-- - Creates kpi_metric_submissions for daily evidence workflow
-- - Recreates kpi_reviews with final_score_percentage
-- - Updates/creates necessary enums
--
-- Note: RLS is NOT enabled in this migration as per requirements
-- ============================================================================

-- ============================================================================
-- STEP 1: DROP EXISTING KPI TABLES (cascades will handle foreign keys)
-- ============================================================================

-- drop in reverse dependency order
drop table if exists kpi_review_scores cascade;

drop table if exists kpi_reviews cascade;

drop table if exists developer_kpi_metrics cascade;

drop table if exists developer_kpis cascade;

drop table if exists kpi_template_metrics cascade;

drop table if exists kpi_templates cascade;

-- ============================================================================
-- STEP 2: UPDATE ENUMS
-- ============================================================================

-- drop old kpi-related enums
drop type if exists kpi_review_status cascade;

drop type if exists kpi_status cascade;

drop type if exists kpi_cycle_type cascade;

-- recreate kpi_cycle_type with ANNUAL instead of ANNUALLY
create type kpi_cycle_type as enum (
  'QUARTERLY',
  'HALF_YEARLY',
  'ANNUAL',
  'CUSTOM'
);

-- recreate kpi_status with only ACTIVE, COMPLETED, ARCHIVED (no DRAFT)
create type kpi_status as enum (
  'ACTIVE',
  'COMPLETED',
  'ARCHIVED'
);

-- recreate kpi_review_status with simplified states
create type kpi_review_status as enum (
  'DRAFT',
  'FINALIZED'
);

-- create new enum for submission workflow
create type kpi_submission_status as enum (
  'PENDING',
  'APPROVED',
  'REJECTED',
  'CHANGES_REQUESTED'
);

-- ============================================================================
-- STEP 3: CREATE NEW KPI CONFIGURATION TABLES (THE LIBRARY)
-- ============================================================================

-- kpi_categories: defines buckets for metrics (e.g., technical, soft skills)
create table kpi_categories (
    id uuid primary key default gen_random_uuid (),
    company_id uuid references companies (id) on delete cascade,
    -- null means zavara default category
    name text not null,
    description text,
    created_at timestamp
    with
        time zone default now() not null,
        updated_at timestamp
    with
        time zone default now() not null
);

-- index for company-specific category queries
create index idx_kpi_categories_company_id on kpi_categories (company_id);

-- kpi_templates: master blueprint for a role or level
create table kpi_templates (
    id uuid primary key default gen_random_uuid (),
    company_id uuid references companies (id) on delete cascade,
    -- null means global zavara template
    title text not null,
    cycle_type kpi_cycle_type not null,
    total_target_points integer not null default 1000,
    -- strictly enforced at 1000 for standard weighting
    created_at timestamp
    with
        time zone default now() not null,
        updated_at timestamp
    with
        time zone default now() not null,
        -- constraint to ensure total_target_points is positive
        constraint chk_total_target_points_positive check (total_target_points > 0)
);

-- index for company-specific template queries
create index idx_kpi_templates_company_id on kpi_templates (company_id);

-- kpi_template_metrics: individual line items within a blueprint
create table kpi_template_metrics (
    id uuid primary key default gen_random_uuid (),
    template_id uuid not null references kpi_templates (id) on delete cascade,
    category_id uuid not null references kpi_categories (id) on delete restrict,
    name text not null,
    target_points integer not null,
    -- the "weight" of this item (e.g., 200 out of 1000)
    description text,
    -- guidelines on how to earn these points
    created_at timestamp
    with
        time zone default now() not null,
        updated_at timestamp
    with
        time zone default now() not null,
        -- constraint to ensure target_points is positive
        constraint chk_target_points_positive check (target_points > 0)
);

-- indexes for template and category based queries
create index idx_kpi_template_metrics_template_id on kpi_template_metrics (template_id);

create index idx_kpi_template_metrics_category_id on kpi_template_metrics (category_id);

-- ============================================================================
-- STEP 4: CREATE KPI EXECUTION TABLES (THE DEVELOPER SNAPSHOT)
-- ============================================================================

-- developer_kpis: active performance container for a specific user
create table developer_kpis (
    id uuid primary key default gen_random_uuid (),
    user_id uuid not null references user_profiles (id) on delete cascade,
    assigned_by uuid not null references user_profiles (id) on delete cascade,
    title text not null,
    -- copied from template
    status kpi_status default 'ACTIVE' not null,
    start_date date not null,
    end_date date,
    -- nullable for open-ended cycles
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

-- developer_kpi_metrics: live progress tracker for each metric
create table developer_kpi_metrics (
    id uuid primary key default gen_random_uuid (),
    developer_kpi_id uuid not null references developer_kpis (id) on delete cascade,
    category_id uuid not null references kpi_categories (id) on delete restrict,
    name text not null,
    target_points integer not null,
    -- e.g., 300
    accumulated_points integer not null default 0,
    -- starts at 0, updated as claims are approved
    created_at timestamp
    with
        time zone default now() not null,
        updated_at timestamp
    with
        time zone default now() not null,
        -- constraint to ensure accumulated_points doesn't exceed target
        constraint chk_accumulated_not_exceed_target check (
            accumulated_points <= target_points
        ),
        -- constraint to ensure both point values are non-negative
        constraint chk_points_non_negative check (
            target_points >= 0
            and accumulated_points >= 0
        )
);

-- indexes for developer kpi and category based queries
create index idx_developer_kpi_metrics_developer_kpi_id on developer_kpi_metrics (developer_kpi_id);

create index idx_developer_kpi_metrics_category_id on developer_kpi_metrics (category_id);

-- ============================================================================
-- STEP 5: CREATE EVIDENCE LEDGER (DAILY WORKFLOW)
-- ============================================================================

-- kpi_metric_submissions: proof of work submitted by the developer
create table kpi_metric_submissions (
    id uuid primary key default gen_random_uuid (),
    metric_id uuid not null references developer_kpi_metrics (id) on delete cascade,
    developer_id uuid not null references user_profiles (id) on delete cascade,
    description text not null,
    -- e.g., "i mentored sujai on webrtc implementation for 2 hours"
    attachments jsonb,
    -- array of s3/supabase storage urls for screenshots
    status kpi_submission_status default 'PENDING' not null,
    points_awarded integer,
    -- assigned by lead upon approval
    reviewer_id uuid references user_profiles (id) on delete set null,
    -- the lead who reviewed
    reviewer_comments text,
    created_at timestamp
    with
        time zone default now() not null,
        updated_at timestamp
    with
        time zone default now() not null,
        reviewed_at timestamp
    with
        time zone,
        -- timestamp when review action was taken
        -- constraint to ensure points_awarded is only set when approved
        constraint chk_points_awarded_with_approval check (
            (
                status = 'APPROVED'
                and points_awarded is not null
            )
            or (
                status != 'APPROVED'
                and points_awarded is null
            )
        ),
        -- constraint to ensure points_awarded is non-negative
        constraint chk_points_awarded_non_negative check (
            points_awarded is null
            or points_awarded >= 0
        )
);

-- indexes for efficient querying
create index idx_kpi_metric_submissions_metric_id on kpi_metric_submissions (metric_id);

create index idx_kpi_metric_submissions_developer_id on kpi_metric_submissions (developer_id);

create index idx_kpi_metric_submissions_reviewer_id on kpi_metric_submissions (reviewer_id);

create index idx_kpi_metric_submissions_status on kpi_metric_submissions (status);

create index idx_kpi_metric_submissions_created_at on kpi_metric_submissions (created_at);

-- ============================================================================
-- STEP 6: CREATE FINAL REVIEW TABLE (THE SCORECARD)
-- ============================================================================

-- kpi_reviews: official performance record at cycle completion
create table kpi_reviews (
    id uuid primary key default gen_random_uuid (),
    developer_kpi_id uuid not null references developer_kpis (id) on delete cascade,
    final_score_percentage numeric(5, 2),
    -- (total accumulated points / 10)
    summary_feedback text,
    status kpi_review_status default 'DRAFT' not null,
    created_at timestamp
    with
        time zone default now() not null,
        updated_at timestamp
    with
        time zone default now() not null,
        -- constraint to ensure final_score_percentage is between 0 and 100
        constraint chk_final_score_range check (
            final_score_percentage is null
            or (
                final_score_percentage >= 0
                and final_score_percentage <= 100
            )
        )
);

-- index for developer kpi based review queries
create index idx_kpi_reviews_developer_kpi_id on kpi_reviews (developer_kpi_id);

create index idx_kpi_reviews_status on kpi_reviews (status);

-- ============================================================================
-- STEP 7: CREATE UPDATED_AT TRIGGERS
-- ============================================================================

-- apply updated_at trigger to new kpi tables
create trigger update_kpi_categories_updated_at 
    before update on kpi_categories
    for each row execute function update_updated_at_column();

create trigger update_kpi_templates_updated_at 
    before update on kpi_templates
    for each row execute function update_updated_at_column();

create trigger update_kpi_template_metrics_updated_at 
    before update on kpi_template_metrics
    for each row execute function update_updated_at_column();

create trigger update_developer_kpis_updated_at 
    before update on developer_kpis
    for each row execute function update_updated_at_column();

create trigger update_developer_kpi_metrics_updated_at 
    before update on developer_kpi_metrics
    for each row execute function update_updated_at_column();

create trigger update_kpi_metric_submissions_updated_at 
    before update on kpi_metric_submissions
    for each row execute function update_updated_at_column();

create trigger update_kpi_reviews_updated_at 
    before update on kpi_reviews
    for each row execute function update_updated_at_column();

-- ============================================================================
-- STEP 8: ADD HELPFUL COMMENTS
-- ============================================================================

comment on
table kpi_categories is 'Defines buckets for KPI metrics (e.g., Technical Excellence, Soft Skills)';

comment on
table kpi_templates is 'Master blueprints for role-based performance frameworks with 1000-point standard';

comment on
table kpi_template_metrics is 'Individual weighted line items within a KPI template blueprint';

comment on
table developer_kpis is 'Immutable snapshots of KPI templates assigned to developers';

comment on
table developer_kpi_metrics is 'Live progress trackers with accumulated points from approved submissions';

comment on
table kpi_metric_submissions is 'Evidence ledger where developers claim points and leads verify work';

comment on
table kpi_reviews is 'Final performance scorecards generated at cycle completion';

comment on column kpi_templates.total_target_points is 'Standard is 1000 points; sum of all metrics should equal this';

comment on column developer_kpi_metrics.accumulated_points is 'Auto-incremented when submissions are approved';

comment on column kpi_metric_submissions.attachments is 'JSONB array of storage URLs for proof (screenshots, links, etc.)';

comment on column kpi_reviews.final_score_percentage is 'Calculated as: (sum of accumulated_points / total_target_points) * 100';

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================