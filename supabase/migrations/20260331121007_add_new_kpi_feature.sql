-- ============================================================================
-- Migration: add_new_kpi_feature
-- Created: 2026-03-31 12:10:07 UTC
-- Description: Rebuild KPI feature with flexible dimensions, metrics, claims,
-- partial approvals, and impact metrics.
-- ============================================================================

begin;

drop type if exists audit_action cascade;
drop type if exists claim_status cascade;
drop type if exists scope_enum cascade;

create type scope_enum as enum ('PLATFORM', 'COMPANY');
create type claim_status as enum ('PENDING', 'APPROVED', 'REJECTED');
create type audit_action as enum ('SUBMITTED', 'APPROVED', 'REJECTED', 'COMMENTED');

do $$
begin
  if not exists (
    select 1
    from pg_type
    where typname = 'kpi_status'
  ) then
    create type kpi_status as enum ('ACTIVE', 'CLOSED');
  end if;
end
$$;

create table dimensions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  scope scope_enum not null,
  company_id uuid references companies(id) on delete cascade,
  created_by uuid references user_profiles(id) on delete set null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint chk_dimensions_scope_company
    check (
      (scope = 'PLATFORM' and company_id is null)
      or (scope = 'COMPANY' and company_id is not null)
    )
);

create table metrics (
  id uuid primary key default gen_random_uuid(),
  dimension_id uuid not null references dimensions(id) on delete cascade,
  name text not null,
  description text,
  how_to_measure text,
  scope scope_enum not null,
  company_id uuid references companies(id) on delete cascade,
  created_by uuid references user_profiles(id) on delete set null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint chk_metrics_scope_company
    check (
      (scope = 'PLATFORM' and company_id is null)
      or (scope = 'COMPANY' and company_id is not null)
    )
);

create table kpi_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  scope scope_enum not null,
  company_id uuid references companies(id) on delete cascade,
  created_by uuid not null references user_profiles(id) on delete restrict,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint chk_kpi_templates_scope_company
    check (
      (scope = 'PLATFORM' and company_id is null)
      or (scope = 'COMPANY' and company_id is not null)
    )
);

create table template_dimensions (
  template_id uuid not null references kpi_templates(id) on delete cascade,
  dimension_id uuid not null references dimensions(id) on delete restrict,
  weight_percentage numeric(5,2) not null,
  created_at timestamp with time zone not null default now(),
  primary key (template_id, dimension_id),
  constraint chk_template_dimension_weight_range
    check (weight_percentage > 0 and weight_percentage <= 100)
);

create table template_metrics (
  template_id uuid not null references kpi_templates(id) on delete cascade,
  metric_id uuid not null references metrics(id) on delete restrict,
  max_points integer not null,
  created_at timestamp with time zone not null default now(),
  primary key (template_id, metric_id),
  constraint chk_template_metric_points_positive
    check (max_points > 0)
);

create table assigned_kpis (
  id uuid primary key default gen_random_uuid(),
  developer_id uuid not null references user_profiles(id) on delete restrict,
  template_id uuid references kpi_templates(id) on delete set null,
  status kpi_status not null default 'ACTIVE',
  start_date date not null,
  end_date date not null,
  total_target_points integer not null default 1000,
  created_by uuid not null references user_profiles(id) on delete restrict,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint chk_assigned_kpis_dates check (end_date >= start_date),
  constraint chk_assigned_kpis_total_target_points check (total_target_points > 0)
);

create unique index uq_assigned_kpis_active_developer
  on assigned_kpis (developer_id)
  where status = 'ACTIVE';

create table kpi_reviewers (
  kpi_id uuid not null references assigned_kpis(id) on delete cascade,
  reviewer_id uuid not null references user_profiles(id) on delete restrict,
  created_at timestamp with time zone not null default now(),
  primary key (kpi_id, reviewer_id)
);

