# Goals Feature Redesign Plan

_Created: March 1, 2026_

## 1. Current System Analysis

### Current Workflow:

1. **COMPANY_ADMIN/TEAM_LEAD** creates `goal_templates`
2. **COMPANY_ADMIN/TEAM_LEAD** assigns templates as `goals` to developers
3. Developer executes the assigned goal

### Problems Identified:

- ❌ **Not scalable**: Admins/Leads can't create templates for every possible upskilling path
- ❌ **Low developer ownership**: Developers are passive recipients, not active participants
- ❌ **Rigid structure**: No review/approval workflow for goal modifications
- ❌ **Limited flexibility**: Fixed cadence structure, no support for diverse schedules
- ❌ **Poor tracking**: No streak tracking, progress visualization, or peer pressure mechanics
- ❌ **No collaboration**: Developers can't share/duplicate successful goals

---

## 2. New System Design

### New Workflow (Developer-Centric):

```
┌─────────────────────────────────────────────────────────────────────┐
│                    GOAL LIFECYCLE WORKFLOW                          │
└─────────────────────────────────────────────────────────────────────┘

1. DEVELOPER creates goal → Status: DRAFT
   ├─ Defines title, description (description optional)
   ├─ Creates milestones with titles and durations
   ├─ Configures frequency (weekdays/daily/weekends/custom)
   ├─ Optionally adds checkpoints
   └─ Can manually create/customize cadence_sessions OR let system auto-generate

2. DEVELOPER submits for review → Status: PENDING_REVIEW
   └─ Notification sent to TEAM_LEAD & COMPANY_ADMIN

3. TEAM_LEAD/COMPANY_ADMIN reviews
   ├─ Option A: Approve → Status: APPROVED
   ├─ Option B: Request changes → Status: CHANGES_REQUESTED (back to DRAFT)
   └─ Option C: Modify & Approve (edit milestones, cadence, checkpoints)

4. DEVELOPER starts goal → Status: IN_PROGRESS
   └─ If cadence_sessions not created, system auto-generates based on:
      - Start date
      - Frequency configuration
      - Milestone durations
   └─ If already created during DRAFT, uses existing sessions

5. During execution:
   ├─ Developer updates cadence_session status (TO_DO → IN_PROGRESS → COMPLETED)
   ├─ System tracks streaks
   ├─ Checkpoints trigger for validations
   └─ Progress visible to team (peer pressure)

6. Goal completion → Status: COMPLETED
   └─ Goal becomes available for duplication by other developers

┌─────────────────────────────────────────────────────────────────────┐
│                    GOAL DUPLICATION WORKFLOW                        │
└─────────────────────────────────────────────────────────────────────┘

1. DEVELOPER A completes goal successfully
2. DEVELOPER B sees goal in "Browse Goals" library
3. DEVELOPER B duplicates goal → New goal created with:
   ├─ Same title, description, milestones
   ├─ Same checkpoint configuration
   ├─ Reference to original goal (duplicated_from)
   └─ Status: DRAFT (B can customize before submitting)
4. DEVELOPER B customizes (optional) and submits for review
```

### Example Scenario: "AWS Certified Solutions Architect"

```yaml
Goal:
  title: "Become AWS Certified Solutions Architect"
  description: "Complete Udemy course + exam preparation"
  total_duration: 45 days
  frequency_type: "WEEKDAYS"  # Monday-Friday
  frequency_config:
    days: [1, 2, 3, 4, 5]  # Mon-Fri
    duration_minutes: 60

Milestones:
  - milestone_1:
      title: "Complete Udemy Course"
      order_index: 1
      duration_days: 30
      description: "30 hours of course content at 1 hour/day"

  - milestone_2:
      title: "Exam Preparation"
      order_index: 2
      duration_days: 15
      description: "Practice tests and revision"

Checkpoints:
  - checkpoint_1:
      title: "Mid-Course Review"
      after_days: 15
      milestone_id: milestone_1
      type: "MANUAL_REVIEW"

  - checkpoint_2:
      title: "Pre-Exam Assessment"
      after_days: 30
      milestone_id: milestone_2
      type: "AI_INTERVIEW"

Generated Cadence Sessions (30 sessions for milestone 1):
  Session 1: Day 1 (Mon), 60 mins, Status: TO_DO
  Session 2: Day 2 (Tue), 60 mins, Status: TO_DO
  Session 3: Day 3 (Wed), 60 mins, Status: TO_DO
  ...
  Session 22: Day 30 (Fri), 60 mins, Status: TO_DO
  [15 more sessions for milestone 2]
```

