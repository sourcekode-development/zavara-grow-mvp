// ============================================================================
// GOALS FEATURE - TYPE DEFINITIONS
// ============================================================================

// ============================================================================
// ENUMS
// ============================================================================

export const GoalStatus = {
  DRAFT: 'DRAFT',
  PENDING_REVIEW: 'PENDING_REVIEW',
  CHANGES_REQUESTED: 'CHANGES_REQUESTED',
  APPROVED: 'APPROVED',
  IN_PROGRESS: 'IN_PROGRESS',
  ON_HOLD: 'ON_HOLD',
  BLOCKED: 'BLOCKED',
  COMPLETED: 'COMPLETED',
  ABANDONED: 'ABANDONED',
} as const;

export type GoalStatus = typeof GoalStatus[keyof typeof GoalStatus];

export const FrequencyType = {
  DAILY: 'DAILY',
  WEEKDAYS: 'WEEKDAYS',
  WEEKENDS: 'WEEKENDS',
  CUSTOM: 'CUSTOM',
} as const;

export type FrequencyType = typeof FrequencyType[keyof typeof FrequencyType];

export const MilestoneStatus = {
  PENDING: 'PENDING',
  ACTIVE: 'ACTIVE',
  COMPLETED: 'COMPLETED',
} as const;

export type MilestoneStatus = typeof MilestoneStatus[keyof typeof MilestoneStatus];

export const CadenceSessionStatus = {
  TO_DO: 'TO_DO',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  DUE: 'DUE',
  MISSED: 'MISSED',
  SKIPPED: 'SKIPPED',
} as const;

export type CadenceSessionStatus = typeof CadenceSessionStatus[keyof typeof CadenceSessionStatus];

export const CheckpointStatus = {
  PENDING: 'PENDING',
  READY_FOR_REVIEW: 'READY_FOR_REVIEW',
  REVIEW_IN_PROGRESS: 'REVIEW_IN_PROGRESS',
  NEEDS_ATTENTION: 'NEEDS_ATTENTION',
  PASSED: 'PASSED',
  FAILED: 'FAILED',
  SKIPPED: 'SKIPPED',
} as const;

export type CheckpointStatus = typeof CheckpointStatus[keyof typeof CheckpointStatus];

export const CheckpointTriggerType = {
  AFTER_DAYS: 'AFTER_DAYS',
  AFTER_MILESTONE: 'AFTER_MILESTONE',
  MANUAL: 'MANUAL',
} as const;

export type CheckpointTriggerType = typeof CheckpointTriggerType[keyof typeof CheckpointTriggerType];

export const CheckpointType = {
  MANUAL_REVIEW: 'MANUAL_REVIEW',
  AI_INTERVIEW: 'AI_INTERVIEW',
} as const;

export type CheckpointType = typeof CheckpointType[keyof typeof CheckpointType];

export const GoalReviewAction = {
  REQUESTED_CHANGES: 'REQUESTED_CHANGES',
  APPROVED: 'APPROVED',
  MODIFIED: 'MODIFIED',
  REJECTED: 'REJECTED',
} as const;

export type GoalReviewAction = typeof GoalReviewAction[keyof typeof GoalReviewAction];

// ============================================================================
// JSON TYPES
// ============================================================================

export interface FrequencyConfig {
  days?: number[]; // 0=Sunday, 1=Monday, etc.
  duration_minutes?: number;
  time?: string; // HH:MM format
}

export interface CheckpointTriggerConfig {
  after_days?: number;
  from_start?: boolean;
}

export interface ActionItem {
  task: string;
  duration_minutes?: number;
  priority?: 'HIGH' | 'MEDIUM' | 'LOW';
  resources?: string[];
}

export interface Attachment {
  type: 'video' | 'document' | 'link';
  url: string;
  name: string;
}

export interface GoalReviewChanges {
  milestones?: {
    added?: unknown[];
    removed?: string[];
    modified?: unknown[];
  };
  frequency?: {
    old?: FrequencyConfig;
    new?: FrequencyConfig;
  };
  [key: string]: unknown;
}

// ============================================================================
// DATABASE ENTITIES
// ============================================================================

export interface Goal {
  id: string;
  created_by: string;
  user_id: string;
  assigned_by: string | null;
  duplicated_from: string | null;
  template_id: string | null;
  title: string;
  description: string | null;
  total_duration_days: number | null;
  status: GoalStatus;
  start_date: string | null;
  target_end_date: string | null;
  actual_end_date: string | null;
  frequency_type: FrequencyType | null;
  frequency_config: FrequencyConfig | null;
  current_streak: number;
  longest_streak: number;
  total_sessions: number;
  completed_sessions: number;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_comments: string | null;
  is_public: boolean;
  duplication_count: number;
  created_at: string;
  updated_at: string;
}

