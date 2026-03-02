-- ============================================================================
-- Migration: Goals Feature Redesign
-- Created: 2026-03-01 00:00:01 UTC
-- Description: Complete redesign of goals feature for developer-centric workflow
--
-- This migration:
-- - Drops old goal-related tables and enums
-- - Creates new enums with expanded status values
-- - Implements developer-centric goal creation workflow
-- - Adds support for pre-review cadence session creation
-- - Enhances checkpoint review system with detailed assessments
-- - Adds goal duplication and sharing features
-- - Implements streak tracking and analytics
--
-- Notes:
-- - Safe to run as all goal-related tables are currently empty
-- - Makes most fields optional to reduce form friction
-- - Adds audit trail for goal reviews
-- - Implements flexible frequency scheduling
-- ============================================================================

-- ============================================================================
-- DROP OLD TABLES AND ENUMS (Safe: Tables are Empty)
-- ============================================================================

-- Drop tables in reverse dependency order
DROP TABLE IF EXISTS assessments CASCADE;

DROP TABLE IF EXISTS checkpoints CASCADE;

DROP TABLE IF EXISTS cadence_sessions CASCADE;

DROP TABLE IF EXISTS milestones CASCADE;

DROP TABLE IF EXISTS goals CASCADE;

DROP TABLE IF EXISTS goal_templates CASCADE;

-- Drop old enums
DROP TYPE IF EXISTS checkpoint_status CASCADE;

DROP TYPE IF EXISTS checkpoint_type CASCADE;

DROP TYPE IF EXISTS cadence_session_status CASCADE;

DROP TYPE IF EXISTS milestone_status CASCADE;

DROP TYPE IF EXISTS goal_status CASCADE;

-- ============================================================================
-- NEW ENUMS
-- ============================================================================

-- Expanded goal status lifecycle with review workflow
CREATE TYPE goal_status AS ENUM (
  'DRAFT',              -- Developer is creating/editing
  'PENDING_REVIEW',     -- Submitted for admin/lead review
  'CHANGES_REQUESTED',  -- Reviewer requested modifications
  'APPROVED',           -- Approved but not started
  'IN_PROGRESS',        -- Developer actively working
  'ON_HOLD',            -- Temporarily paused
  'BLOCKED',            -- Blocked by external factors
  'COMPLETED',          -- Successfully finished
  'ABANDONED'           -- Developer gave up/discontinued
);

-- Frequency types for flexible cadence scheduling
CREATE TYPE frequency_type AS ENUM (
  'DAILY',              -- Every single day (7 days/week)
  'WEEKDAYS',           -- Monday to Friday only
  'WEEKENDS',           -- Saturday and Sunday only
  'CUSTOM'              -- Custom schedule via JSON config
);

-- Expanded cadence session status with detailed tracking
CREATE TYPE cadence_session_status AS ENUM (
  'TO_DO',              -- Not started yet
  'IN_PROGRESS',        -- Currently working on it
  'COMPLETED',          -- Finished this session
  'DUE',                -- Past scheduled date, not completed
  'MISSED',             -- Developer acknowledged they missed it
  'SKIPPED'             -- Developer chose to skip (with reason)
);

-- Milestone status (unchanged but recreated)
CREATE TYPE milestone_status AS ENUM (
  'PENDING',            -- Not started
  'ACTIVE',             -- Currently in progress
  'COMPLETED'           -- Finished
);

-- Checkpoint types (unchanged but recreated)
CREATE TYPE checkpoint_type AS ENUM (
  'MANUAL_REVIEW',      -- Human reviewer conducts assessment
  'AI_INTERVIEW'        -- AI agent conducts automated interview
);

-- Expanded checkpoint status with review workflow
CREATE TYPE checkpoint_status AS ENUM (
  'PENDING',            -- Checkpoint not yet reached
  'READY_FOR_REVIEW',   -- Developer reached this checkpoint, awaiting review
  'REVIEW_IN_PROGRESS', -- Reviewer is currently assessing
  'NEEDS_ATTENTION',    -- Failed/soft flag - needs improvement
  'PASSED',             -- Successfully passed
  'SKIPPED'             -- Checkpoint was skipped (with reason)
);

-- ============================================================================
-- GOAL TEMPLATES (OPTIONAL: Keep for Backward Compatibility)
-- ============================================================================

