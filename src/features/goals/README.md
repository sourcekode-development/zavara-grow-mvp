# Goals Feature - Developer Upskilling System

## Overview

The Goals feature enables developers to create, track, and validate their upskilling journey through structured learning paths with built-in accountability, peer collaboration, and progress validation.

## Core Concept

**Developer-Centric:** Unlike traditional top-down assignment systems, developers create their own goals, submit for review, and execute with team visibility.

## Example Use Case

A developer wants to become AWS Certified Solutions Architect:

1. Creates goal: "AWS Solutions Architect Certification"
2. Adds milestones: "Complete Udemy Course (30 days)", "Exam Preparation (15 days)"
3. Configures frequency: Weekdays, 60 minutes/day
4. System calculates: 30 working days × 1 hour = 30 sessions
5. Submits for Team Lead approval
6. Executes: Tracks daily progress, maintains streak, validates at checkpoints
7. Completes: Goal becomes available for peers to duplicate

---

## Key Features

### 1. Flexible Creation

- **Minimal friction:** Only title required to start
- **Progressive detail:** Add description, milestones, frequency as you plan
- **Pre-planning:** Create cadence sessions manually before submission
- **Templates:** Optional use of pre-made templates

### 2. Review Workflow

- **Statuses:** DRAFT → PENDING_REVIEW → APPROVED → IN_PROGRESS → COMPLETED
- **Review actions:** Approve, Request Changes, Modify & Approve
- **Audit trail:** All review actions logged in `goal_reviews`

### 3. Smart Scheduling

- **Frequency types:**
  - `DAILY` - Every day (7 days/week)
  - `WEEKDAYS` - Monday-Friday only
  - `WEEKENDS` - Saturday-Sunday only
  - `CUSTOM` - Specific days via config
- **Auto-generation:** System creates cadence sessions based on frequency
- **Manual override:** Developers can create/modify sessions anytime

### 4. Progress Tracking

- **Session statuses:** TO_DO → IN_PROGRESS → COMPLETED
- **Streak system:** Tracks consecutive days without missing
- **Team visibility:** Dashboard shows all developers' progress
- **Analytics:** `goal_streak_history` stores daily snapshots

### 5. Validation Checkpoints

- **Trigger types:**
  - `AFTER_DAYS` - Scheduled after N days
  - `AFTER_MILESTONE` - When milestone completes
  - `MANUAL` - Ad-hoc reviews
- **Review types:** MANUAL_REVIEW (human) or AI_INTERVIEW (future)
- **Rich assessments:** Pass/fail, score, feedback, strengths, improvement areas

### 6. Peer Collaboration

- **Goal library:** Browse successful public goals
- **Duplication:** Clone peer goals as starting template
- **Customization:** Modify duplicated goal before submission
- **Tracking:** `duplicated_from` links maintain lineage

---

## Database Schema

### Core Tables

#### `goals`

Main goal entity with developer-centric workflow.

**Key Fields:**

- `created_by` - Developer who created this goal
- `user_id` - Developer executing the goal (usually same as created_by)
- `assigned_by` - Nullable (null if self-created)
- `status` - Lifecycle: DRAFT → PENDING_REVIEW → APPROVED → IN_PROGRESS → COMPLETED
- `frequency_type` & `frequency_config` - How often sessions occur
- `current_streak`, `longest_streak` - Motivation metrics
- `is_public` - Allow peer duplication

#### `milestones`

Chronological phases within a goal.

**Key Fields:**

- `title` - Required (e.g., "Complete Course")
- `order_index` - 1, 2, 3... for sequencing
- `duration_days` - Optional estimate
- `status` - PENDING → ACTIVE → COMPLETED

#### `cadence_sessions`

Individual work sessions (to-do items).

**Key Fields:**

- `scheduled_date` - When to complete
- `status` - TO_DO, IN_PROGRESS, COMPLETED, DUE, MISSED, SKIPPED
- `summary_text` - What was accomplished
- `is_auto_generated` - System vs. user created

#### `checkpoints`

Validation points requiring review.

**Key Fields:**

- `trigger_type` - AFTER_DAYS, AFTER_MILESTONE, MANUAL
- `status` - PENDING, READY_FOR_REVIEW, REVIEW_IN_PROGRESS, NEEDS_ATTENTION, PASSED
- `type` - MANUAL_REVIEW or AI_INTERVIEW

