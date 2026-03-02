### 1. The Core Hierarchy (Auth & Tenants)

User authentication is handled by their internal `auth.users` table. We will create a `user_profiles` table that links to it.

> **🔄 Goals Feature Redesigned (March 1, 2026):** The goals system has been redesigned to be **developer-centric** with a review workflow. Developers now create goals themselves, submit for review, and can duplicate successful goals from peers. See sections 2-7 for details.

**Table: `companies**`

- `id` (UUID, Primary Key)
- `name` (String): Name of the service-based company.
- `created_at` (Timestamp)

We need a dedicated table to track pending invitations. This acts as a secure waiting room before a user is officially written into `auth.users` and `user_profiles`.

**Table: `company_invites**`

- `id` (UUID, Primary Key)
- `company_id` (UUID, Foreign Key): Links to `companies`.
- `email` (String): The email address receiving the invite. (Indexed for quick lookups).
- `role` (Enum): `COMPANY_ADMIN`, `TEAM_LEAD`, `DEVELOPER`. _(Crucial: This dictates their permissions upon joining)._
- `invited_by` (UUID, Foreign Key): Links to `user_profiles.id` (Tracks who sent it).
- `token` (String, Unique): A securely generated hash (e.g., a crypto random string) used in the magic link.
- `status` (Enum): `PENDING`, `ACCEPTED`, `EXPIRED`, `REVOKED`.
- `expires_at` (Timestamp): Usually set to 48 or 72 hours from creation.
- `created_at` (Timestamp)

**Table: `user_profiles**`

- `id` (UUID, Primary Key): This should match the Supabase `auth.users.id`.
- `company_id` (UUID, Foreign Key)
- `full_name` (String)
- `role` (Enum): `COMPANY_ADMIN`, `TEAM_LEAD`, `DEVELOPER`.

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

---

## GOALS WORKFLOW (Developer-Centric)

**Phase 1: Creation (DRAFT)**

- Developer creates goal with title (only required field)
- Adds milestones, configures frequency (DAILY/WEEKDAYS/WEEKENDS/CUSTOM)
- Can manually create cadence_sessions or let system auto-generate later
- Adds checkpoints if needed
- Submits for review → Status: PENDING_REVIEW

**Phase 2: Review**

- TEAM_LEAD/COMPANY_ADMIN reviews and approves/modifies/requests changes
- All actions logged in `goal_reviews` for audit trail
- If approved → Status: APPROVED

**Phase 3: Execution (IN_PROGRESS)**

- Developer starts goal, system generates sessions if needed
- Updates session status: TO_DO → IN_PROGRESS → COMPLETED
- System tracks streaks automatically
- When checkpoint reached:
  - Status: READY_FOR_REVIEW
  - Reviewer submits assessment (pass/fail, feedback, score)
  - If failed: action_items guide remediation
- Completes all sessions → Status: COMPLETED

**Phase 4: Sharing**

- Successful goals can be made public
- Other developers duplicate and customize for their needs

### 2. The Blueprint (Templates) - OPTIONAL

**Table: `goal_templates**` _(Optional for backward compatibility)_

- `id` (UUID, Primary Key)
- `company_id` (UUID, Foreign Key, Nullable): If this is NULL, it means it's a **Global Zavara Template** available to everyone. If it has an ID, it's private to that specific company.
- `title` (String): e.g., "AWS Cloud Practitioner Mastery"
- `description` (Text, Nullable)
- `created_by` (UUID, Foreign Key): Admin/Lead who created this template
- `is_active` (Boolean): Whether this template is currently available

---

### 3. The Execution Engine (Goals & Milestones) - REDESIGNED

**Table: `goals**` _(Developer-Centric with Review Workflow)_

**Core Fields:**

- `id` (UUID, Primary Key)
- `created_by` (UUID, Foreign Key): **The developer who created this goal**
- `user_id` (UUID, Foreign Key): The developer assigned to execute this goal
- `assigned_by` (UUID, Foreign Key, Nullable): Admin/Lead who assigned (null if self-created)
- `duplicated_from` (UUID, Foreign Key, Nullable): Reference to original goal if duplicated
- `template_id` (UUID, Foreign Key, Nullable): If generated from a template

**Goal Details:**

- `title` (String, Required): Only required field for DRAFT creation
- `description` (Text, Nullable): Can add later
- `total_duration_days` (Integer, Nullable): Calculated from milestones
- `status` (Enum): `DRAFT`, `PENDING_REVIEW`, `CHANGES_REQUESTED`, `APPROVED`, `IN_PROGRESS`, `ON_HOLD`, `BLOCKED`, `COMPLETED`, `ABANDONED`
- `start_date` (Date, Nullable): Set when goal starts
- `target_end_date` (Date, Nullable): Calculated when approved
- `actual_end_date` (Date, Nullable): When actually completed

**Frequency Configuration:**

- `frequency_type` (Enum, Nullable): `DAILY`, `WEEKDAYS`, `WEEKENDS`, `CUSTOM`
- `frequency_config` (JSONB, Nullable): Schedule details
  ```json
  {
    "days": [1, 2, 3, 4, 5],
    "duration_minutes": 60,
    "time": "18:00" // optional
  }
  ```

