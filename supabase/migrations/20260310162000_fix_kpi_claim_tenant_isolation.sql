-- ============================================================================
-- Migration: Fix tenant isolation for KPI submissions and claim screenshots
-- Created: 2026-03-10 16:20:00 UTC
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1) Restrict TEAM_LEAD / COMPANY_ADMIN KPI submission access by same company
-- ----------------------------------------------------------------------------

drop policy if exists "Leads and admins can view KPI submissions" on kpi_metric_submissions;
create policy "Leads and admins can view KPI submissions"
on kpi_metric_submissions
for select
to authenticated
using (
  exists (
    select 1
    from user_profiles developer
    join user_profiles caller on caller.id = auth.uid()
    where developer.id = kpi_metric_submissions.developer_id
      and caller.role in ('TEAM_LEAD', 'COMPANY_ADMIN')
      and developer.company_id = caller.company_id
  )
);

drop policy if exists "Leads and admins can update KPI submissions" on kpi_metric_submissions;
create policy "Leads and admins can update KPI submissions"
on kpi_metric_submissions
for update
to authenticated
using (
  exists (
    select 1
    from user_profiles developer
    join user_profiles caller on caller.id = auth.uid()
    where developer.id = kpi_metric_submissions.developer_id
      and caller.role in ('TEAM_LEAD', 'COMPANY_ADMIN')
      and developer.company_id = caller.company_id
  )
)
with check (
  exists (
    select 1
    from user_profiles developer
    join user_profiles caller on caller.id = auth.uid()
    where developer.id = kpi_metric_submissions.developer_id
      and caller.role in ('TEAM_LEAD', 'COMPANY_ADMIN')
      and developer.company_id = caller.company_id
  )
);

-- ----------------------------------------------------------------------------
-- 2) Restrict storage screenshot read policy by same company relationship
-- ----------------------------------------------------------------------------

drop policy if exists "Leads and admins can read claim screenshots" on storage.objects;
create policy "Leads and admins can read claim screenshots"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'kpi-claims'
  and exists (
    select 1
    from kpi_metric_submissions s
    join user_profiles developer on developer.id = s.developer_id
    join user_profiles caller on caller.id = auth.uid()
    where caller.role in ('TEAM_LEAD', 'COMPANY_ADMIN')
      and developer.company_id = caller.company_id
      and exists (
        select 1
        from jsonb_array_elements_text(s.screenshot_paths) as p(path)
        where p.path = storage.objects.name
      )
  )
);