export interface Milestone {
  id: string;
  goal_id: string;
  title: string;
  description: string | null;
  order_index: number;
  duration_days: number | null;
  estimated_sessions: number | null;
  status: MilestoneStatus;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CadenceSession {
  id: string;
  goal_id: string;
  milestone_id: string | null;
  session_index: number | null;
  title: string | null;
  description: string | null;
  scheduled_date: string | null;
  duration_minutes: number;
  status: CadenceSessionStatus;
  notes: string | null;
  summary_text: string | null;
  skip_reason: string | null;
  started_at: string | null;
  completed_at: string | null;
  calendar_event_id: string | null;
  is_auto_generated: boolean;
  goal?: Goal;
  created_at: string;
  updated_at: string;
}

export interface Checkpoint {
  id: string;
  goal_id: string;
  milestone_id: string | null;
  title: string;
  description: string | null;
  trigger_type: CheckpointTriggerType | null;
  trigger_config: CheckpointTriggerConfig | null;
  scheduled_date: string | null;
  type: CheckpointType;
  status: CheckpointStatus;
  assigned_reviewer_id: string | null;
  review_started_at: string | null;
  submitted_at: string | null;
  developer_notes: string | null;
  goal?: Goal;
  milestone?: Milestone;
  reviewer?: {
    id: string;
    full_name: string;
  };
  created_at: string;
  updated_at: string;
}

export interface Assessment {
  id: string;
  checkpoint_id: string;
  reviewer_id: string | null;
  passed: boolean;
  score: number | null;
  feedback_text: string | null;
  strengths: string | null;
  areas_for_improvement: string | null;
  action_items: ActionItem[] | null;
  attachments: Attachment[] | null;
  review_duration_minutes: number | null;
  reviewed_at: string;
  created_at: string;
  updated_at: string;
}

export interface GoalReview {
  id: string;
  goal_id: string;
  reviewer_id: string;
  action: GoalReviewAction;
  comments: string | null;
  changes_made: GoalReviewChanges | null;
  previous_status: GoalStatus;
  new_status: GoalStatus;
  created_at: string;
}

export interface GoalStreakHistory {
  id: string;
  goal_id: string;
  user_id: string;
  date: string;
  streak_count: number;
  sessions_completed_today: number;
  created_at: string;
}

export interface GoalTemplate {
  id: string;
  company_id: string | null;
  title: string;
  description: string | null;
  created_by: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// EXTENDED TYPES (For UI with joins)
// ============================================================================

export interface GoalWithDetails extends Goal {
  milestones?: Milestone[];
  creator?: {
    id: string;
    full_name: string;
  };
  assignee?: {
    id: string;
    full_name: string;
  };
  reviewer?: {
    id: string;
    full_name: string;
  };
  checkpoints?: Checkpoint[];
  active_sessions?: CadenceSession[];
}

export interface MilestoneWithSessions extends Milestone {
  sessions?: CadenceSession[];
}

export interface CheckpointWithAssessment extends Checkpoint {
  assessment?: Assessment;
  reviewer?: {
    id: string;
    full_name: string;
  };
}

export interface CheckpointWithDetails extends Checkpoint {
  goal?: GoalWithDetails;
  milestone?: Milestone;
  assessment?: Assessment;
  reviewer?: {
    id: string;
    full_name: string;
    email: string;
  };
}

// ============================================================================
// REQUEST/RESPONSE TYPES
// ============================================================================

export interface CreateGoalRequest {
  title: string;
  description?: string;
  template_id?: string;
  duplicated_from?: string;
}

export interface UpdateGoalRequest {
  title?: string;
  description?: string;
  frequency_type?: FrequencyType;
  frequency_config?: FrequencyConfig;
  is_public?: boolean;
}

export interface CreateMilestoneRequest {
  goal_id: string;
  title: string;
  description?: string;
  order_index: number;
  duration_days?: number;
}

export interface UpdateMilestoneRequest {
  title?: string;
  description?: string;
  order_index?: number;
  duration_days?: number;
}

export interface CreateSessionRequest {
  goal_id: string;
  milestone_id?: string;
  title?: string;
  description?: string;
  scheduled_date?: string;
  duration_minutes?: number;
}

export interface UpdateSessionRequest {
  status?: CadenceSessionStatus;
  summary_text?: string;
  skip_reason?: string;
  scheduled_date?: string;
}

export interface CreateCheckpointRequest {
  goal_id: string;
  milestone_id?: string;
  title: string;
  description?: string;
  trigger_type?: CheckpointTriggerType;
  trigger_config?: CheckpointTriggerConfig;
  scheduled_date?: string;
  type: CheckpointType;
  assigned_reviewer_id?: string;
}

export interface CreateAssessmentRequest {
  checkpoint_id: string;
  passed: boolean;
  score?: number;
  feedback_text?: string;
  strengths?: string;
  areas_for_improvement?: string;
  action_items?: ActionItem[];
  attachments?: Attachment[];
  review_duration_minutes?: number;
}

export interface SubmitGoalReviewRequest {
  goal_id: string;
  action: GoalReviewAction;
  comments?: string;
  changes_made?: GoalReviewChanges;
}

// ============================================================================
// QUERY FILTERS
// ============================================================================

export interface GoalsQueryFilters {
  user_id?: string;
  created_by?: string;
  status?: GoalStatus | GoalStatus[];
  is_public?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface SessionsQueryFilters {
  goal_id?: string;
  milestone_id?: string;
  status?: CadenceSessionStatus | CadenceSessionStatus[];
  scheduled_date?: string;
  scheduled_date_from?: string;
  scheduled_date_to?: string;
  limit?: number;
  offset?: number;
}

export interface CheckpointsQueryFilters {
  goal_id?: string;
  status?: CheckpointStatus | CheckpointStatus[];
  assigned_reviewer_id?: string;
  type?: CheckpointType;
  limit?: number;
  offset?: number;
}