**Analytics:**

- `current_streak` (Integer): Current consecutive days without missing
- `longest_streak` (Integer): Best streak achieved
- `total_sessions` (Integer): Total cadence sessions
- `completed_sessions` (Integer): Completed sessions count

**Review Metadata:**

- `reviewed_by` (UUID, Foreign Key, Nullable): Who reviewed the goal
- `reviewed_at` (Timestamp, Nullable): When reviewed
- `review_comments` (Text, Nullable): Review feedback

**Sharing:**

- `is_public` (Boolean): Can other developers duplicate this?
- `duplication_count` (Integer): Times this goal was duplicated

**Table: `milestones**` _(Phases within a goal)_

- `id` (UUID, Primary Key)
- `goal_id` (UUID, Foreign Key)
- `title` (String, Required)
- `description` (Text, Nullable): Can add details later
- `order_index` (Integer): 1, 2, 3 (chronological order)
- `duration_days` (Integer, Nullable): Estimated days for this phase
- `estimated_sessions` (Integer, Nullable): Calculated sessions
- `status` (Enum): `PENDING`, `ACTIVE`, `COMPLETED`
- `started_at` (Timestamp, Nullable)
- `completed_at` (Timestamp, Nullable)

---

### 4. Cadence Sessions (Created Before OR After Goal Approval)

_Developers can manually create sessions during DRAFT, or let system auto-generate after approval._

**Table: `cadence_sessions**`

- `id` (UUID, Primary Key)
- `goal_id` (UUID, Foreign Key)
- `milestone_id` (UUID, Foreign Key, Nullable): Can be standalone
- `session_index` (Integer, Nullable): Auto-assigned if not provided
- `title` (String, Nullable): Custom title by developer
- `description` (Text, Nullable): What they plan to do
- `scheduled_date` (Date, Nullable): Can schedule later
- `duration_minutes` (Integer, Default 60): Session duration
- `status` (Enum): `TO_DO`, `IN_PROGRESS`, `COMPLETED`, `DUE`, `MISSED`, `SKIPPED`
- `summary_text` (Text, Nullable): What they actually accomplished
- `skip_reason` (Text, Nullable): If status is SKIPPED
- `started_at` (Timestamp, Nullable)
- `completed_at` (Timestamp, Nullable)
- `calendar_event_id` (String, Nullable): For calendar integration
- `is_auto_generated` (Boolean): System vs. manual creation

---

### 5. Quality Control (Checkpoints & Assessments) - ENHANCED

**Table: `checkpoints**` _(Validation points with review workflow)_

- `id` (UUID, Primary Key)
- `goal_id` (UUID, Foreign Key)
- `milestone_id` (UUID, Foreign Key, Nullable)
- `title` (String, Required)
- `description` (Text, Nullable)
- `trigger_type` (String, Nullable): `AFTER_DAYS`, `AFTER_MILESTONE`, `MANUAL`
- `trigger_config` (JSONB, Nullable): Trigger configuration
  ```json
  {
    "after_days": 15,
    "from_start": true
  }
  ```
- `scheduled_date` (Date, Nullable): Can be null for milestone-triggered
- `type` (Enum): `MANUAL_REVIEW`, `AI_INTERVIEW`
- `status` (Enum): `PENDING`, `READY_FOR_REVIEW`, `REVIEW_IN_PROGRESS`, `NEEDS_ATTENTION`, `PASSED`, `SKIPPED`
- `assigned_reviewer_id` (UUID, Foreign Key, Nullable): Assigned reviewer
- `review_started_at` (Timestamp, Nullable)

**Table: `assessments**` _(Checkpoint Results & Reviews)_

**This is where COMPANY_ADMIN/TEAM_LEAD submit their checkpoint reviews.**

- `id` (UUID, Primary Key)
- `checkpoint_id` (UUID, Foreign Key)
- `reviewer_id` (UUID, Foreign Key, Nullable): Who reviewed (null = AI)
- `passed` (Boolean, Required): **Did developer pass?**
- `score` (Integer, Nullable): Optional score (0-100)
- `feedback_text` (Text, Nullable): Overall feedback
- `strengths` (Text, Nullable): What went well
- `areas_for_improvement` (Text, Nullable): What needs work
- `action_items` (JSONB, Nullable): Micro-goals if failed
  ```json
  [
    {
      "task": "Re-do AWS IAM module",
      "duration_minutes": 120,
      "priority": "HIGH",
      "resources": ["link1", "link2"]
    }
  ]
  ```
- `attachments` (JSONB, Nullable): Supporting documents
  ```json
  [
    {
      "type": "video",
      "url": "s3://...",
      "name": "Mock interview recording"
    }
  ]
  ```
- `review_duration_minutes` (Integer, Nullable): Review duration
- `reviewed_at` (Timestamp): When assessment was submitted

---

### 6. Goal Review Audit Trail (NEW)

**Table: `goal_reviews**` _(Tracks all review actions)_