create table kpi_dimensions (
  kpi_id uuid not null references assigned_kpis(id) on delete cascade,
  dimension_id uuid not null references dimensions(id) on delete restrict,
  weight_percentage numeric(5,2) not null,
  created_at timestamp with time zone not null default now(),
  primary key (kpi_id, dimension_id),
  constraint chk_kpi_dimension_weight_range
    check (weight_percentage > 0 and weight_percentage <= 100)
);

create table kpi_metrics (
  id uuid primary key default gen_random_uuid(),
  kpi_id uuid not null references assigned_kpis(id) on delete cascade,
  metric_id uuid not null references metrics(id) on delete restrict,
  max_points integer not null,
  is_impact_metric boolean not null default false,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint chk_kpi_metrics_points_positive check (max_points > 0)
);

create unique index uq_kpi_metrics_kpi_metric
  on kpi_metrics (kpi_id, metric_id);

create table claims (
  id uuid primary key default gen_random_uuid(),
  kpi_id uuid not null references assigned_kpis(id) on delete cascade,
  metric_id uuid not null references kpi_metrics(id) on delete cascade,
  submitter_id uuid not null references user_profiles(id) on delete restrict,
  status claim_status not null default 'PENDING',
  evidence_text text not null,
  evidence_attachments jsonb,
  awarded_points integer,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint chk_claims_awarded_points_non_negative
    check (awarded_points is null or awarded_points > 0)
);

create table claim_audit_logs (
  id uuid primary key default gen_random_uuid(),
  claim_id uuid not null references claims(id) on delete cascade,
  actor_id uuid not null references user_profiles(id) on delete restrict,
  action audit_action not null,
  comment_text text,
  created_at timestamp with time zone not null default now()
);

create index idx_dimensions_scope_company_id on dimensions(scope, company_id);
create index idx_metrics_dimension_id on metrics(dimension_id);
create index idx_metrics_scope_company_id on metrics(scope, company_id);
create index idx_kpi_templates_scope_company_id on kpi_templates(scope, company_id);
create index idx_template_dimensions_template_id on template_dimensions(template_id);
create index idx_template_metrics_template_id on template_metrics(template_id);
create index idx_assigned_kpis_developer_id on assigned_kpis(developer_id);
create index idx_assigned_kpis_status on assigned_kpis(status);
create index idx_kpi_reviewers_reviewer_id on kpi_reviewers(reviewer_id);
create index idx_kpi_dimensions_kpi_id on kpi_dimensions(kpi_id);
create index idx_kpi_metrics_kpi_id on kpi_metrics(kpi_id);
create index idx_claims_kpi_id on claims(kpi_id);
create index idx_claims_metric_id on claims(metric_id);
create index idx_claims_submitter_id on claims(submitter_id);
create index idx_claims_status on claims(status);
create index idx_claims_created_at on claims(created_at desc);
create index idx_claim_audit_logs_claim_id on claim_audit_logs(claim_id);

create trigger update_dimensions_updated_at
before update on dimensions
for each row execute function update_updated_at_column();

create trigger update_metrics_updated_at
before update on metrics
for each row execute function update_updated_at_column();

create trigger update_kpi_templates_updated_at
before update on kpi_templates
for each row execute function update_updated_at_column();

create trigger update_assigned_kpis_updated_at
before update on assigned_kpis
for each row execute function update_updated_at_column();

create trigger update_kpi_metrics_updated_at
before update on kpi_metrics
for each row execute function update_updated_at_column();

create trigger update_claims_updated_at
before update on claims
for each row execute function update_updated_at_column();

comment on table dimensions is 'KPI library dimensions grouped by platform or company scope';
comment on table metrics is 'KPI library metrics attached to dimensions';
comment on table assigned_kpis is 'Active KPI snapshots assigned to developers';
comment on table kpi_metrics is 'Snapshotted KPI metrics including impact metrics';
comment on column claims.metric_id is 'References kpi_metrics.id even though the legacy column name remains metric_id';
comment on column claims.evidence_attachments is 'Future-use JSON array of attachment metadata';

commit;
