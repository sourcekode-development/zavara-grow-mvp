-- ============================================================================
-- Consolidated Migration: Goals + Cadence Sessions + Effort + Streak
-- Created: 2026-03-09 18:00:00 UTC
-- Purpose:
--   - Finalize effort-based goal progress model
--   - Replace session_effects with session_effort
--   - Add streak fields and streak update function
--   - Collapse intermediate migrations into one canonical migration
-- ============================================================================

-- ----------------------------------------------------------------------------
-- GOALS: effort and streak fields
-- ----------------------------------------------------------------------------
alter table goals
  add column if not exists effort numeric,
  add column if not exists effort_description text,
  add column if not exists completed_effort numeric default 0 not null,
  add column if not exists current_streak integer default 0 not null,
  add column if not exists longest_streak integer default 0 not null,
  add column if not exists last_effort_date date;

-- Backfill goals effort data from legacy columns when present
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'goals' AND column_name = 'effects'
  ) THEN
    EXECUTE $q$
      UPDATE goals
      SET
        effort = COALESCE(effort, effects),
        effort_description = COALESCE(effort_description, effects_description),
        completed_effort = COALESCE(completed_effort, completed_effects, 0)
    $q$;
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- CADENCE SESSIONS: session_effort + completed_effort
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  -- Rename legacy column if needed
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cadence_sessions' AND column_name = 'session_effects'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cadence_sessions' AND column_name = 'session_effort'
  ) THEN
    ALTER TABLE cadence_sessions
      RENAME COLUMN session_effects TO session_effort;
  END IF;
END $$;

alter table cadence_sessions
  add column if not exists session_effort numeric default 1 not null,
  add column if not exists completed_effort numeric default 0 not null;

-- If completed effort was never tracked, infer from completed sessions once
update cadence_sessions
set completed_effort = session_effort
where status = 'COMPLETED'
  and completed_effort = 0;

-- ----------------------------------------------------------------------------
-- Constraints and indexes
-- ----------------------------------------------------------------------------
alter table goals
  drop constraint if exists chk_goals_effort_positive;
alter table goals
  add constraint chk_goals_effort_positive
  check (effort is null or effort > 0);

alter table goals
  drop constraint if exists chk_goals_completed_effort_non_negative;
alter table goals
  add constraint chk_goals_completed_effort_non_negative
  check (completed_effort >= 0);

alter table goals
  drop constraint if exists chk_goals_completed_effort_not_exceed_total;
alter table goals
  add constraint chk_goals_completed_effort_not_exceed_total
  check (effort is null or completed_effort <= effort);

alter table goals
  drop constraint if exists chk_goals_current_streak_non_negative;
alter table goals
  add constraint chk_goals_current_streak_non_negative
  check (current_streak >= 0);

alter table goals
  drop constraint if exists chk_goals_longest_streak_non_negative;
alter table goals
  add constraint chk_goals_longest_streak_non_negative
  check (longest_streak >= 0);

alter table cadence_sessions
  drop constraint if exists chk_cadence_sessions_session_effects_positive;
alter table cadence_sessions
  drop constraint if exists chk_cadence_sessions_session_effort_positive;
alter table cadence_sessions
  add constraint chk_cadence_sessions_session_effort_positive
  check (session_effort > 0);

alter table cadence_sessions
  drop constraint if exists chk_cadence_sessions_completed_effort_non_negative;
alter table cadence_sessions
  add constraint chk_cadence_sessions_completed_effort_non_negative
  check (completed_effort >= 0);

alter table cadence_sessions
  drop constraint if exists chk_cadence_sessions_completed_effort_not_exceed_session_effort;
alter table cadence_sessions
  add constraint chk_cadence_sessions_completed_effort_not_exceed_session_effort
  check (completed_effort <= session_effort);

create index if not exists idx_goals_effort on goals (effort);

-- ----------------------------------------------------------------------------
-- Streak function (atomic update with row lock)
-- ----------------------------------------------------------------------------
create or replace function apply_goal_effort_streak(p_goal_id uuid)
returns table (
  current_streak integer,
  longest_streak integer,
  last_effort_date date
)
language plpgsql
security definer
as $$
declare
  v_goal goals%rowtype;
  v_today date := current_date;
  v_days_difference integer;
  v_next_current integer;
  v_next_longest integer;
begin
  select *
  into v_goal
  from goals
  where id = p_goal_id
  for update;

  if not found then
    raise exception 'Goal not found: %', p_goal_id;
  end if;

  if v_goal.last_effort_date is null then
    v_days_difference := null;
  else
    v_days_difference := v_today - v_goal.last_effort_date;
  end if;

  -- one increment per day
  if v_days_difference = 0 then
    return query
    select v_goal.current_streak, v_goal.longest_streak, v_goal.last_effort_date;
    return;
  end if;

  if v_goal.last_effort_date is null then
    v_next_current := 1;
  elsif v_days_difference <= 3 then
    -- 2-day grace period (up to 3 calendar-day gap is still continuous)
    v_next_current := v_goal.current_streak + 1;
  else
    v_next_current := 1;
  end if;

  v_next_longest := greatest(v_goal.longest_streak, v_next_current);

  update goals
  set
    current_streak = v_next_current,
    longest_streak = v_next_longest,
    last_effort_date = v_today,
    updated_at = now()
  where id = p_goal_id;

  return query
  select v_next_current, v_next_longest, v_today;
end;
$$;

comment on column goals.effort is 'Total effort required to complete the goal';
comment on column goals.effort_description is 'Informational text for effort unit definition';
comment on column goals.completed_effort is 'Decimal-safe completed effort value';
comment on column goals.last_effort_date is 'Date when completed effort last increased for streak calculation';
comment on column cadence_sessions.session_effort is 'Planned effort for this session; supports decimals';
comment on column cadence_sessions.completed_effort is 'Actual effort completed in this session; supports decimals';
comment on function apply_goal_effort_streak(uuid) is 'Updates goal streak once per day when completed effort increases, with 2-day grace period';