---

## 3. New Schema Design

### 3.1 New Enums

```sql
-- Expanded goal status lifecycle
CREATE TYPE goal_status_new AS ENUM (
  'DRAFT',              -- Developer is creating/editing
  'PENDING_REVIEW',     -- Submitted for admin/lead review
  'CHANGES_REQUESTED',  -- Reviewer requested modifications
  'APPROVED',           -- Approved but not started
  'IN_PROGRESS',        -- Developer actively working
  'BLOCKED',            -- Temporarily blocked
  'COMPLETED',          -- Successfully finished
  'ABANDONED'           -- Developer gave up
);

-- Frequency types for cadence scheduling
CREATE TYPE frequency_type AS ENUM (
  'DAILY',              -- Every single day
  'WEEKDAYS',           -- Monday to Friday
  'WEEKENDS',           -- Saturday and Sunday
  'CUSTOM'              -- Custom schedule via JSON config
);

-- Expanded cadence session status
CREATE TYPE cadence_status_new AS ENUM (
  'TO_DO',              -- Not started yet
  'IN_PROGRESS',        -- Currently working on it
  'COMPLETED',          -- Finished this session
  'DUE',                -- Past scheduled date, not completed
  'MISSED',             -- Developer acknowledged they missed it
  'SKIPPED'             -- Developer chose to skip (with reason)
);
```

### 3.2 Modified `goals` Table

**Key Changes:**

- Add `created_by` (the developer who originally created it)
- Make `assigned_by` nullable (not needed if self-created)
- Add `duplicated_from` (tracks if goal was cloned)
- Add `frequency_type` and `frequency_config` (flexible scheduling)
- Add `total_duration_days` (calculated from milestones)
- Add `current_streak` and `longest_streak` (denormalized for performance)
- Replace `template_id` with optional reference for backwards compatibility

```sql
CREATE TABLE goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Core relationships
  created_by UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  duplicated_from UUID REFERENCES goals(id) ON DELETE SET NULL,
  template_id UUID REFERENCES goal_templates(id) ON DELETE SET NULL,

  -- Goal details
  title TEXT NOT NULL,
  description TEXT,  -- OPTIONAL: Less friction during creation
  total_duration_days INTEGER,  -- OPTIONAL: Can be calculated from milestones

  -- Status lifecycle
  status goal_status_new DEFAULT 'DRAFT' NOT NULL,

  -- Dates
  start_date DATE,  -- Null until status becomes IN_PROGRESS
  target_end_date DATE,  -- Calculated when goal is approved
  actual_end_date DATE,  -- When goal was actually completed

  -- Frequency configuration
  frequency_type frequency_type,  -- OPTIONAL: Not required for DRAFT
  frequency_config JSONB,  -- Custom schedule config
  /*
    For WEEKDAYS: { "days": [1,2,3,4,5], "duration_minutes": 60 }
    For CUSTOM: { "days": [1,3,5], "duration_minutes": 90, "time": "18:00" }
  */

  -- Analytics (denormalized for performance)
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  total_sessions INTEGER DEFAULT 0,
  completed_sessions INTEGER DEFAULT 0,

  -- Review metadata
  reviewed_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  review_comments TEXT,

  -- Visibility
  is_public BOOLEAN DEFAULT false,  -- Can other devs duplicate this?

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX idx_goals_created_by ON goals(created_by);
CREATE INDEX idx_goals_user_id ON goals(user_id);
CREATE INDEX idx_goals_status ON goals(status);
CREATE INDEX idx_goals_duplicated_from ON goals(duplicated_from);
CREATE INDEX idx_goals_is_public ON goals(is_public) WHERE is_public = true;
CREATE INDEX idx_goals_dates ON goals(start_date, target_end_date);
```

### 3.3 Modified `milestones` Table

**Key Changes:**

