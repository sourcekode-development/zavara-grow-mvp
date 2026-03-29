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

**Effort & Analytics:**

- `effort` (Numeric, Nullable): Total effort required to complete the goal (e.g., story points).
- `effort_description` (Text, Nullable): Informational text for effort unit definition.
- `completed_effort` (Numeric): Total completed effort value.
- `last_effort_date` (Date, Nullable): Date when completed effort last increased for streak calculation.
- `current_streak` (Integer): Current consecutive days of recorded effort without missing.
- `longest_streak` (Integer): Best streak achieved.
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
- `session_effort` (Numeric, Default 1): Planned effort for this session; supports decimals.
- `completed_effort` (Numeric, Default 0): Actual effort completed in this session; supports decimals.
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
