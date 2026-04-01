### 1. The Core Hierarchy (Auth & Tenants)

User authentication is handled by their internal `auth.users` table. We will create a `user_profiles` table that links to it.

> **🔄 Goals Feature Redesigned (March 1, 2026):** The goals system has been redesigned to be **developer-centric** with a review workflow. Developers now create goals themselves, submit for review, and can duplicate successful goals from peers.

> **🆕 Up Skill Feature Added (March 18, 2026):** A new `up skill` engine now exists in parallel with goals. It is module-based, review-driven, and designed to better support flexible learning plans, on-the-fly updates, effort logging, and dashboard-heavy team visibility.

> **🆕 KPI Feature Rebuilt (March 31, 2026):** The KPI system has been rebuilt as a continuous, claim-based scoring engine using dimensions, metrics, active KPI snapshots, reviewer approvals, and impact metrics. See the KPI section below.

**Table: `companies`**

- `id` (UUID, Primary Key)
- `name` (String): Name of the service-based company.
- `created_at` (Timestamp)

We need a dedicated table to track pending invitations. This acts as a secure waiting room before a user is officially written into `auth.users` and `user_profiles`.

**Table: `company_invites`**

- `id` (UUID, Primary Key)
- `company_id` (UUID, Foreign Key): Links to `companies`.
- `email` (String): The email address receiving the invite. (Indexed for quick lookups).
- `role` (Enum): `COMPANY_ADMIN`, `TEAM_LEAD`, `DEVELOPER`. _(Crucial: This dictates their permissions upon joining)._
- `invited_by` (UUID, Foreign Key): Links to `user_profiles.id` (Tracks who sent it).
- `token` (String, Unique): A securely generated hash (e.g., a crypto random string) used in the magic link.
- `status` (Enum): `PENDING`, `ACCEPTED`, `EXPIRED`, `REVOKED`.
- `expires_at` (Timestamp): Usually set to 48 or 72 hours from creation.
- `created_at` (Timestamp)

**Table: `user_profiles`**

- `id` (UUID, Primary Key): This should match the Supabase `auth.users.id`.
- `company_id` (UUID, Foreign Key)
- `full_name` (String)
- `role` (Enum): `COMPANY_ADMIN`, `TEAM_LEAD`, `DEVELOPER`.
- `avatar_url` (String, Nullable)
- `seniority_level` (String, Nullable): e.g., "Junior", "Mid", "Senior", "Lead"
- `core_skills` (JSONB, Nullable): Array of skills e.g., `["React", "Node.js"]`
- `industry_domains` (JSONB, Nullable): Array of domains e.g., `["Healthcare", "FinTech"]`
- `certifications` (JSONB, Nullable): Array of earned certs/badges
- `allocation_status` (Enum, Nullable): `BILLABLE`, `BENCH`, `INTERNAL_PROJECT`
- `github_url` (String, Nullable)
- `linkedin_url` (String, Nullable)

**Table: `teams**`

- `id` (UUID, Primary Key)
- `company_id` (UUID, Foreign Key): Links to `companies`.
- `name` (String): e.g., "Frontend Squad".
- `created_by` (UUID, Foreign Key): Links to `user_profiles.id`. **(This tracks which Team Lead created it).**
- `created_at` (Timestamp)

**Table: `team_members**` _(New Junction Table)_

- `team_id` (UUID, Foreign Key)
- `user_id` (UUID, Foreign Key): The developer or lead in the team.
- `added_by` (UUID, Foreign Key, Nullable): The Lead or Admin who assigned them.
- `joined_at` (Timestamp)
- _(Primary Key is a composite of `team_id` + `user_id` to prevent duplicate memberships)._

### Project and Client Allocation Layer

This layer was added so Zavara Grow can represent both:

- service-based companies with external `clients -> projects`
- service-based companies with internal company-owned projects
- product companies that only manage internal projects

The core rule is: **every company has projects**, while `client_id` is optional and used only when a project belongs to an external client.

**Enum: `project_kind_enum`**

- `CLIENT_DELIVERY`
- `INTERNAL_PRODUCT`
- `INTERNAL_INITIATIVE`

**Enum: `project_status_enum`**

- `ACTIVE`
- `ON_HOLD`
- `COMPLETED`
- `ARCHIVED`

**Enum: `project_member_role_enum`**

- `DEVELOPER`
- `PROJECT_MANAGER`
- `DELIVERY_OWNER`

**Table: `clients`**