- Add `duration_days` (how many days this milestone should take)
- Add `description` (detailed info about this phase)
- Add `estimated_sessions` (calculated based on frequency)

```sql
CREATE TABLE milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,

  title TEXT NOT NULL,
  description TEXT,  -- OPTIONAL: Can add details later
  order_index INTEGER NOT NULL,
  duration_days INTEGER,  -- OPTIONAL: Not required immediately
  estimated_sessions INTEGER,  -- OPTIONAL: Calculated based on frequency

  status milestone_status DEFAULT 'PENDING' NOT NULL,

  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_milestones_goal_id ON milestones(goal_id);
CREATE INDEX idx_milestones_status ON milestones(status);
CREATE INDEX idx_milestones_order ON milestones(goal_id, order_index);
```

### 3.4 Modified `cadence_sessions` Table

**Key Changes:**

- Add `title` and `description` (developer can customize)
- Update status enum to new values
- Add `completed_at` timestamp
- Add `skip_reason` for accountability
- Add `session_index` for ordering within milestone

```sql
CREATE TABLE cadence_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  milestone_id UUID REFERENCES milestones(id) ON DELETE CASCADE,  -- OPTIONAL: Can be null for standalone sessions

  session_index INTEGER,  -- OPTIONAL: Auto-assigned if not provided

  title TEXT,  -- OPTIONAL: Custom title by developer
  description TEXT,  -- OPTIONAL: What they plan to do
  scheduled_date DATE,  -- OPTIONAL: Can be set later
  duration_minutes INTEGER DEFAULT 60,  -- DEFAULT: 60 mins, can be changed

  status cadence_status_new DEFAULT 'TO_DO' NOT NULL,

  summary_text TEXT,  -- What they actually did
  skip_reason TEXT,  -- If status is SKIPPED

  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,

  calendar_event_id TEXT,

  -- Allows creation during DRAFT phase
  is_auto_generated BOOLEAN DEFAULT false,  -- Track if system or user created

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_cadence_sessions_goal_id ON cadence_sessions(goal_id);
CREATE INDEX idx_cadence_sessions_milestone_id ON cadence_sessions(milestone_id);
CREATE INDEX idx_cadence_sessions_scheduled_date ON cadence_sessions(scheduled_date);
CREATE INDEX idx_cadence_sessions_status ON cadence_sessions(status);
CREATE INDEX idx_cadence_sessions_order ON cadence_sessions(milestone_id, session_index);
```

### 3.5 Modified `checkpoints` Table

**Key Changes:**

- Add `title` and `description`
- Add `trigger_type` (after N days, after milestone completion, manual)
- Add `trigger_config` for flexible checkpoint scheduling

```sql
CREATE TABLE checkpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  milestone_id UUID REFERENCES milestones(id) ON DELETE SET NULL,

  title TEXT NOT NULL,
  description TEXT,  -- OPTIONAL: Can add context later

  -- Checkpoint scheduling
  trigger_type TEXT,  -- OPTIONAL: 'AFTER_DAYS', 'AFTER_MILESTONE', 'MANUAL'
  trigger_config JSONB,
  /*
    AFTER_DAYS: { "after_days": 15, "from_start": true }
    AFTER_MILESTONE: { "milestone_id": "uuid" }
    MANUAL: null
  */

  scheduled_date DATE,  -- Can be null if trigger is AFTER_MILESTONE
  type checkpoint_type NOT NULL,
  status checkpoint_status DEFAULT 'PENDING' NOT NULL,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_checkpoints_goal_id ON checkpoints(goal_id);
CREATE INDEX idx_checkpoints_milestone_id ON checkpoints(milestone_id);
CREATE INDEX idx_checkpoints_status ON checkpoints(status);
CREATE INDEX idx_checkpoints_scheduled_date ON checkpoints(scheduled_date);
```

### 3.6 Assessments Table (Checkpoint Results & Reviews)

**This is where COMPANY_ADMIN/TEAM_LEAD submit their checkpoint reviews.**