- `id` (UUID, Primary Key)
- `goal_id` (UUID, Foreign Key)
- `reviewer_id` (UUID, Foreign Key): Who performed the review
- `action` (String): `REQUESTED_CHANGES`, `APPROVED`, `MODIFIED`, `REJECTED`
- `comments` (Text, Nullable): Review feedback
- `changes_made` (JSONB, Nullable): What was modified
  ```json
  {
    "milestones": {
      "added": [...],
      "removed": [...],
      "modified": [...]
    },
    "frequency": {
      "old": {...},
      "new": {...}
    }
  }
  ```
- `previous_status` (Enum): Status before review
- `new_status` (Enum): Status after review
- `created_at` (Timestamp): When review occurred

---

### 7. Streak Analytics (NEW)

**Table: `goal_streak_history**` _(Daily snapshots for leaderboards)_

- `id` (UUID, Primary Key)
- `goal_id` (UUID, Foreign Key)
- `user_id` (UUID, Foreign Key)
- `date` (Date): Snapshot date
- `streak_count` (Integer): Streak at this date
- `sessions_completed_today` (Integer): Sessions completed on this date
- `created_at` (Timestamp)

**Unique constraint:** `(goal_id, date)` - One record per goal per day

---

### 8. The KPI Configuration (The Library)

These tables define the "Global" and "Company-specific" rules for performance tracking.

**Table: `kpi_categories**`

- `id` (UUID, Primary Key)
- `company_id` (UUID, Foreign Key, Nullable): NULL means it's a Zavara default.
- `name` (String): e.g., "Technical Excellence", "Soft Skills".
- `description` (Text): What this category measures.

**Table: `kpi_templates**`

- `id` (UUID, Primary Key)
- `company_id` (UUID, Foreign Key, Nullable): NULL means global Zavara template.
- `title` (String): e.g., "Senior MERN Developer - Q3".
- `cycle_type` (Enum): `QUARTERLY`, `HALF_YEARLY`, `ANNUAL`, `CUSTOM`.
- `total_target_points` (Integer): Always 1,000 for standard weighting.

**Table: `kpi_template_metrics**`

- `id` (UUID, Primary Key)
- `template_id` (UUID, Foreign Key): Links to `kpi_templates`.
- `category_id` (UUID, Foreign Key): Links to `kpi_categories`.
- `name` (String): e.g., "PR Review Quality".
- `target_points` (Integer): The "weight" of this item (e.g., 200 out of 1,000).
- `description` (Text): Guidelines on how to earn these points.

---

### 9. The KPI Execution (The Developer Snapshot)

When a Tech Lead assigns a KPI, the data is "snapshotted" so it remains unchanged even if the template is edited later.

**Table: `developer_kpis**`

- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key): The developer.
- `assigned_by` (UUID, Foreign Key): The Tech Lead.
- `title` (String): Copied from template.
- `status` (Enum): `ACTIVE`, `COMPLETED`, `ARCHIVED`.
- `start_date` / `end_date` (Date): The performance cycle window.

**Table: `developer_kpi_metrics**`

- `id` (UUID, Primary Key)
- `developer_kpi_id` (UUID, Foreign Key): Links to `developer_kpis`.
- `category_id` (UUID, Foreign Key): Links to `kpi_categories`.
- `name` (String): Copied from template.
- `target_points` (Integer): e.g., 300.
- `accumulated_points` (Integer): Starts at 0, updated as claims are approved.

---

### 10. The Evidence Ledger & Final Review

Developers submit daily "proof of work" which Leads verify, building up points over time.

**Table: `kpi_metric_submissions**`

- `id` (UUID, Primary Key)
- `metric_id` (UUID, Foreign Key): Links to `developer_kpi_metrics`.
- `developer_id` (UUID, Foreign Key): The developer submitting the claim.
- `description` (Text): e.g., "I mentored Sujai on WebRTC for 2 hours."
- `attachments` (JSONB): Array of storage URLs for screenshots/proof.
- `status` (Enum): `PENDING`, `APPROVED`, `REJECTED`, `CHANGES_REQUESTED`.
- `points_awarded` (Integer): Assigned by Lead upon approval.
- `reviewer_id` (UUID, Foreign Key): The Lead who reviewed.
- `reviewer_comments` (Text): Feedback on this specific submission.
- `created_at` / `reviewed_at` (Timestamp)

**Table: `kpi_reviews**`

- `id` (UUID, Primary Key)
- `developer_kpi_id` (UUID, Foreign Key): Links to `developer_kpis`.
- `final_score_percentage` (Numeric): `(Total Accumulated Points / 1000) × 100`.
- `summary_feedback` (Text): Overall cycle feedback.
- `status` (Enum): `DRAFT`, `FINALIZED`.

### The Workflow

1. Developer submits evidence → `kpi_metric_submissions` row created with `PENDING` status.
2. Lead reviews → Updates status to `APPROVED` and assigns `points_awarded`.
3. System auto-increments `accumulated_points` in `developer_kpi_metrics`.
4. At cycle end → Lead finalizes review, system calculates `final_score_percentage`.
