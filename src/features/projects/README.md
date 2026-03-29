# Projects Feature

This feature manages the **client, project, and project-member allocation layer** for Zavara Grow.

It exists to answer an operational question that shows up across the rest of the platform:

- Which projects is a developer working on?
- Is that project external-client work or internal company work?
- Who owns delivery from the company side?
- Who should be treated as the primary reviewer for later KPI and survey workflows?

## Why this feature exists

Zavara Grow is not only an upskilling or KPI product. It also needs enough project context to make review workflows realistic.

Without a project-allocation layer, we can track goals and KPIs, but we still do not know:

- which client or internal product the work belongs to
- who the delivery-side reviewer is
- whether a developer changed projects over time

This feature solves that by introducing:

- `clients`
- `projects`
- `project_members`

## Core design rules

- A company can have many projects.
- A project may or may not belong to a client.
- Internal/product work is modeled as a project with `client_id = null`.
- A developer can be assigned to multiple projects.
- A project can have multiple members and multiple responsibility types.
- Project membership is **history-first**. Removing a member is a soft removal using `left_at` / `removed_at`, not a hard delete.

## Roles and access

This feature does **not** introduce a new global `user_profiles.role`.

Instead, responsibility is modeled at the project membership level using `project_role`:

- `DEVELOPER`
- `PROJECT_MANAGER`
- `DELIVERY_OWNER`

This is important because many real teams do not have a dedicated PM. In those cases, a Team Lead or senior developer can act as the `DELIVERY_OWNER`.

Current access rules:

- `COMPANY_ADMIN` and `TEAM_LEAD` can create and update clients, projects, and project memberships.
- `DEVELOPER` has read-only access.
- Developers can view only the projects they are assigned to currently or historically.

## UI overview

- `/projects`
  - `Projects` tab for project listing and management
  - `Clients` tab for admin/lead client management
- `/projects/:projectId`
  - project summary
  - active members
  - historical assignments

Reusable drawers:

- `ClientDrawer` for create/edit
- `ProjectDrawer` for create/edit
- `ProjectMemberDrawer` for assignment create/edit
- `ClientDetailDrawer` for read-only client detail and linked project visibility

## Architecture notes

This feature follows the repo's standard feature-based layering:

- `repository/`: raw Supabase queries only
- `apis/`: permission checks, guardrails, and business rules
- `store/`: Zustand state
- `hooks/`: feature-facing state access
- `components/`: tables, drawers, and UI blocks
- `pages/`: route-level pages

Some important business rules currently enforced in the API layer:

- only one active assignment per user per project
- only one active primary reviewer per project
- soft removal instead of delete for project membership
- developers can only access projects they are assigned to

## Relationship to future KPI/survey flows

This feature is intentionally designed to support future workflows without forcing backend redesign:

- KPI review ownership can use the project's active primary reviewer
- monthly manager surveys can target the delivery owner / primary reviewer
- developer surveys can be tied to current or recent project assignments
- historical reporting can still understand who worked on which project and when

In short: this feature gives the rest of the product the delivery context it was missing.
