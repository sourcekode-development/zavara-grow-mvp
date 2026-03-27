import type {
  DeveloperUpskillStats,
  UpskillContent,
  UpskillModuleEffortLog,
  UpskillModuleStatus,
  UpskillProgram,
  UpskillProgramReview,
  UpskillProgramStatus,
  UpskillProgramTemplate,
  UpskillReviewDecision,
  UpskillTemplateModule,
} from '@/shared/types';

export type {
  DeveloperUpskillStats,
  UpskillContent,
  UpskillModuleEffortLog,
  UpskillModuleStatus,
  UpskillProgram,
  UpskillProgramReview,
  UpskillProgramStatus,
  UpskillProgramTemplate,
  UpskillReviewDecision,
  UpskillTemplateModule,
};

export interface UpskillProgramModuleWithMetrics extends UpskillProgramModule {
  logged_effort: number;
  log_count: number;
  last_logged_on: string | null;
}

export interface UpskillProgramWithDetails extends UpskillProgram {
  creator?: {
    id: string;
    full_name: string;
    email?: string | null;
  };
  assignee?: {
    id: string;
    full_name: string;
    email?: string | null;
  };
  approver?: {
    id: string;
    full_name: string;
    email?: string | null;
  };
  template?: UpskillProgramTemplate | null;
  modules?: UpskillProgramModuleWithMetrics[];
  reviews?: Array<
    UpskillProgramReview & {
      reviewer?: {
        id: string;
        full_name: string;
        email?: string | null;
      };
    }
  >;
  effort_logs?: UpskillModuleEffortLog[];
  stats?: {
    total_logged_effort: number;
    completion_percentage: number;
    active_module_count: number;
  };
}

export interface UpskillProgramModule {
  id: string;
  program_id: string;
  template_module_id: string | null;
  order_index: number;
  title: string;
  description: string | null;
  effort: number | null;
  content: UpskillContent | null;
  content_plain_text: string | null;
  status: UpskillModuleStatus;
  created_at: string;
  updated_at: string;
}

export interface UpskillTemplateWithModules extends UpskillProgramTemplate {
  modules?: UpskillTemplateModule[];
  creator?: {
    id: string;
    full_name: string;
    email?: string | null;
  };
}

export interface UpskillProgramFilters {
  user_id?: string;
  company_id?: string;
  created_by?: string;
  reviewer_id?: string;
  status?: UpskillProgramStatus | UpskillProgramStatus[];
  search?: string;
  limit?: number;
}

export interface UpskillTemplateFilters {
  company_id?: string;
  search?: string;
  is_active?: boolean;
  limit?: number;
}

export interface CreateUpskillProgramRequest {
  title: string;
  description?: string;
  total_effort?: number;
  template_id?: string;
}

export interface UpdateUpskillProgramRequest {
  title?: string;
  description?: string;
  total_effort?: number | null;
  status?: UpskillProgramStatus;
}

export interface CreateUpskillModuleRequest {
  program_id: string;
  title: string;
  description?: string;
  effort?: number | null;
  content?: UpskillContent | null;
  order_index?: number;
}

export interface UpdateUpskillModuleRequest {
  title?: string;
  description?: string | null;
  effort?: number | null;
  content?: UpskillContent | null;
  order_index?: number;
  status?: UpskillModuleStatus;
}

export interface CreateUpskillTemplateRequest {
  title: string;
  description?: string;
  total_effort?: number | null;
  is_active?: boolean;
  is_published?: boolean;
  modules?: Array<{
    title: string;
    description?: string;
    effort?: number | null;
    content?: UpskillContent | null;
    order_index?: number;
  }>;
}

export type UpdateUpskillTemplateRequest = Partial<CreateUpskillTemplateRequest>;

export interface SubmitUpskillProgramReviewRequest {
  reviewer_ids: string[];
}

export interface RespondUpskillProgramReviewRequest {
  decision: Extract<
    UpskillReviewDecision,
    'APPROVED' | 'CHANGES_REQUESTED'
  >;
  comments?: string;
}

export interface RecordUpskillEffortLogRequest {
  effort_used: number;
  notes?: string;
  logged_on: string;
}

export interface UpskillEffortTrendPoint {
  date: string;
  effort: number;
}

export interface UpskillDashboardSummary {
  total_logged_effort: number;
  estimated_effort: number;
  completion_percentage: number;
  current_streak: number;
  longest_streak: number;
  module_completion_percentage: number;
}

export interface UpskillProgramDashboardData {
  summary: UpskillDashboardSummary;
  module_breakdown: Array<{
    module_id: string;
    title: string;
    estimated_effort: number;
    logged_effort: number;
    status: UpskillModuleStatus;
  }>;
  effort_trend: UpskillEffortTrendPoint[];
  log_frequency: Array<{
    date: string;
    logs: number;
  }>;
  recent_logs: Array<
    UpskillModuleEffortLog & {
      module_title?: string;
    }
  >;
}

export interface TeamMemberUpskillSnapshot {
  user_id: string;
  full_name: string;
  email?: string | null;
  active_programs: number;
  overall_current_streak: number;
  overall_longest_streak: number;
  total_logged_effort: number;
  total_logged_effort_last_7_days: number;
  total_logs: number;
  total_logs_last_7_days: number;
  latest_activity_date: string | null;
  active_program_details: Array<{
    program_id: string;
    title: string;
    status: UpskillProgramStatus;
    estimated_effort: number;
    completed_effort: number;
    logged_effort_last_7_days: number;
    logged_effort_previous_7_days: number;
    effort_growth_percentage: number;
    effort_completion_percentage: number;
    total_modules: number;
    completed_modules: number;
    completion_percentage: number;
    current_streak: number;
    total_logged_effort: number;
    total_logs: number;
    logs_last_7_days: number;
    logs_previous_7_days: number;
    active_days: number;
    last_activity_date: string | null;
  }>;
}

export interface TeamUpskillDashboardData {
  summary: {
    active_programs: number;
    active_learners: number;
    total_logged_effort: number;
    average_current_streak: number;
  };
  member_snapshots: TeamMemberUpskillSnapshot[];
  activity_trend: UpskillEffortTrendPoint[];
  log_frequency: Array<{
    date: string;
    logs: number;
  }>;
}