- `id` (UUID, Primary Key)
- `company_id` (UUID, Foreign Key): Links to `companies`
- `name` (String, Required)
- `description` (Text, Nullable)
- `created_by` (UUID, Foreign Key): Links to `user_profiles.id`
- `created_at` / `updated_at` (Timestamp)

**Important behavior**

- Clients are company-scoped.
- Client names are unique inside a company.
- Clients are optional at the project level. Internal work should not require a fake client row.

**Table: `projects`**

- `id` (UUID, Primary Key)
- `company_id` (UUID, Foreign Key): Links to `companies`
- `client_id` (UUID, Foreign Key, Nullable): Links to `clients`
- `name` (String, Required)
- `description` (Text, Nullable)
- `project_kind` (Enum): `CLIENT_DELIVERY`, `INTERNAL_PRODUCT`, `INTERNAL_INITIATIVE`
- `status` (Enum): `ACTIVE`, `ON_HOLD`, `COMPLETED`, `ARCHIVED`
- `created_by` (UUID, Foreign Key): Links to `user_profiles.id`
- `created_at` / `updated_at` (Timestamp)

**Important behavior**

- `client_id = NULL` means the project is internal/company-owned.
- Project names are unique inside a company.
- This table is intentionally generic so the same schema works for service companies and product companies.

**Table: `project_members`**

- `id` (UUID, Primary Key)
- `project_id` (UUID, Foreign Key): Links to `projects`
- `user_id` (UUID, Foreign Key): Links to `user_profiles`
- `project_role` (Enum): `DEVELOPER`, `PROJECT_MANAGER`, `DELIVERY_OWNER`
- `joined_at` (Date): When the person started on the project
- `left_at` (Date, Nullable): Leave/end date when they stop being active on the project
- `is_primary_reviewer` (Boolean): Whether this assignment is the primary review owner for KPI/survey workflows
- `assigned_by` (UUID, Foreign Key): Admin/Lead who created the assignment
- `removed_by` (UUID, Foreign Key, Nullable): Admin/Lead who ended the assignment
- `removed_at` (Timestamp, Nullable): When the assignment was soft removed
- `created_at` / `updated_at` (Timestamp)

**Important behavior**

- `project_members` is history-first. A developer can join the same project multiple times across different periods.
- Removing a member is a **soft delete**, not a hard delete. We preserve history because KPI reviews, surveys, and other downstream records may still depend on that assignment context.
- Only one active assignment per `(project_id, user_id)` is allowed at a time.
- Only one active `is_primary_reviewer = true` assignment is allowed per project at a time.
- `DELIVERY_OWNER` exists for lead-owned or senior-developer-owned delivery where no dedicated project manager exists.

### How the Access Logic Works in Your API (or Row Level Security)

With this schema, you can easily enforce the exact rules you laid out at the database query level:

- **COMPANY_ADMIN:**
- **View:** `SELECT * FROM teams WHERE company_id = {user.company_id}` (Can see all).
- **CRUD:** Full `INSERT`, `UPDATE`, `DELETE` rights on all teams within their company.

- **TEAM_LEAD:**
- **View:** `SELECT * FROM teams WHERE company_id = {user.company_id}` (Can see all teams).
- **Create:** Can `INSERT` new teams (their user ID gets stamped in `created_by`).
- **Update/Delete:** Allowed **ONLY IF** `teams.created_by == {user.id}`.

- **DEVELOPER:**
- **View:** Allowed **ONLY IF** their user ID exists in the `team_members` table for that specific team.
- _Query:_ `SELECT t.* FROM teams t JOIN team_members tm ON t.id = tm.team_id WHERE tm.user_id = {user.id}`
- **CRUD:** No permissions to create, update, or delete teams.

### Access Logic for Clients and Projects

- **COMPANY_ADMIN**
- Full create/update access on `clients`, `projects`, and `project_members` inside their company.
- Can view all company clients and projects.

- **TEAM_LEAD**
- Full create/update access on `clients`, `projects`, and `project_members` inside their company.
- Unlike the current `teams` behavior, this feature allows leads to manage all company project records, not only ones they created.

- **DEVELOPER**
- Read-only access.
- Can view only projects where they have an active or historical `project_members` row.
- Can open project details for those visible projects.
- Cannot create/edit clients, create/edit projects, or add/remove/edit project members.

---

### 2. KPI Performance Engine

This feature replaces the older appraisal-style KPI model with a continuous 1,000-point scoring system.

**Core Workflow**