```sql
CREATE TABLE assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checkpoint_id UUID NOT NULL REFERENCES checkpoints(id) ON DELETE CASCADE,

  -- Reviewer details
  reviewer_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  -- Null means AI agent performed review

  -- Assessment results
  score INTEGER,  -- OPTIONAL: e.g., out of 100, or 1-5 rating
  passed BOOLEAN,  -- REQUIRED: Did developer pass this checkpoint?

  feedback_text TEXT,  -- OPTIONAL: Detailed feedback from reviewer
  strengths TEXT,  -- OPTIONAL: What developer did well
  areas_for_improvement TEXT,  -- OPTIONAL: What needs work

  -- Dynamic pivot (if failed)
  action_items JSONB,  -- Micro-goals if checkpoint failed
  /*
    [
      {"task": "Re-do AWS IAM module", "duration_minutes": 120, "priority": "HIGH"},
      {"task": "Practice VPC configuration", "duration_minutes": 90, "priority": "MEDIUM"}
    ]
  */

  -- Attachments/proof
  attachments JSONB,  -- Screenshots, recordings, documents
  /*
    [
      {"type": "video", "url": "...", "name": "Mock interview recording"},
      {"type": "document", "url": "...", "name": "Practice test results"}
    ]
  */

  -- Metadata
  review_duration_minutes INTEGER,  -- How long the review took
  reviewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_assessments_checkpoint_id ON assessments(checkpoint_id);
CREATE INDEX idx_assessments_reviewer_id ON assessments(reviewer_id);
CREATE INDEX idx_assessments_reviewed_at ON assessments(reviewed_at DESC);
```

**Checkpoint Review Workflow:**

```yaml
1. Checkpoint Status: PENDING
   - Developer completes milestone or reaches scheduled date
   - Checkpoint becomes active for review
   - Notification sent to TEAM_LEAD/COMPANY_ADMIN

2. Reviewer conducts assessment:
   - Can be live (video call mock interview)
   - Can be async (review submitted work)
   - Can be AI-driven (future feature)

3. Reviewer submits assessment:
   POST /api/checkpoints/:id/assess
   {
     "passed": true/false,
     "score": 85,
     "feedback_text": "Great understanding of AWS services...",
     "strengths": "Strong grasp of VPC concepts",
     "areas_for_improvement": "IAM policies need more practice",
     "action_items": [
       {"task": "Complete IAM hands-on labs", "duration_minutes": 120}
     ],
     "attachments": [{"type": "video", "url": "..."}]
   }

4. System updates checkpoint status:
   - If passed = true → Status: PASSED
   - If passed = false → Status: NEEDS_ATTENTION
   - If action_items provided → Create micro-goals (future feature)

5. Developer receives feedback:
   - Can view assessment details
   - Can discuss with reviewer
   - If failed, must address action_items before proceeding
```

### 3.7 New `goal_reviews` Table (Audit Trail)

Track all review activities and modifications during the review process.

```sql
CREATE TABLE goal_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,

  reviewer_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL,  -- 'REQUESTED_CHANGES', 'APPROVED', 'MODIFIED'

  comments TEXT,
  changes_made JSONB,  -- Track what was modified
  /*
    {
      "milestones": { "added": [...], "removed": [...], "modified": [...] },
      "checkpoints": { "added": [...], "removed": [...] },
      "frequency": { "old": {...}, "new": {...} }
    }
  */

  previous_status goal_status_new NOT NULL,
  new_status goal_status_new NOT NULL,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_goal_reviews_goal_id ON goal_reviews(goal_id);
CREATE INDEX idx_goal_reviews_reviewer_id ON goal_reviews(reviewer_id);
CREATE INDEX idx_goal_reviews_created_at ON goal_reviews(created_at DESC);
```

### 3.8 New `goal_streak_history` Table (Analytics)

Store daily streak snapshots for historical analytics and leaderboards.

```sql
CREATE TABLE goal_streak_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,

  date DATE NOT NULL,
  streak_count INTEGER NOT NULL,
  sessions_completed_today INTEGER NOT NULL,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

  UNIQUE(goal_id, date)
);

CREATE INDEX idx_goal_streak_history_goal_id ON goal_streak_history(goal_id);
CREATE INDEX idx_goal_streak_history_user_id ON goal_streak_history(user_id);
CREATE INDEX idx_goal_streak_history_date ON goal_streak_history(date DESC);
```

---

## 4. Key Features & Analytics