#### `assessments`

Results of checkpoint reviews.

**Key Fields:**

- `passed` - Boolean (required)
- `score` - Optional 0-100
- `feedback_text`, `strengths`, `areas_for_improvement` - Structured feedback
- `action_items` - JSONB array of remedial micro-goals if failed
- `attachments` - JSONB array of supporting docs/recordings

#### `goal_reviews`

Audit trail of all review actions.

#### `goal_streak_history`

Daily snapshots for leaderboards and analytics.

---

## API Layer Structure

```
src/features/goals/
├── repository/          # Supabase queries (ONLY layer touching DB)
│   ├── goals.repository.ts
│   ├── milestones.repository.ts
│   ├── cadence-sessions.repository.ts
│   ├── checkpoints.repository.ts
│   └── assessments.repository.ts
│
├── apis/                # Business logic (calls repository)
│   ├── goals.api.ts
│   ├── milestones.api.ts
│   ├── sessions.api.ts
│   ├── checkpoints.api.ts
│   └── reviews.api.ts
│
├── store/               # Zustand state management
│   ├── goals.store.ts
│   └── sessions.store.ts
│
├── hooks/               # React hooks
│   ├── useGoals.ts
│   ├── useGoalCreate.ts
│   ├── useSessions.ts
│   └── useCheckpoints.ts
│
├── components/          # UI components
│   ├── goal-form.tsx
│   ├── milestone-editor.tsx
│   ├── session-card.tsx
│   ├── checkpoint-assessment.tsx
│   └── streak-badge.tsx
│
└── pages/               # Page-level components
    ├── goals-list.page.tsx
    ├── goal-create.page.tsx
    ├── goal-detail.page.tsx
    └── goal-library.page.tsx
```

---

## Key Workflows

### Creating a Goal

```typescript
// 1. Developer creates goal (minimal)
POST /api/goals
{
  "title": "AWS Solutions Architect"
}
-> Returns goal with status: DRAFT

// 2. Add milestones
POST /api/goals/:id/milestones
{
  "title": "Complete Udemy Course",
  "order_index": 1,
  "duration_days": 30
}

// 3. Configure frequency
PATCH /api/goals/:id
{
  "frequency_type": "WEEKDAYS",
  "frequency_config": {
    "days": [1,2,3,4,5],
    "duration_minutes": 60
  }
}

// 4. (Optional) Manually add sessions
POST /api/goals/:id/cadence-sessions
{
  "milestone_id": "...",
  "scheduled_date": "2026-03-03",
  "title": "AWS IAM & Identity"
}

// 5. Submit for review
POST /api/goals/:id/submit
-> Status: PENDING_REVIEW
```

### Reviewing a Goal

```typescript
// Admin/Lead reviews
POST /api/goals/:id/review
{
  "action": "APPROVED",  // or REQUESTED_CHANGES
  "comments": "Good plan, approved!"
}
-> Status: APPROVED
-> Entry created in goal_reviews
```

### Starting & Executing

```typescript
// Developer starts goal
POST /api/goals/:id/start
-> Status: IN_PROGRESS
-> If sessions don't exist, auto-generates based on frequency

// Update session progress
PATCH /api/cadence-sessions/:id
{
  "status": "IN_PROGRESS"
}

// Complete session
PATCH /api/cadence-sessions/:id
{
  "status": "COMPLETED",
  "summary_text": "Completed IAM module, created users/roles in practice account"
}
-> Updates goal.current_streak
-> Updates goal.completed_sessions
-> Logs to goal_streak_history
```

### Checkpoint Assessment

```typescript
// Checkpoint becomes READY_FOR_REVIEW
// Reviewer conducts assessment
POST /api/checkpoints/:id/assess
{
  "passed": true,
  "score": 85,
  "feedback_text": "Strong understanding of AWS services",
  "strengths": "Excellent VPC configuration, clear documentation",
  "areas_for_improvement": "IAM policies need more practice",
  "attachments": [
    {
      "type": "video",
      "url": "s3://...",
      "name": "Mock interview recording"
    }
  ]
}
-> Checkpoint status: PASSED (or NEEDS_ATTENTION if failed)
-> Developer receives feedback
```

### Duplicating a Goal