- Admins and Team Leads create reusable KPI dimensions, metrics, and templates.
- Templates define dimension weights and standard metric point caps.
- When assigned to a developer, template data is copied into active KPI snapshot tables.
- Users submit claims with evidence against active KPI metrics.
- Assigned reviewers approve or reject claims and award partial or full points.
- Impact metrics allow out-of-band recognition without changing the 1,000-point baseline denominator.

**Status Enums**

- `scope_enum`: `PLATFORM`, `COMPANY`
- `kpi_status`: `ACTIVE`, `CLOSED`
- `claim_status`: `PENDING`, `APPROVED`, `REJECTED`
- `audit_action`: `SUBMITTED`, `APPROVED`, `REJECTED`, `COMMENTED`

#### 2.1 KPI Library

**Table: `dimensions`**

- `id` (UUID, Primary Key)
- `name` (String, Required)
- `description` (Text, Nullable)
- `scope` (Enum): `PLATFORM`, `COMPANY`
- `company_id` (UUID, Foreign Key, Nullable): Required when `scope = COMPANY`, null for `PLATFORM`
- `created_by` (UUID, Foreign Key, Nullable)
- `created_at` / `updated_at` (Timestamp)

**Important behavior**

- `PLATFORM` dimensions are shared library items.
- `COMPANY` dimensions belong to a single tenant company.
- In the current MVP UI, platform records are treated as read-only library records.

**Table: `metrics`**

- `id` (UUID, Primary Key)
- `dimension_id` (UUID, Foreign Key): Links to `dimensions`
- `name` (String, Required)
- `description` (Text, Nullable)
- `how_to_measure` (Text, Nullable)
- `scope` (Enum): `PLATFORM`, `COMPANY`
- `company_id` (UUID, Foreign Key, Nullable): Required when `scope = COMPANY`, null for `PLATFORM`
- `created_by` (UUID, Foreign Key, Nullable)
- `created_at` / `updated_at` (Timestamp)

**Important behavior**

- Metrics always belong to a dimension.
- The library is reusable across templates and impact-recognition flows.

**Table: `kpi_templates`**

- `id` (UUID, Primary Key)
- `name` (String, Required)
- `description` (Text, Nullable)
- `scope` (Enum): `PLATFORM`, `COMPANY`
- `company_id` (UUID, Foreign Key, Nullable)
- `created_by` (UUID, Foreign Key)
- `created_at` / `updated_at` (Timestamp)

**Table: `template_dimensions`**

- `template_id` (UUID, Foreign Key)
- `dimension_id` (UUID, Foreign Key)
- `weight_percentage` (Numeric)
- `created_at` (Timestamp)

**Table: `template_metrics`**

- `template_id` (UUID, Foreign Key)
- `metric_id` (UUID, Foreign Key)
- `max_points` (Integer)
- `created_at` (Timestamp)

**Important behavior**

- Template dimensions must total exactly `100%`.
- Template standard metrics must total exactly `1000` points.
- These validations are currently enforced in application code for the MVP.

#### 2.2 Active KPI Snapshots

**Table: `assigned_kpis`**

- `id` (UUID, Primary Key)
- `developer_id` (UUID, Foreign Key): Links to `user_profiles`
- `template_id` (UUID, Foreign Key, Nullable): Source template for traceability
- `status` (Enum): `ACTIVE`, `CLOSED`
- `start_date` (Date)
- `end_date` (Date)
- `total_target_points` (Integer, Default `1000`)
- `created_by` (UUID, Foreign Key): Admin/Lead who assigned the KPI
- `created_at` / `updated_at` (Timestamp)

**Important behavior**

- Only one `ACTIVE` KPI per developer is allowed at a time.
- This record is the container for the developer's scoring period.

**Table: `kpi_reviewers`**

- `kpi_id` (UUID, Foreign Key)
- `reviewer_id` (UUID, Foreign Key)
- `created_at` (Timestamp)

**Important behavior**

- At least one reviewer is required during assignment.
- Reviewer choices are restricted to users from the assigning actor's company.
- Only users listed here can approve or reject claims.

**Table: `kpi_dimensions`**

- `kpi_id` (UUID, Foreign Key)
- `dimension_id` (UUID, Foreign Key)
- `weight_percentage` (Numeric)
- `created_at` (Timestamp)

**Table: `kpi_metrics`**

- `id` (UUID, Primary Key)
- `kpi_id` (UUID, Foreign Key)
- `metric_id` (UUID, Foreign Key): Links to reusable library metric
- `max_points` (Integer)
- `is_impact_metric` (Boolean)
- `created_at` / `updated_at` (Timestamp)

