-- ============================================================================
-- Migration: Add goal duration in months
-- Created: 2026-03-12 11:00:00 UTC
-- ============================================================================

alter table goals
add column if not exists duration_months integer;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'chk_goals_duration_months_positive'
  ) then
    alter table goals
    add constraint chk_goals_duration_months_positive
    check (duration_months is null or duration_months > 0);
  end if;
end $$;

comment on column goals.duration_months is
'Selected goal duration in months, used to calculate target_end_date when the goal starts.';