### 4.1 Streak Tracking Logic

```javascript
// Pseudo-code for streak calculation
function updateStreak(goalId, sessionDate) {
  const previousSession = getLastCompletedSession(goalId, sessionDate)

  if (previousSession) {
    const daysDiff = calculateWorkingDays(previousSession.date, sessionDate)

    if (daysDiff === 1) {
      // Continue streak
      goal.current_streak += 1
    } else {
      // Streak broken
      goal.current_streak = 1
    }
  } else {
    // First session
    goal.current_streak = 1
  }

  // Update longest streak if needed
  if (goal.current_streak > goal.longest_streak) {
    goal.longest_streak = goal.current_streak
  }

  // Log in streak_history
  insertStreakHistory(goalId, sessionDate, goal.current_streak)
}
```

### 4.2 Progress Calculation

```javascript
// Real-time progress percentage
function calculateProgress(goalId) {
const completedSessions = countSessions(goalId, status: 'COMPLETED');
  const totalSessions = countSessions(goalId);

  return (completedSessions / totalSessions) * 100;
}

// Milestone-specific progress
function calculateMilestoneProgress(milestoneId) {
  const completedSessions = countSessions(milestoneId, status: 'COMPLETED');
  const totalSessions = countSessions(milestoneId);

  return (completedSessions / totalSessions) * 100;
}
```

### 4.3 Dashboard Widgets (Peer Pressure)

```yaml
Team Dashboard Widgets:
  1. Active Goals Overview:
    - "Surya has a 10-day streak on 'AWS Solutions Architect'"
    - 'Priya completed 5/30 sessions this week'
    - "Rahul is 65% done with 'React Advanced Patterns'"

  2. Leaderboards:
    - Longest Active Streak
    - Most Goals Completed This Quarter
    - Most Consistent (completion rate %)

  3. Goal Library:
    - Browse successful goals by other developers
    - Filter by technology, duration, completion rate
    - One-click duplicate

  4. Upcoming Checkpoints:
    - '3 checkpoints pending review by Team Leads'
    - "Amit's AWS checkpoint scheduled for tomorrow"
```

### 4.4 Automated Cadence Generation

```javascript
// System function to generate cadence_sessions when goal is approved
function generateCadenceSessions(goal) {
  const { start_date, frequency_type, frequency_config, milestones } = goal
  let currentDate = start_date
  let sessionIndex = 0

  for (const milestone of milestones) {
    const milestoneSessions = calculateSessionsNeeded(
      milestone.duration_days,
      frequency_type,
      frequency_config,
    )

    for (let i = 0; i < milestoneSessions; i++) {
      sessionIndex++

      // Calculate next valid date based on frequency
      const scheduledDate = getNextValidDate(
        currentDate,
        frequency_type,
        frequency_config,
      )

      insertCadenceSession({
        goal_id: goal.id,
        milestone_id: milestone.id,
        session_index: sessionIndex,
        scheduled_date: scheduledDate,
        duration_minutes: frequency_config.duration_minutes,
        status: 'TO_DO',
      })

      currentDate = scheduledDate
    }
  }
}

function getNextValidDate(currentDate, frequencyType, config) {
  switch (frequencyType) {
    case 'DAILY':
      return addDays(currentDate, 1)

    case 'WEEKDAYS':
      let next = addDays(currentDate, 1)
      while (isWeekend(next)) {
        next = addDays(next, 1)
      }
      return next

    case 'WEEKENDS':
      let nextWeekend = addDays(currentDate, 1)
      while (!isWeekend(nextWeekend)) {
        nextWeekend = addDays(nextWeekend, 1)
      }
      return nextWeekend

    case 'CUSTOM':
      // Use config.days array [1,3,5] = Mon, Wed, Fri
      return getNextCustomDay(currentDate, config.days)
  }
}
```

---

## 5. API Endpoints (Feature Requirements)

### Goal Management

- `POST /api/goals/create` - Developer creates new goal (status: DRAFT)
  - **Minimal required**: Only `title` needed to start
- `PUT /api/goals/:id` - Developer edits draft goal
- `POST /api/goals/:id/submit` - Developer submits for review
- `POST /api/goals/:id/duplicate` - Duplicate existing goal
- `GET /api/goals/library` - Browse public goals (approved & completed)

