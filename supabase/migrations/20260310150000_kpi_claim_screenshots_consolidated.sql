-- ============================================================================
-- Migration: KPI Claim Screenshots Consolidated (DB + RLS + Storage Policies)
-- Created: 2026-03-10 15:00:00 UTC
-- ============================================================================

-- 1) DB column to store screenshot storage paths (not full URLs)
alter table kpi_metric_submissions
add column if not exists screenshot_paths jsonb not null default '[]'::jsonb;

comment on column kpi_metric_submissions.screenshot_paths is
'JSONB array of Supabase Storage object paths for claim screenshots (max 2)';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'chk_kpi_metric_submissions_screenshot_paths_limit'
  ) then
    alter table kpi_metric_submissions
    add constraint chk_kpi_metric_submissions_screenshot_paths_limit
    check (
      jsonb_typeof(screenshot_paths) = 'array'
      and jsonb_array_length(screenshot_paths) <= 2
    );
  end if;
end $$;

-- 2) KPI submissions RLS policies
alter table kpi_metric_submissions enable row level security;

drop policy if exists "Users can insert KPI submissions" on kpi_metric_submissions;
create policy "Users can insert KPI submissions"
on kpi_metric_submissions
for insert
to authenticated
with check (auth.uid() = developer_id);

drop policy if exists "Users can view their KPI submissions" on kpi_metric_submissions;
create policy "Users can view their KPI submissions"
on kpi_metric_submissions
for select
to authenticated
using (auth.uid() = developer_id);

drop policy if exists "Users can update their KPI submissions" on kpi_metric_submissions;
create policy "Users can update their KPI submissions"
on kpi_metric_submissions
for update
to authenticated
using (
  auth.uid() = developer_id
  and status = 'PENDING'
)
with check (
  auth.uid() = developer_id
  and status = 'PENDING'
);

drop policy if exists "Users can delete their KPI submissions" on kpi_metric_submissions;
create policy "Users can delete their KPI submissions"
on kpi_metric_submissions
for delete
to authenticated
using (auth.uid() = developer_id);

drop policy if exists "Leads and admins can view KPI submissions" on kpi_metric_submissions;
create policy "Leads and admins can view KPI submissions"
on kpi_metric_submissions
for select
to authenticated
using (
  exists (
    select 1
    from user_profiles up
    where up.id = auth.uid()
      and up.role in ('TEAM_LEAD', 'COMPANY_ADMIN')
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
    from user_profiles up
    where up.id = auth.uid()
      and up.role in ('TEAM_LEAD', 'COMPANY_ADMIN')
  )
)
with check (
  exists (
    select 1
    from user_profiles up
    where up.id = auth.uid()
      and up.role in ('TEAM_LEAD', 'COMPANY_ADMIN')
  )
);

-- 3) Storage bucket and object-level policies
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'kpi-claims',
  'kpi-claims',
  false,
  5242880,
  array['image/jpeg', 'image/jpg', 'image/png']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Users upload their claim screenshots" on storage.objects;
create policy "Users upload their claim screenshots"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'kpi-claims'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "Users read their screenshots" on storage.objects;
create policy "Users read their screenshots"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'kpi-claims'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "Leads and admins can read claim screenshots" on storage.objects;
create policy "Leads and admins can read claim screenshots"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'kpi-claims'
  and exists (
    select 1
    from user_profiles up
    where up.id = auth.uid()
      and up.role in ('TEAM_LEAD', 'COMPANY_ADMIN')
  )
);

drop policy if exists "Users delete their screenshots" on storage.objects;
create policy "Users delete their screenshots"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'kpi-claims'
  and auth.uid()::text = (storage.foldername(name))[1]
);
