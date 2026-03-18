-- ============================================================================
-- Migration: Create Up Skill Feature
-- Created: 2026-03-18 07:35:56 UTC
-- Description: Adds the developer-centric up skill program, templates, reviews,
-- effort logging, and developer streak tables.
--
-- Affected Tables:
-- - upskill_program_templates
-- - upskill_template_modules
-- - upskill_programs
-- - upskill_program_modules
-- - upskill_program_reviews
-- - upskill_module_effort_logs
-- - developer_upskill_stats
-- ============================================================================

create type upskill_program_status as enum (
  'DRAFT',
  'PENDING_REVIEW',
  'APPROVED',
  'IN_PROGRESS',
  'COMPLETED'
);

create type upskill_module_status as enum (
  'TODO',
  'IN_PROGRESS',
  'COMPLETED',
  'WONT_DO'
);

create type upskill_review_decision as enum (
  'PENDING',
  'APPROVED',
  'CHANGES_REQUESTED',
  'AUTO_CLOSED'
);

create table upskill_program_templates (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  created_by uuid not null references user_profiles(id) on delete cascade,
  title text not null,
  description text,
  total_effort numeric,
  is_active boolean default true not null,
  is_published boolean default false not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  constraint chk_upskill_program_templates_total_effort_positive
    check (total_effort is null or total_effort > 0)
);

create table upskill_template_modules (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references upskill_program_templates(id) on delete cascade,
  order_index integer default 0 not null,
  title text not null,
  description text,
  effort numeric,
  content jsonb,
  content_plain_text text,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  constraint chk_upskill_template_modules_effort_positive
    check (effort is null or effort > 0)
);

create table upskill_programs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  created_by uuid not null references user_profiles(id) on delete cascade,
  user_id uuid not null references user_profiles(id) on delete cascade,
  template_id uuid references upskill_program_templates(id) on delete set null,
  title text not null,
  description text,
  total_effort numeric,
  status upskill_program_status default 'DRAFT' not null,
  review_round integer default 0 not null,
  approved_by uuid references user_profiles(id) on delete set null,
  approved_at timestamp with time zone,
  started_at timestamp with time zone,
  completed_at timestamp with time zone,
  current_streak integer default 0 not null,
  longest_streak integer default 0 not null,
  last_activity_date date,
  total_modules integer default 0 not null,
  completed_modules integer default 0 not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  constraint chk_upskill_programs_total_effort_positive
    check (total_effort is null or total_effort > 0),
  constraint chk_upskill_programs_current_streak_non_negative
    check (current_streak >= 0),
  constraint chk_upskill_programs_longest_streak_non_negative
    check (longest_streak >= 0),
  constraint chk_upskill_programs_module_counts_non_negative
    check (total_modules >= 0 and completed_modules >= 0 and completed_modules <= total_modules)
);

create table upskill_program_modules (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references upskill_programs(id) on delete cascade,
  template_module_id uuid references upskill_template_modules(id) on delete set null,
  order_index integer default 0 not null,
  title text not null,
  description text,
  effort numeric,
  content jsonb,
  content_plain_text text,
  status upskill_module_status default 'TODO' not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  constraint chk_upskill_program_modules_effort_positive
    check (effort is null or effort > 0)
);

create table upskill_program_reviews (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references upskill_programs(id) on delete cascade,
  review_round integer default 1 not null,
  reviewer_id uuid not null references user_profiles(id) on delete cascade,
  decision upskill_review_decision default 'PENDING' not null,
  comments text,
  responded_at timestamp with time zone,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  unique (program_id, review_round, reviewer_id)
);

create table upskill_module_effort_logs (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references upskill_programs(id) on delete cascade,
  module_id uuid not null references upskill_program_modules(id) on delete cascade,
  user_id uuid not null references user_profiles(id) on delete cascade,
  effort_used numeric not null,
  notes text,
  logged_on date default current_date not null,
  created_at timestamp with time zone default now() not null,
  constraint chk_upskill_module_effort_logs_effort_positive
    check (effort_used > 0)
);

