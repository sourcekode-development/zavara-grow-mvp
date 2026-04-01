# KPI Feature

## Overview

The KPI feature is a continuous, evidence-based performance engine for Zavara Grow. It replaces traditional appraisal-style KPI forms with a 1,000-point baseline model built from:

- reusable `dimensions`
- reusable `metrics`
- reusable `kpi_templates`
- assigned KPI snapshots per developer
- claim submission and reviewer approval workflows
- impact metrics for exceptional work outside the standard KPI scope

This feature is intentionally designed around the same blueprint-vs-snapshot principle used elsewhere in the product:

- library entities are reusable and editable
- active KPI assignments are copied snapshots
- later template edits must not rewrite active KPI history

## Main Concepts

### 1. Dimensions

Dimensions are the top-level scoring categories, such as:

- Technical Excellence
- Delivery Ownership
- Collaboration
- Quality and Reliability

Each assigned KPI must total exactly `100%` across its dimensions.

### 2. Metrics

Metrics are the measurable scoring items inside dimensions, such as:

- Code Review Quality
- Incident Response Ownership
- Sprint Predictability
- Documentation Contribution

Each standard metric in a KPI contributes to the `1000` baseline point system.

### 3. KPI Templates

Templates are reusable blueprints made from selected dimensions and metrics.

Rules:

- template dimensions must total exactly `100`
- template standard metrics must total exactly `1000`
- templates can be company-scoped or platform-scoped in the data model
- the current MVP UI treats platform items as read-only library records

### 4. Assigned KPIs

When a KPI is assigned to a developer:

- the source template remains only as a reference
- dimension weights are copied into `kpi_dimensions`
- metric point caps are copied into `kpi_metrics`
- reviewers are attached through `kpi_reviewers`

Rules:

- a developer can have only one `ACTIVE` KPI at a time
- assignment requires `start_date`, `end_date`, and at least one reviewer
- reviewer options are limited to users in the same company as the assigning actor

### 5. Claims

Claims are the evidence submissions against KPI metrics.

A claim includes:

- the active KPI
- the target KPI metric
- the submitter
- free-text evidence
- future-ready attachment metadata
- review outcome and awarded points

Anyone allowed in the company workflow can submit claims. Only assigned reviewers can approve or reject them.

### 6. Flexible Partial Scoring

This KPI system supports partial approvals.

Example:

- a metric has `200` max points
- reviewer approves first claim for `100`
- remaining points become `100`
- later claims on the same metric can only use up to the remaining `100`

Remaining points are derived in application code as:

- `remaining = metric.max_points - approved_points_so_far`

We do not store a mutable `remaining_points` column.

### 7. Impact Metrics

Impact metrics are bonus-recognition metrics for work that does not fit the assigned KPI's standard metric list.

Flow:

- user opens `Add Impact Metric`
- chooses an available platform/company metric not already attached to the KPI
- system adds it into `kpi_metrics` with `is_impact_metric = true`
- system creates the claim against that new KPI metric

Rules:

- impact points are bonus points
- they do not change the KPI's baseline denominator
- a developer can display a score such as `1050 / 1000`

## Feature Structure

This feature follows the repo's domain-driven module rule:

```text
src/features/kpis/
├── apis/
├── components/
├── hooks/
├── pages/
├── repository/
├── store/
└── types/
```

### Layer Responsibilities

#### `repository/`

The repository layer is the only place with direct Supabase access.

It handles:

- library CRUD
- template mapping reads/writes
- assigned KPI reads/writes
- claims and audit log reads/writes
- reviewer lookups

#### `apis/`

The API layer contains MVP business rules.

It validates:

- manager-only company library changes
- template totals
- reviewer company membership
- one-active-KPI-per-developer behavior
- impact metric availability
- partial-approval remaining-point checks

This is intentional for the MVP. We deliberately kept most workflow logic in TypeScript instead of DB-level functions so the team can iterate faster.

#### `hooks/`

Hooks provide page-facing data loading and action wrappers.

Use them from pages and complex components instead of calling the repository directly.

## Current UI Surface

### Routes

- `/kpis/my`
- `/kpis/my/:kpiId`
- `/kpis/templates`
- `/kpis/dimensions`
- `/kpis/metrics`
- `/kpis/claims`
- `/kpis/assigned/:kpiId`

### Main Screens

- `Your KPI`: current user's KPI list and detail view
- `KPI Templates`: create, edit, inspect templates
- `Dimensions`: company KPI dimension library
- `Metrics`: company KPI metric library
- `Claims`: split between submitted claims and items needing review
- assigned KPI detail page: dedicated full-page KPI snapshot view

### Template Builder UX

The template drawer uses a nested authoring flow:

- choose dimensions first
- define weight for each selected dimension
- add metrics inside each dimension card
- only metrics from that dimension appear in the selector
- live feedback shows:
  - total weight used and remaining
  - total points used and remaining
  - per-dimension metric totals

## Important MVP Decisions

- Platform library items exist in the schema but are read-only in the current UI.
- Most workflow validation is handled in application code, not DB functions.
- No RLS policies are included yet.
- No file upload UI exists yet for claim attachments.
- Impact metrics currently use a default bonus cap in code because library metrics do not yet store their own default point budget.

## Data Model Summary

Core tables used by this feature:

- `dimensions`
- `metrics`
- `kpi_templates`
- `template_dimensions`
- `template_metrics`
- `assigned_kpis`
- `kpi_reviewers`
- `kpi_dimensions`
- `kpi_metrics`
- `claims`
- `claim_audit_logs`

See:

- [database schema doc](/Users/surya/Documents/SOURCE-KODE/projects/zavara-grow-mvp-v1/zavara-grow-mvp-V1/docs/database-schema.md)
- [KPI migration](/Users/surya/Documents/SOURCE-KODE/projects/zavara-grow-mvp-v1/zavara-grow-mvp-V1/supabase/migrations/20260331121007_add_new_kpi_feature.sql)

## Future Improvements

- move selected business rules into transactional backend endpoints when concurrency becomes more important
- add richer impact metric configuration instead of using a default bonus cap
- add attachment upload/storage support for claim evidence
- add more dashboard analytics and historical KPI reporting
- add automated tests for assignment, claim approval, and point exhaustion flows