### Milestone Management

- `POST /api/goals/:id/milestones` - Add milestone to goal
- `PUT /api/milestones/:id` - Update milestone
- `DELETE /api/milestones/:id` - Remove milestone

### Cadence Session Management (Pre-Review Creation Allowed)

- `POST /api/goals/:id/cadence-sessions` - Manually create sessions during DRAFT
- `POST /api/goals/:id/cadence-sessions/generate` - Auto-generate based on frequency
- `PUT /api/cadence-sessions/:id` - Update session details
- `DELETE /api/cadence-sessions/:id` - Remove session
- `POST /api/cadence-sessions/:id/complete` - Mark session as completed

### Checkpoint Management

- `POST /api/goals/:id/checkpoints` - Add checkpoint
- `PUT /api/checkpoints/:id` - Update checkpoint
- `DELETE /api/checkpoints/:id` - Remove checkpoint
- `POST /api/checkpoints/:id/assess` - **TEAM_LEAD/ADMIN submits review**
  ```json
  {
    "passed": true,
    "score": 85,
    "feedback_text": "Excellent progress...",
    "strengths": "Strong understanding...",
    "areas_for_improvement": "...",
    "action_items": [...],
    "attachments": [...]
  }
  ```
- `GET /api/checkpoints/:id/assessments` - View checkpoint review history

### Review Workflow

- `GET /api/goals/pending-review` - Admin/Lead gets list of goals needing review
- `POST /api/goals/:id/review` - Admin/Lead reviews goal
  - `action: 'approve' | 'request_changes'`
  - `comments: string`
  - `modifications: {...}` (if admin edited goal)

### Execution

- `POST /api/goals/:id/start` - Developer starts approved goal (generates sessions)
- `PUT /api/cadence-sessions/:id/update` - Update session status/details
- `GET /api/goals/:id/progress` - Get real-time progress & streaks

### Analytics

- `GET /api/analytics/team-streaks` - Team dashboard streak data
- `GET /api/analytics/leaderboards` - Various leaderboard metrics

---

## 6. Migration Strategy

### Since tables are empty, we can:

**Option 1: Drop and Recreate (RECOMMENDED)**

```sql
-- Create new migration file: 20260301000001_goals_redesign.sql
DROP TABLE IF EXISTS assessments CASCADE;
DROP TABLE IF EXISTS checkpoints CASCADE;
DROP TABLE IF EXISTS cadence_sessions CASCADE;
DROP TABLE IF EXISTS milestones CASCADE;
DROP TABLE IF EXISTS goals CASCADE;
DROP TYPE IF EXISTS goal_status CASCADE;
DROP TYPE IF EXISTS milestone_status CASCADE;
DROP TYPE IF EXISTS cadence_session_status CASCADE;
DROP TYPE IF EXISTS checkpoint_status CASCADE;

-- Create new enums and tables with new structure
-- (All new schema from section 3)
```

**Option 2: Alter Existing Tables**

- More complex but preserves table history
- Not recommended if tables are truly empty

### Migration Checklist:

- [ ] Backup current schema (even if empty)
- [ ] Create new enums with `_new` suffix
- [ ] Create new columns in goals table
- [ ] Create new goal_reviews table
- [ ] Create new goal_streak_history table
- [ ] Update all foreign key references
- [ ] Drop old enums
- [ ] Rename new enums (remove `_new` suffix)
- [ ] Update RLS policies
- [ ] Test with sample data

---

## 7. Summary of Key Changes

| Aspect              | Old System              | New System                   |
| ------------------- | ----------------------- | ---------------------------- |
| **Ownership**       | Admin-created templates | Developer-created goals      |
| **Workflow**        | Direct assignment       | Draft → Review → Approval    |
| **Flexibility**     | Fixed cadence           | Multiple frequency types     |
| **Collaboration**   | None                    | Goal duplication & sharing   |
| **Tracking**        | Basic status            | Streaks, progress, analytics |
| **Motivation**      | Individual              | Peer pressure + visibility   |
| **Session Control** | Auto-generated only     | Auto + manual customization  |
| **Checkpoints**     | Fixed schedule          | Flexible triggers            |

---