-- Optional: Keep goal_templates for admin-created templates
-- Can coexist with developer-created goals
CREATE TABLE goal_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    company_id UUID REFERENCES companies (id) ON DELETE CASCADE,
    -- NULL company_id means global Zavara template
    title TEXT NOT NULL,
    description TEXT,
    created_by UUID REFERENCES user_profiles (id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_goal_templates_company_id ON goal_templates (company_id);

CREATE INDEX idx_goal_templates_created_by ON goal_templates (created_by);

CREATE INDEX idx_goal_templates_is_active ON goal_templates (is_active)
WHERE
    is_active = true;

ALTER TABLE goal_templates ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- GOALS TABLE (REDESIGNED)
-- ============================================================================

CREATE TABLE goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

-- Core relationships
created_by UUID NOT NULL REFERENCES user_profiles (id) ON DELETE CASCADE,
user_id UUID NOT NULL REFERENCES user_profiles (id) ON DELETE CASCADE,
assigned_by UUID REFERENCES user_profiles (id) ON DELETE SET NULL,
duplicated_from UUID REFERENCES goals (id) ON DELETE SET NULL,
template_id UUID REFERENCES goal_templates (id) ON DELETE SET NULL,

-- Goal details (minimal required fields)
title TEXT NOT NULL,
description TEXT, -- OPTIONAL: Can add details later
total_duration_days INTEGER, -- OPTIONAL: Calculated from milestones

-- Status lifecycle
status goal_status DEFAULT 'DRAFT' NOT NULL,

-- Dates
start_date DATE, -- NULL until status becomes IN_PROGRESS
target_end_date DATE, -- Calculated when goal is approved
actual_end_date DATE, -- When goal was actually completed

-- Frequency configuration (OPTIONAL)
frequency_type frequency_type, -- Not required for DRAFT
frequency_config JSONB,
/*
For DAILY: { "duration_minutes": 60 }
For WEEKDAYS: { "days": [1,2,3,4,5], "duration_minutes": 60 }
For WEEKENDS: { "days": [6,7], "duration_minutes": 90 }
For CUSTOM: { "days": [1,3,5], "duration_minutes": 90, "time": "18:00" }
*/

-- Analytics (denormalized for performance)
current_streak INTEGER DEFAULT 0 NOT NULL,
longest_streak INTEGER DEFAULT 0 NOT NULL,
total_sessions INTEGER DEFAULT 0 NOT NULL,
completed_sessions INTEGER DEFAULT 0 NOT NULL,

-- Review metadata
reviewed_by UUID REFERENCES user_profiles (id) ON DELETE SET NULL,
reviewed_at TIMESTAMP
WITH
    TIME ZONE,
    review_comments TEXT,

-- Visibility & sharing
is_public BOOLEAN DEFAULT false NOT NULL, -- Can other devs duplicate this?
duplication_count INTEGER DEFAULT 0 NOT NULL, -- How many times duplicated

-- Metadata
created_at TIMESTAMP
WITH
    TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP
WITH
    TIME ZONE DEFAULT NOW() NOT NULL,

-- Constraints
CONSTRAINT chk_user_or_assigned CHECK (
        user_id = created_by OR assigned_by IS NOT NULL
    ),
    CONSTRAINT chk_start_before_end CHECK (
        start_date IS NULL OR target_end_date IS NULL OR start_date <= target_end_date
    )
);

-- Indexes for performance
CREATE INDEX idx_goals_created_by ON goals (created_by);

CREATE INDEX idx_goals_user_id ON goals (user_id);

CREATE INDEX idx_goals_assigned_by ON goals (assigned_by);

CREATE INDEX idx_goals_status ON goals (status);

CREATE INDEX idx_goals_duplicated_from ON goals (duplicated_from);

CREATE INDEX idx_goals_template_id ON goals (template_id);

CREATE INDEX idx_goals_is_public ON goals (is_public)
WHERE
    is_public = true;

CREATE INDEX idx_goals_dates ON goals (start_date, target_end_date);

CREATE INDEX idx_goals_created_at ON goals (created_at DESC);

ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- MILESTONES TABLE (ENHANCED)
-- ============================================================================