create table developer_upskill_stats (
  user_id uuid primary key references user_profiles(id) on delete cascade,
  company_id uuid not null references companies(id) on delete cascade,
  current_streak integer default 0 not null,
  longest_streak integer default 0 not null,
  last_activity_date date,
  total_programs_started integer default 0 not null,
  total_programs_completed integer default 0 not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  constraint chk_developer_upskill_stats_current_streak_non_negative
    check (current_streak >= 0),
  constraint chk_developer_upskill_stats_longest_streak_non_negative
    check (longest_streak >= 0),
  constraint chk_developer_upskill_stats_program_counts_non_negative
    check (total_programs_started >= 0 and total_programs_completed >= 0)
);

create index idx_upskill_program_templates_company_id
  on upskill_program_templates(company_id);
create index idx_upskill_program_templates_created_by
  on upskill_program_templates(created_by);
create index idx_upskill_template_modules_template_id
  on upskill_template_modules(template_id);
create index idx_upskill_template_modules_order_index
  on upskill_template_modules(template_id, order_index);
create index idx_upskill_programs_company_id
  on upskill_programs(company_id);
create index idx_upskill_programs_user_id
  on upskill_programs(user_id);
create index idx_upskill_programs_created_by
  on upskill_programs(created_by);
create index idx_upskill_programs_status
  on upskill_programs(status);
create index idx_upskill_programs_template_id
  on upskill_programs(template_id);
create index idx_upskill_program_modules_program_id
  on upskill_program_modules(program_id);
create index idx_upskill_program_modules_order_index
  on upskill_program_modules(program_id, order_index);
create index idx_upskill_program_modules_status
  on upskill_program_modules(status);
create index idx_upskill_program_reviews_program_id
  on upskill_program_reviews(program_id);
create index idx_upskill_program_reviews_reviewer_id
  on upskill_program_reviews(reviewer_id);
create index idx_upskill_program_reviews_decision
  on upskill_program_reviews(decision);
create index idx_upskill_module_effort_logs_program_id
  on upskill_module_effort_logs(program_id);
create index idx_upskill_module_effort_logs_module_id
  on upskill_module_effort_logs(module_id);
create index idx_upskill_module_effort_logs_user_id
  on upskill_module_effort_logs(user_id);
create index idx_upskill_module_effort_logs_logged_on
  on upskill_module_effort_logs(logged_on desc);
create index idx_developer_upskill_stats_company_id
  on developer_upskill_stats(company_id);
create index idx_developer_upskill_stats_last_activity_date
  on developer_upskill_stats(last_activity_date desc);

alter table upskill_program_templates enable row level security;
alter table upskill_template_modules enable row level security;
alter table upskill_programs enable row level security;
alter table upskill_program_modules enable row level security;
alter table upskill_program_reviews enable row level security;
alter table upskill_module_effort_logs enable row level security;
alter table developer_upskill_stats enable row level security;

create trigger update_upskill_program_templates_updated_at
  before update on upskill_program_templates
  for each row execute function update_updated_at_column();

create trigger update_upskill_template_modules_updated_at
  before update on upskill_template_modules
  for each row execute function update_updated_at_column();

create trigger update_upskill_programs_updated_at
  before update on upskill_programs
  for each row execute function update_updated_at_column();

create trigger update_upskill_program_modules_updated_at
  before update on upskill_program_modules
  for each row execute function update_updated_at_column();

create trigger update_upskill_program_reviews_updated_at
  before update on upskill_program_reviews
  for each row execute function update_updated_at_column();

create trigger update_developer_upskill_stats_updated_at
  before update on developer_upskill_stats
  for each row execute function update_updated_at_column();

comment on table upskill_program_templates is 'Reusable up skill program templates';
comment on table upskill_template_modules is 'Template modules that can be cloned into up skill programs';
comment on table upskill_programs is 'Developer-owned up skill programs with review and streak metadata';
comment on table upskill_program_modules is 'Modules within an up skill program';
comment on table upskill_program_reviews is 'Reviewer assignments and decisions for up skill submissions';
comment on table upskill_module_effort_logs is 'Effort logs entered by developers against up skill modules';
comment on table developer_upskill_stats is 'Denormalized developer-level up skill streak and summary counters';