**Important behavior**

- When a KPI is assigned, all template dimensions and standard metrics are copied into these snapshot tables.
- Later edits to the source template do not affect active KPIs.
- Standard KPI metrics across a KPI must total exactly `assigned_kpis.total_target_points` in application logic.
- Impact metrics are separate bonus metrics and do not count toward the baseline denominator.

#### 2.3 Claims and Review Audit

**Table: `claims`**

- `id` (UUID, Primary Key)
- `kpi_id` (UUID, Foreign Key)
- `metric_id` (UUID, Foreign Key): References `kpi_metrics.id`
- `submitter_id` (UUID, Foreign Key)
- `status` (Enum): `PENDING`, `APPROVED`, `REJECTED`
- `evidence_text` (Text, Required)
- `evidence_attachments` (JSONB, Nullable): Reserved for future attachment metadata
- `awarded_points` (Integer, Nullable)
- `created_at` / `updated_at` (Timestamp)

**Table: `claim_audit_logs`**

- `id` (UUID, Primary Key)
- `claim_id` (UUID, Foreign Key)
- `actor_id` (UUID, Foreign Key)
- `action` (Enum): `SUBMITTED`, `APPROVED`, `REJECTED`, `COMMENTED`
- `comment_text` (Text, Nullable)
- `created_at` (Timestamp)

**Important behavior**

- Anyone in the flow can submit a claim with evidence for an active KPI.
- Reviewers can approve a claim for partial points, not only full points.
- Remaining metric points are derived from:
  - `kpi_metrics.max_points - sum(awarded_points of approved claims for that kpi_metric)`
- Multiple approved claims can accumulate against the same metric until the metric cap is exhausted.
- Impact metric claims follow the same partial-award logic but contribute bonus points only.

#### 2.4 Access and Workflow Notes

- `COMPANY_ADMIN` and `TEAM_LEAD` create/update company-scoped dimensions, metrics, templates, and KPI assignments.
- `DEVELOPER` and other company users can submit claims, but they cannot assign KPI templates or manage the library.
- `PLATFORM` library items are visible in the MVP but not editable through the current UI.
- The current MVP intentionally keeps the heavier assignment/review workflow logic in application code rather than DB functions.

---

### 3. Up Skill Programs (Parallel Learning System)

This feature runs alongside `goals` for now and is intended to become the more flexible long-term upskilling engine.

**Core Workflow**

- Developer creates an `upskill_program` from scratch or from a reusable template.
- Program is broken into `upskill_program_modules`.
- Developer submits the program to one or more reviewers.
- The first reviewer approval marks the whole program `APPROVED`.
- Developer starts the program, logs effort against modules over time, and manually marks modules `COMPLETED` or `WONT_DO`.
- Team dashboards aggregate this program activity to show progress, streaks, effort usage, and review readiness.

**Status Enums**

- `upskill_program_status`: `DRAFT`, `PENDING_REVIEW`, `APPROVED`, `IN_PROGRESS`, `COMPLETED`
- `upskill_module_status`: `TODO`, `IN_PROGRESS`, `COMPLETED`, `WONT_DO`
- `upskill_review_decision`: `PENDING`, `APPROVED`, `CHANGES_REQUESTED`, `AUTO_CLOSED`

#### 3.1 Templates

**Table: `upskill_program_templates`**

- `id` (UUID, Primary Key)
- `company_id` (UUID, Foreign Key): Company-scoped reusable template
- `created_by` (UUID, Foreign Key): Creator from `user_profiles`
- `title` (String, Required)
- `description` (Text, Nullable)
- `total_effort` (Numeric, Nullable): Estimated total effort for the template
- `is_active` (Boolean): Whether the template is available in the library
- `is_published` (Boolean): Whether it should be visible as a reusable company default
- `created_at` / `updated_at` (Timestamp)

**Table: `upskill_template_modules`**

- `id` (UUID, Primary Key)
- `template_id` (UUID, Foreign Key): Links to `upskill_program_templates`
- `order_index` (Integer): Module display order
- `title` (String, Required)
- `description` (Text, Nullable)
- `effort` (Numeric, Nullable): Estimated module effort
- `content` (JSONB, Nullable): Rich content payload for notes/links/resources
- `content_plain_text` (Text, Nullable): Searchable/plain-text version of content
- `created_at` / `updated_at` (Timestamp)

#### 3.2 Program Execution

**Table: `upskill_programs`**