CREATE TABLE milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    goal_id UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
    
    title TEXT NOT NULL,
    description TEXT,  -- OPTIONAL: Can add details later
    order_index INTEGER NOT NULL,
    duration_days INTEGER,  -- OPTIONAL: Not required immediately
    estimated_sessions INTEGER,  -- OPTIONAL: Calculated based on frequency
    
    status milestone_status DEFAULT 'PENDING' NOT NULL,

-- Timestamps
started_at TIMESTAMP
WITH
    TIME ZONE,
    completed_at TIMESTAMP
WITH
    TIME ZONE,
    created_at TIMESTAMP
WITH
    TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP
WITH
    TIME ZONE DEFAULT NOW() NOT NULL,

-- Constraints
CONSTRAINT chk_milestone_order_positive CHECK (order_index > 0),
    CONSTRAINT chk_milestone_duration_positive CHECK (
        duration_days IS NULL OR duration_days > 0
    )
);

-- Indexes
CREATE INDEX idx_milestones_goal_id ON milestones (goal_id);

CREATE INDEX idx_milestones_status ON milestones (status);

CREATE INDEX idx_milestones_order ON milestones (goal_id, order_index);

ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- CADENCE SESSIONS TABLE (PRE-REVIEW CREATION ENABLED)
-- ============================================================================


CREATE TABLE cadence_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    goal_id UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
    milestone_id UUID REFERENCES milestones(id) ON DELETE CASCADE,
    -- OPTIONAL: Can be null for standalone sessions
    
    session_index INTEGER,  -- OPTIONAL: Auto-assigned if not provided

-- Session details (all optional for flexibility)
title TEXT, -- Custom title by developer
description TEXT, -- What they plan to do
scheduled_date DATE, -- Can be set later
duration_minutes INTEGER DEFAULT 60 NOT NULL,
status cadence_session_status DEFAULT 'TO_DO' NOT NULL,

-- Completion details
summary_text TEXT, -- What they actually did (after completion)
skip_reason TEXT, -- If status is SKIPPED

-- Timestamps
started_at TIMESTAMP
WITH
    TIME ZONE,
    completed_at TIMESTAMP
WITH
    TIME ZONE,

-- Integration
calendar_event_id TEXT, -- For future calendar sync

-- Metadata
is_auto_generated BOOLEAN DEFAULT false NOT NULL, -- Track if system or user created
created_at TIMESTAMP
WITH
    TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP
WITH
    TIME ZONE DEFAULT NOW() NOT NULL,

-- Constraints
CONSTRAINT chk_session_duration_positive CHECK (duration_minutes > 0),
    CONSTRAINT chk_skip_reason_if_skipped CHECK (
        status != 'SKIPPED' OR skip_reason IS NOT NULL
    )
);

-- Indexes
CREATE INDEX idx_cadence_sessions_goal_id ON cadence_sessions (goal_id);

CREATE INDEX idx_cadence_sessions_milestone_id ON cadence_sessions (milestone_id);

CREATE INDEX idx_cadence_sessions_scheduled_date ON cadence_sessions (scheduled_date);

CREATE INDEX idx_cadence_sessions_status ON cadence_sessions (status);

CREATE INDEX idx_cadence_sessions_order ON cadence_sessions (milestone_id, session_index);

CREATE INDEX idx_cadence_sessions_completed_at ON cadence_sessions (completed_at DESC);

ALTER TABLE cadence_sessions ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- CHECKPOINTS TABLE (ENHANCED REVIEW WORKFLOW)
-- ============================================================================


CREATE TABLE checkpoints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    goal_id UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
    milestone_id UUID REFERENCES milestones(id) ON DELETE SET NULL,
    
    title TEXT NOT NULL,
    description TEXT,  -- OPTIONAL: Can add context later

-- Checkpoint scheduling (flexible triggers)
trigger_type TEXT, -- OPTIONAL: 'AFTER_DAYS', 'AFTER_MILESTONE', 'MANUAL'
trigger_config JSONB,
/*
AFTER_DAYS: { "after_days": 15, "from_start": true }
AFTER_MILESTONE: { "milestone_id": "uuid" }
MANUAL: null
*/
scheduled_date DATE, -- Can be null if trigger is AFTER_MILESTONE
type checkpoint_type NOT NULL,
status checkpoint_status DEFAULT 'PENDING' NOT NULL,