```typescript
// Browse library
GET /api/goals/library?is_public=true&status=COMPLETED

// Duplicate goal
POST /api/goals/:id/duplicate
-> Creates new goal with same structure
-> Sets duplicated_from reference
-> Status: DRAFT (can customize)
-> Increments original goal's duplication_count
```

---

## Business Rules

### Streak Logic

- **Increment:** If session completed AND previous scheduled day also completed
- **Break:** If scheduled day passes without completion
- **Skip days:** Weekend days don't break WEEKDAYS frequency streaks
- **Cron job:** Daily job updates DUE/MISSED statuses and streak counts

### Session Auto-Generation

```typescript
function generateSessions(goal) {
  const { frequency_type, frequency_config, milestones } = goal
  let currentDate = goal.start_date

  for (milestone of milestones) {
    const sessionsNeeded = calculateSessions(
      milestone.duration_days,
      frequency_type,
    )

    for (i = 0; i < sessionsNeeded; i++) {
      currentDate = getNextValidDate(
        currentDate,
        frequency_type,
        frequency_config,
      )
      createSession(goal.id, milestone.id, currentDate)
    }
  }
}
```

### Checkpoint Triggers

- `AFTER_DAYS`: Triggered N days after goal start_date
- `AFTER_MILESTONE`: Triggered when milestone status becomes COMPLETED
- `MANUAL`: No auto-trigger, admin/lead schedules manually

---

## UI/UX Considerations

### Goal Creation Flow

1. **Step 1:** Title only (save as DRAFT immediately)
2. **Step 2:** Add milestones (can add multiple)
3. **Step 3:** Configure frequency
4. **Step 4 (Optional):** Manually plan sessions
5. **Step 5 (Optional):** Add checkpoints
6. **Submit:** Single button to send for review

### Progress Dashboard

- **Streak badge:** Large, prominent display of current streak
- **Progress bar:** % completion (completed_sessions / total_sessions)
- **Today's sessions:** Quick access to sessions scheduled for today
- **Team leaderboard:** Top streaks, most consistent developers
- **Upcoming checkpoints:** Warning banners for reviews due soon

### Session Card

```
┌─────────────────────────────────────────┐
│ TO_DO | Mon, Mar 3 | 60 mins           │
├─────────────────────────────────────────┤
│ AWS IAM & Identity Management           │
│ Complete IAM section of course          │
│                                         │
│ [Start] [Skip]                          │
└─────────────────────────────────────────┘

(After completion)
┌─────────────────────────────────────────┐
│ ✓ COMPLETED | Mon, Mar 3 | 60 mins     │
├─────────────────────────────────────────┤
│ AWS IAM & Identity Management           │
│                                         │
│ Summary: Completed IAM module, created  │
│ users/roles in practice account...      │
└─────────────────────────────────────────┘
```

## Future Enhancements

### AI Integration

- **AI Mock Interviewer:** Parse session summaries, generate contextual technical questions
- **Auto-checkpoint:** AI conducts checkpoint assessments automatically
- **Smart recommendations:** Suggest action_items based on assessment patterns

### Analytics

- **Company dashboard:** Aggregate metrics across all developers
- **Predictive insights:** Identify developers at risk of abandoning goals
- **ROI tracking:** Time to billability improvements

### Gamification

- **Badges:** Achievements for streaks, completions, peer impact
- **Challenges:** Team-wide upskilling competitions
- **Rewards:** Integration with company reward systems

## Common Pitfalls

❌ **Trying to generate sessions before frequency is configured**
✅ Solution: Validate frequency_type exists before calling generate

❌ **Breaking streaks on non-scheduled days**
✅ Solution: Only check scheduled days based on frequency_config

❌ **Allowing status transitions without validation**
✅ Solution: Implement state machine pattern for status changes

❌ **Not logging review actions**
✅ Solution: Always create goal_reviews entry on any review action

❌ **Forgetting to update denormalized fields**
✅ Solution: Use database triggers or service layer hooks

---

## Related Features

- **KPIs:** Performance reviews that complement upskilling goals
- **Teams:** Goals visible to team members for peer pressure
- **Dashboard:** Aggregate view of all developer activities
- **Notifications:** Alerts for checkpoint reviews, missed sessions

---

**Last Updated:** March 1, 2026
**Migration Applied:** 20260301000001_goals_redesign.sql
