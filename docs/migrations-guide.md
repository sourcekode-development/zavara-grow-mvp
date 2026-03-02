# Database Migrations Guide

This document explains how to create and run database migrations for Zavara Grow using Supabase CLI.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Migration File Naming Convention](#migration-file-naming-convention)
- [Creating a New Migration](#creating-a-new-migration)
- [Running Migrations](#running-migrations)
- [Migration Best Practices](#migration-best-practices)
- [SQL Guidelines](#sql-guidelines)

---

## Prerequisites

Ensure you have the Supabase CLI installed:

```bash
# Install via npm
npm install -g supabase

# Or via Homebrew (macOS)
brew install supabase/tap/supabase
```

Verify installation:

```bash
supabase --version
```

---

## Migration File Naming Convention

All migration files **MUST** follow this strict naming format:

```
YYYYMMDDHHmmss_short_description.sql
```

### Format Breakdown:

- `YYYY` - Four digits for the year (e.g., `2026`)
- `MM` - Two digits for the month (01 to 12)
- `DD` - Two digits for the day (01 to 31)
- `HH` - Two digits for the hour in 24-hour format (00 to 23)
- `mm` - Two digits for the minute (00 to 59)
- `ss` - Two digits for the second (00 to 59)
- `_short_description` - A brief, snake_case description of the migration

### Examples:

```
20260228143000_create_base_tables.sql
20260301120000_add_user_preferences.sql
20260301143500_add_goal_tags.sql
```

**Important:** Use UTC time for the timestamp portion to avoid conflicts across different timezones.

---

## Creating a New Migration

### Method 1: Manual Creation

1. Create a new file in `supabase/migrations/` with the proper naming convention:

```bash
touch supabase/migrations/$(date -u +%Y%m%d%H%M%S)_your_description.sql
```

2. Add your SQL with proper documentation:

```sql
-- ============================================================================
-- Migration: [Brief Title]
-- Created: [YYYY-MM-DD HH:MM:SS UTC]
-- Description: [Detailed description of what this migration does]
--
-- Affected Tables: [list tables being created/modified]
-- Special Considerations: [any important notes]
-- ============================================================================

-- Your SQL code here
create table example (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

-- enable row level security
alter table example enable row level security;

-- add updated_at trigger
create trigger update_example_updated_at before update on example
  for each row execute function update_updated_at_column();
```

### Method 2: Using Supabase CLI

Generate a new migration file:

```bash
supabase migration new your_description_here
```

This will create a timestamped file in `supabase/migrations/` that you can edit.

---

## Running Migrations

### Local Development

1. **Start local Supabase instance:**

```bash
supabase start
```

2. **Apply migrations:**

```bash
supabase db reset
```

This will reset the database and apply all migrations in order.

Or apply migrations without resetting:

```bash
supabase migration up
```

3. **View migration status:**

```bash
supabase migration list
```

### Production Deployment

1. **Link to your Supabase project:**

```bash
supabase link --project-ref your-project-ref
```

2. **Push migrations to production:**

```bash
supabase db push
```

**⚠️ Warning:** Always test migrations locally before pushing to production.

### Rollback Migrations

To rollback the last migration:

```bash
supabase migration down
```

---

## Migration Best Practices

### 1. **Always Include Header Comments**

Every migration should have a comprehensive header explaining:

- What it does
- Which tables it affects
- Any destructive operations
- Dependencies on other migrations

### 2. **Enable RLS on All Tables**

Even for tables intended for public access:

```sql
alter table your_table enable row level security;
```

RLS policies can be added later but the security layer should be enabled from the start.

### 3. **Use Lowercase for SQL Keywords**

```sql
-- Good
create table users (...);

-- Avoid
CREATE TABLE users (...);
```

### 4. **Always Include Timestamp Fields**

```sql
created_at timestamp with time zone default now() not null,
updated_at timestamp with time zone default now() not null
```

### 5. **Add Indexes for Foreign Keys**

Always index foreign key columns for query performance:

```sql
create index idx_orders_user_id on orders(user_id);
```

### 6. **Comment Destructive Operations**

Add warnings for any data-destructive SQL:

```sql
-- ⚠️ WARNING: This will permanently delete all records in the old_table
-- Ensure backup is taken before running this migration
drop table if exists old_table cascade;
```

### 7. **Use Enums for Status Fields**

```sql
create type status_type as enum ('active', 'inactive', 'pending');
```

This ensures data consistency and prevents invalid values.

### 8. **Test Rollback Scenarios**

Always create a corresponding "down" migration or document rollback steps if the migration cannot be easily reversed.

---

## SQL Guidelines

### Creating Tables

```sql
create table table_name (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  name text not null,
  description text,
  status status_enum default 'active' not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

-- indexes for performance
create index idx_table_name_company_id on table_name(company_id);
create index idx_table_name_status on table_name(status);

-- enable rls
alter table table_name enable row level security;

-- updated_at trigger
create trigger update_table_name_updated_at before update on table_name
  for each row execute function update_updated_at_column();
```

### Adding Columns

```sql
-- add column with comment explaining the purpose
-- this column stores the user's preferred language for notifications
alter table users add column preferred_language text default 'en';
```

### Modifying Columns

```sql
-- ⚠️ this changes the data type - ensure compatibility with existing data
alter table users alter column age type integer using age::integer;
```

### Creating RLS Policies

```sql
-- policy for developers to view their own goals
create policy "developers_select_own_goals"
  on goals
  for select
  using (auth.uid() = user_id);

-- policy for team leads to view team goals
create policy "team_leads_select_team_goals"
  on goals
  for select
  using (
    exists (
      select 1 from user_profiles
      where id = auth.uid()
      and role = 'TEAM_LEAD'
    )
  );
```

### Using JSONB

For flexible data structures:

```sql
create table settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references user_profiles(id),
  preferences jsonb default '{}'::jsonb not null,
  created_at timestamp with time zone default now() not null
);

-- index for jsonb queries
create index idx_settings_preferences on settings using gin(preferences);
```

---

## Common Commands Quick Reference

```bash
# Start local Supabase
supabase start

# Stop local Supabase
supabase stop

# Create new migration
supabase migration new description_here

# Apply all migrations
supabase migration up

# Reset database and reapply migrations
supabase db reset

# View migration status
supabase migration list

# Push to production
supabase db push

# Pull schema from production
supabase db pull

# Generate TypeScript types from database
supabase gen types typescript --local > src/shared/types/database.types.ts
```

---

## Troubleshooting

### Migration Fails

1. Check the error message carefully
2. Verify SQL syntax
3. Ensure all referenced tables/columns exist
4. Check for foreign key constraint violations
5. Review migration order - dependencies must be created first

### Migration Out of Order

Migrations are applied in chronological order based on filename. If you need to insert a migration between existing ones, you'll need to:

1. Rename subsequent migrations
2. Or use a timestamp that fits in the sequence

### Conflicts in Team Development

When multiple developers create migrations:

1. Pull latest migrations before creating new ones
2. Use precise timestamps (include seconds)
3. Communicate with team about schema changes
4. Consider using feature branches for complex schema changes

---

## Additional Resources

- [Supabase CLI Documentation](https://supabase.com/docs/guides/cli)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)

---

**Last Updated:** 2026-02-28