-- Review tracking
assigned_reviewer_id UUID REFERENCES user_profiles (id) ON DELETE SET NULL,
review_started_at TIMESTAMP
WITH
    TIME ZONE,

-- Metadata
created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX idx_checkpoints_goal_id ON checkpoints (goal_id);

CREATE INDEX idx_checkpoints_milestone_id ON checkpoints (milestone_id);

CREATE INDEX idx_checkpoints_status ON checkpoints (status);

CREATE INDEX idx_checkpoints_scheduled_date ON checkpoints (scheduled_date);

CREATE INDEX idx_checkpoints_assigned_reviewer ON checkpoints (assigned_reviewer_id);

ALTER TABLE checkpoints ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- ASSESSMENTS TABLE (CHECKPOINT RESULTS & REVIEWS)
-- ============================================================================

CREATE TABLE assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    checkpoint_id UUID NOT NULL REFERENCES checkpoints(id) ON DELETE CASCADE,

-- Reviewer details
reviewer_id UUID REFERENCES user_profiles (id) ON DELETE SET NULL,
-- NULL means AI agent performed review

-- Assessment results
passed BOOLEAN NOT NULL, -- REQUIRED: Did developer pass?
score INTEGER, -- OPTIONAL: e.g., out of 100, or 1-5 rating

-- Detailed feedback (all optional)
feedback_text TEXT, -- Overall feedback
strengths TEXT, -- What developer did well
areas_for_improvement TEXT, -- What needs work

-- Dynamic pivot (if failed)
action_items JSONB,
/*
[
{
"task": "Re-do AWS IAM module",
"duration_minutes": 120,
"priority": "HIGH",
"resources": ["link1", "link2"]
},
{
"task": "Practice VPC configuration",
"duration_minutes": 90,
"priority": "MEDIUM"
}
]
*/

-- Attachments/proof
attachments JSONB,
/*
[
{
"type": "video",
"url": "s3://bucket/recording.mp4",
"name": "Mock interview recording",
"size_bytes": 50000000
},
{
"type": "document",
"url": "s3://bucket/results.pdf",
"name": "Practice test results"
}
]
*/

-- Metadata
review_duration_minutes INTEGER, -- How long the review took
reviewed_at TIMESTAMP
WITH
    TIME ZONE DEFAULT NOW() NOT NULL,
    created_at TIMESTAMP
WITH
    TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP
WITH
    TIME ZONE DEFAULT NOW() NOT NULL,

-- Constraints
CONSTRAINT chk_score_range CHECK (
        score IS NULL OR (score >= 0 AND score <= 100)
    ),
    CONSTRAINT chk_review_duration_positive CHECK (
        review_duration_minutes IS NULL OR review_duration_minutes > 0
    )
);

-- Indexes
CREATE INDEX idx_assessments_checkpoint_id ON assessments (checkpoint_id);

CREATE INDEX idx_assessments_reviewer_id ON assessments (reviewer_id);

CREATE INDEX idx_assessments_reviewed_at ON assessments (reviewed_at DESC);

CREATE INDEX idx_assessments_passed ON assessments (passed);

ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- GOAL REVIEWS TABLE (AUDIT TRAIL)
-- ============================================================================

CREATE TABLE goal_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    goal_id UUID NOT NULL REFERENCES goals (id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES user_profiles (id) ON DELETE CASCADE,
    action TEXT NOT NULL, -- 'REQUESTED_CHANGES', 'APPROVED', 'MODIFIED', 'REJECTED'
    comments TEXT,
    changes_made JSONB,
    /*
    {
    "milestones": {
    "added": [{"title": "...", "duration_days": 10}],
    "removed": ["milestone_id_1"],
    "modified": [{"id": "...", "changes": {...}}]
    },
    "checkpoints": {
    "added": [...],
    "removed": [...]
    },
    "frequency": {
    "old": {"type": "DAILY", ...},
    "new": {"type": "WEEKDAYS", ...}
    }
    }
    */
    previous_status goal_status NOT NULL,
    new_status goal_status NOT NULL,
    created_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX idx_goal_reviews_goal_id ON goal_reviews (goal_id);

CREATE INDEX idx_goal_reviews_reviewer_id ON goal_reviews (reviewer_id);

CREATE INDEX idx_goal_reviews_created_at ON goal_reviews (created_at DESC);

CREATE INDEX idx_goal_reviews_action ON goal_reviews (action);

ALTER TABLE goal_reviews ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- GOAL STREAK HISTORY TABLE (ANALYTICS)
-- ============================================================================


CREATE TABLE goal_streak_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    goal_id UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    
    date DATE NOT NULL,
    streak_count INTEGER NOT NULL,
    sessions_completed_today INTEGER NOT NULL DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

-- Ensure one record per goal per date
UNIQUE (goal_id, date),

-- Constraints
CONSTRAINT chk_streak_positive CHECK (streak_count >= 0),
    CONSTRAINT chk_sessions_non_negative CHECK (sessions_completed_today >= 0)
);