- `id` (UUID, Primary Key)
- `company_id` (UUID, Foreign Key)
- `created_by` (UUID, Foreign Key): Developer who created the program
- `user_id` (UUID, Foreign Key): Developer executing the program
- `template_id` (UUID, Foreign Key, Nullable): Source template if cloned
- `title` (String, Required)
- `description` (Text, Nullable)
- `total_effort` (Numeric, Nullable): Estimated total effort for the full program
- `status` (Enum): `DRAFT`, `PENDING_REVIEW`, `APPROVED`, `IN_PROGRESS`, `COMPLETED`
- `review_round` (Integer): Current submission round number
- `approved_by` (UUID, Foreign Key, Nullable): First reviewer who approved
- `approved_at` (Timestamp, Nullable)
- `started_at` (Timestamp, Nullable)
- `completed_at` (Timestamp, Nullable)
- `current_streak` (Integer): Current program streak
- `longest_streak` (Integer): Best program streak achieved
- `last_activity_date` (Date, Nullable): Last day with logged effort
- `total_modules` (Integer): Denormalized module count for dashboard reads
- `completed_modules` (Integer): Denormalized completed/wont-do module count
- `created_at` / `updated_at` (Timestamp)

**Important behavior**

- `total_effort` is an estimate and can be updated while the program is evolving.
- We intentionally do **not** store `completed_effort` on the program record. Actual delivered effort is derived from `upskill_module_effort_logs`.
- Program completion is module-driven: when all modules are `COMPLETED` or `WONT_DO`, the program can move to `COMPLETED`.

**Table: `upskill_program_modules`**

- `id` (UUID, Primary Key)
- `program_id` (UUID, Foreign Key)
- `template_module_id` (UUID, Foreign Key, Nullable): Source template module if cloned
- `order_index` (Integer): Module order inside the program
- `title` (String, Required)
- `description` (Text, Nullable)
- `effort` (Numeric, Nullable): Estimated effort for this module
- `content` (JSONB, Nullable): Rich content payload
- `content_plain_text` (Text, Nullable): Searchable/plain-text version
- `status` (Enum): `TODO`, `IN_PROGRESS`, `COMPLETED`, `WONT_DO`
- `created_at` / `updated_at` (Timestamp)

**Important behavior**

- Modules are intentionally flexible and can be added or edited even after approval and during execution.
- Module completion is manual-first; logged effort informs dashboards and review context but does not automatically force a module to complete.

#### 3.3 Review Workflow

**Table: `upskill_program_reviews`**

- `id` (UUID, Primary Key)
- `program_id` (UUID, Foreign Key)
- `review_round` (Integer): Which submission round the decision belongs to
- `reviewer_id` (UUID, Foreign Key)
- `decision` (Enum): `PENDING`, `APPROVED`, `CHANGES_REQUESTED`, `AUTO_CLOSED`
- `comments` (Text, Nullable)
- `responded_at` (Timestamp, Nullable)
- `created_at` / `updated_at` (Timestamp)

**Important behavior**

- One row is created per reviewer for a submission round.
- The first reviewer approval is enough to approve the whole program.
- Remaining pending reviewer rows are marked `AUTO_CLOSED`.
- If a reviewer requests changes before anyone approves, the program returns to `DRAFT`.

#### 3.4 Effort Logging and Analytics

**Table: `upskill_module_effort_logs`**

- `id` (UUID, Primary Key)
- `program_id` (UUID, Foreign Key)
- `module_id` (UUID, Foreign Key)
- `user_id` (UUID, Foreign Key)
- `effort_used` (Numeric, Required): Actual effort delivered in that log entry
- `notes` (Text, Nullable)
- `logged_on` (Date): Business date for the effort log
- `created_at` (Timestamp)

**Table: `developer_upskill_stats`**

- `user_id` (UUID, Primary Key, Foreign Key)
- `company_id` (UUID, Foreign Key)
- `current_streak` (Integer): Overall up skill streak across programs
- `longest_streak` (Integer): Best overall up skill streak
- `last_activity_date` (Date, Nullable)
- `total_programs_started` (Integer)
- `total_programs_completed` (Integer)
- `created_at` / `updated_at` (Timestamp)

**Important behavior**

- `upskill_module_effort_logs` is the source of truth for actual delivered effort.
- Program dashboards aggregate logs by program and module.
- Team dashboards aggregate logs by developer and team membership.
- The up skill streak logic supports a configurable grace period in application code. Current behavior keeps the streak alive through 3 inactive days and breaks it on day 4.

---