## 8. Next Steps

1. **Review this design** - Confirm alignment with vision
2. **Finalize schema** - Any additional fields needed?
3. **Create migration SQL** - Generate the actual migration file
4. **Update TypeScript types** - Create interfaces for new schema
5. **Build feature modules** - Implement repository → API → UI layers
6. **Test workflows** - End-to-end testing of create → review → execute

---

## Updated Based on Your Feedback ✅

### 1. Cadence Sessions Before Review

**IMPLEMENTED**: Developers can now:

- Manually create `cadence_sessions` during DRAFT phase
- Plan their entire schedule before submitting
- Let system auto-generate if they prefer (optional)
- Edit/delete sessions anytime before approval
- Added `is_auto_generated` flag to track source

### 2. Optional/Nullable Fields

**RELAXED**: Made these fields optional to reduce form friction:

- ✅ `goals.description` - Can add details later
- ✅ `goals.total_duration_days` - Calculated from milestones
- ✅ `goals.frequency_type` - Not needed immediately in DRAFT
- ✅ `milestones.description` - Can elaborate later
- ✅ `milestones.duration_days` - Can estimate later
- ✅ `cadence_sessions.milestone_id` - Can create standalone sessions
- ✅ `cadence_sessions.scheduled_date` - Can schedule later
- ✅ `cadence_sessions.session_index` - Auto-assigned if not provided
- ✅ `checkpoints.trigger_type` - Optional for manual checkpoints
- ✅ `assessments.score` - Optional, can just pass/fail
- ✅ `assessments.feedback_text` - Optional if score is enough

**Required Fields (Minimal):**

- `goals.title` - Must know what the goal is
- `goals.created_by` - System requirement
- `milestones.title` - Must know what phase this is
- `checkpoints.title` - Must identify the checkpoint

### 3. Checkpoint Results & Reviews

**CLARIFIED**: Enhanced `assessments` table with:

- ✅ `passed` field - Clear pass/fail indicator
- ✅ `feedback_text` - Detailed reviewer comments
- ✅ `strengths` & `areas_for_improvement` - Structured feedback
- ✅ `action_items` - Micro-goals if checkpoint failed
- ✅ `attachments` - Supporting documents/recordings
- ✅ New API endpoint: `POST /api/checkpoints/:id/assess`

**Review Submission Flow:**

```javascript
// TEAM_LEAD or COMPANY_ADMIN submits assessment
POST /api/checkpoints/abc-123/assess
{
  "passed": false,
  "score": 65,
  "feedback_text": "Good progress but needs more practice with IAM policies",
  "strengths": "Strong VPC understanding, good documentation",
  "areas_for_improvement": "IAM role assumptions, security group best practices",
  "action_items": [
    {"task": "Complete AWS IAM hands-on labs", "duration_minutes": 120, "priority": "HIGH"},
    {"task": "Review security best practices guide", "duration_minutes": 60, "priority": "MEDIUM"}
  ],
  "attachments": [
    {"type": "video", "url": "s3://...", "name": "Mock interview recording"}
  ]
}

// System response:
{
  "assessment_id": "xyz-789",
  "checkpoint_status": "NEEDS_ATTENTION",  // Because passed = false
  "action_items_created": true,
  "message": "Assessment submitted. Developer will be notified."
}
```

---

## Remaining Questions for Clarification

1. **Goal Templates**: Should we keep `goal_templates` table for backward compatibility or completely remove it?

2. **Visibility Control**: Should developers choose if their goal is public during creation, or automatically make all completed goals public?

3. **Review Permissions**: Can COMPANY_ADMIN and TEAM_LEAD both review any goal, or should TEAM_LEAD only review goals from their team members?

4. **Streak Definition**: Should streaks count calendar days or only scheduled days? (e.g., if frequency is weekdays, does Saturday/Sunday break the streak?)

5. **Cadence Modification After Start**: Once a goal is IN_PROGRESS, can developers manually add/remove sessions, or should it be locked?

6. **Checkpoint Auto-Scheduling**: When a checkpoint trigger is "AFTER_MILESTONE", should the system auto-schedule it when the milestone is completed, or require admin/lead to manually schedule?

---

**Status**: Ready for review and finalization ✅