-- Indexes
CREATE INDEX idx_goal_streak_history_goal_id ON goal_streak_history (goal_id);

CREATE INDEX idx_goal_streak_history_user_id ON goal_streak_history (user_id);

CREATE INDEX idx_goal_streak_history_date ON goal_streak_history (date DESC);

CREATE INDEX idx_goal_streak_history_streak ON goal_streak_history (streak_count DESC);

ALTER TABLE goal_streak_history ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update_updated_at trigger to all tables
CREATE TRIGGER update_goals_updated_at
    BEFORE UPDATE ON goals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_milestones_updated_at
    BEFORE UPDATE ON milestones
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cadence_sessions_updated_at
    BEFORE UPDATE ON cadence_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_checkpoints_updated_at
    BEFORE UPDATE ON checkpoints
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assessments_updated_at
    BEFORE UPDATE ON assessments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_goal_templates_updated_at
    BEFORE UPDATE ON goal_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON
TABLE goals IS 'Developer-centric goals with review workflow and streak tracking';

COMMENT ON TABLE milestones IS 'Chronological phases within a goal';

COMMENT ON
TABLE cadence_sessions IS 'Honor-system learning sessions, can be created before or after goal approval';

COMMENT ON
TABLE checkpoints IS 'Scheduled validation points for developer knowledge';

COMMENT ON
TABLE assessments IS 'Detailed evaluation results submitted by reviewers for checkpoints';

COMMENT ON
TABLE goal_reviews IS 'Audit trail of all review actions and modifications to goals';

COMMENT ON
TABLE goal_streak_history IS 'Daily snapshot of goal streaks for analytics and leaderboards';

COMMENT ON COLUMN goals.created_by IS 'The developer who originally created this goal';

COMMENT ON COLUMN goals.user_id IS 'The developer assigned to execute this goal';

COMMENT ON COLUMN goals.assigned_by IS 'The admin/lead who assigned (null if self-created)';

COMMENT ON COLUMN goals.duplicated_from IS 'Reference to original goal if this was duplicated';

COMMENT ON COLUMN goals.is_public IS 'Whether other developers can duplicate this goal';

COMMENT ON COLUMN goals.current_streak IS 'Current consecutive days without missing a session';

COMMENT ON COLUMN goals.longest_streak IS 'Longest streak achieved during this goal';

COMMENT ON COLUMN cadence_sessions.is_auto_generated IS 'True if system generated, false if manually created by developer';

COMMENT ON COLUMN cadence_sessions.summary_text IS 'What the developer actually accomplished (filled after completion)';

COMMENT ON COLUMN checkpoints.trigger_type IS 'How this checkpoint is triggered: AFTER_DAYS, AFTER_MILESTONE, or MANUAL';

COMMENT ON COLUMN checkpoints.status IS 'Expanded status including READY_FOR_REVIEW and REVIEW_IN_PROGRESS';

COMMENT ON COLUMN assessments.passed IS 'Whether the developer passed this checkpoint (required for clear outcomes)';

COMMENT ON COLUMN assessments.action_items IS 'Micro-goals to address if checkpoint was failed';

COMMENT ON COLUMN assessments.attachments IS 'Supporting documents, recordings, or screenshots from the review';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Summary:
-- ✅ Dropped old goal-related tables and enums
-- ✅ Created new enums with expanded status values
-- ✅ Implemented developer-centric goal workflow
-- ✅ Enabled pre-review cadence session creation
-- ✅ Enhanced checkpoint review system
-- ✅ Added goal duplication and sharing
-- ✅ Implemented streak tracking
-- ✅ Added comprehensive audit trail
-- ✅ Made non-critical fields optional for better UX