import { differenceInCalendarDays } from 'date-fns';
import type {
  DeveloperUpskillStats,
  UpskillModuleEffortLog,
  UpskillModuleStatus,
  UpskillProgram,
  UpskillProgramReview,
  UpskillReviewDecision,
} from '@/shared/types';
import { UPSKILL_STREAK_GRACE_DAYS } from '../constants/streak';
import * as upskillRepo from '../repository/upskill.repository';
import type {
  CreateUpskillModuleRequest,
  CreateUpskillProgramRequest,
  CreateUpskillTemplateRequest,
  RecordUpskillEffortLogRequest,
  RespondUpskillProgramReviewRequest,
  TeamMemberUpskillSnapshot,
  TeamUpskillDashboardData,
  UpdateUpskillModuleRequest,
  UpdateUpskillProgramRequest,
  UpdateUpskillTemplateRequest,
  UpskillDashboardSummary,
  UpskillProgramDashboardData,
  UpskillProgramFilters,
  UpskillProgramModule,
  UpskillProgramModuleWithMetrics,
  UpskillProgramWithDetails,
  UpskillTemplateFilters,
} from '../types';

const DONE_MODULE_STATUSES: UpskillModuleStatus[] = ['COMPLETED', 'WONT_DO'];

const getTodayIso = () => new Date().toISOString().split('T')[0];

const sumLoggedEffort = (
  logs: UpskillModuleEffortLog[],
  moduleId?: string
) => logs
  .filter((log) => !moduleId || log.module_id === moduleId)
  .reduce((sum, log) => sum + Number(log.effort_used || 0), 0);

const isModuleDone = (status: UpskillModuleStatus) =>
  DONE_MODULE_STATUSES.includes(status);

const calculateNextStreak = (
  lastActivityDate: string | null,
  currentStreak: number,
  longestStreak: number,
  activityDate: string
) => {
  if (!lastActivityDate) {
    return {
      current_streak: 1,
      longest_streak: Math.max(longestStreak, 1),
      last_activity_date: activityDate,
    };
  }

  const dayDifference = differenceInCalendarDays(
    new Date(activityDate),
    new Date(lastActivityDate)
  );

  if (dayDifference <= 0) {
    return {
      current_streak: currentStreak,
      longest_streak: longestStreak,
      last_activity_date: lastActivityDate,
    };
  }

  const nextCurrent =
    dayDifference <= UPSKILL_STREAK_GRACE_DAYS + 1 ? currentStreak + 1 : 1;

  return {
    current_streak: nextCurrent,
    longest_streak: Math.max(longestStreak, nextCurrent),
    last_activity_date: activityDate,
  };
};

const getEffectiveStreak = (
  currentStreak: number,
  lastActivityDate: string | null,
  referenceDate = getTodayIso()
) => {
  if (!lastActivityDate || currentStreak <= 0) {
    return 0;
  }

  const dayDifference = differenceInCalendarDays(
    new Date(referenceDate),
    new Date(lastActivityDate)
  );

  return dayDifference <= UPSKILL_STREAK_GRACE_DAYS + 1 ? currentStreak : 0;
};

const toModuleMetrics = (
  modules: UpskillProgramModule[],
  logs: UpskillModuleEffortLog[]
): UpskillProgramModuleWithMetrics[] =>
  modules.map((module) => {
    const moduleLogs = logs.filter((log) => log.module_id === module.id);
    return {
      ...module,
      logged_effort: sumLoggedEffort(moduleLogs),
      log_count: moduleLogs.length,
      last_logged_on: moduleLogs.length > 0 ? moduleLogs[0].logged_on : null,
    };
  });

const buildSummary = (
  program: UpskillProgram,
  modules: UpskillProgramModuleWithMetrics[],
  logs: UpskillModuleEffortLog[]
): UpskillDashboardSummary => {
  const estimatedEffort = Number(program.total_effort || 0);
  const totalLoggedEffort = sumLoggedEffort(logs);
  const completedModules = modules.filter((module) => isModuleDone(module.status)).length;

  return {
    total_logged_effort: totalLoggedEffort,
    estimated_effort: estimatedEffort,
    completion_percentage:
      estimatedEffort > 0
        ? Math.min(100, Math.round((totalLoggedEffort / estimatedEffort) * 100))
        : 0,
    current_streak: getEffectiveStreak(
      program.current_streak,
      program.last_activity_date
    ),
    longest_streak: program.longest_streak,
    module_completion_percentage:
      modules.length > 0
        ? Math.round((completedModules / modules.length) * 100)
        : 0,
  };
};

const aggregateEffortTrend = (logs: UpskillModuleEffortLog[]) => {
  const byDate = new Map<string, { effort: number; logs: number }>();

  logs
    .slice()
    .sort((a, b) => a.logged_on.localeCompare(b.logged_on))
    .forEach((log) => {
      const current = byDate.get(log.logged_on) || { effort: 0, logs: 0 };
      current.effort += Number(log.effort_used || 0);
      current.logs += 1;
      byDate.set(log.logged_on, current);
    });

  return Array.from(byDate.entries()).map(([date, values]) => ({
    date,
    effort: Number(values.effort.toFixed(2)),
    logs: values.logs,
  }));
};

const getLogsLastSevenDays = (logs: UpskillModuleEffortLog[]) => {
  const today = new Date(getTodayIso());

  return logs.filter((log) => {
    const dayDifference = differenceInCalendarDays(today, new Date(log.logged_on));
    return dayDifference >= 0 && dayDifference <= 6;
  }).length;
};

const getDistinctActiveDays = (logs: UpskillModuleEffortLog[]) =>
  new Set(logs.map((log) => log.logged_on)).size;

const syncProgramCounts = async (programId: string) => {
  const modules = await upskillRepo.fetchProgramModules(programId);
  const totalModules = modules.length;
  const completedModules = modules.filter((module) =>
    isModuleDone(module.status)
  ).length;

  const { data, error } = await upskillRepo.updateProgramStatus(programId, {
    total_modules: totalModules,
    completed_modules: completedModules,
  } as Partial<UpskillProgram>);

  if (error) {
    throw new Error(error.message);
  }

  return data as UpskillProgram;
};

const syncDeveloperStats = async (
  userId: string,
  companyId: string,
  activityDate?: string
) => {
  const existing =
    (await upskillRepo.fetchDeveloperStats(userId)) ||
    ({
      user_id: userId,
      company_id: companyId,
      current_streak: 0,
      longest_streak: 0,
      last_activity_date: null,
      total_programs_started: 0,
      total_programs_completed: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as DeveloperUpskillStats);

  const counts = await upskillRepo.fetchProgramCountsByUser(userId);

  const streakState = activityDate
    ? calculateNextStreak(
        existing.last_activity_date,
        existing.current_streak,
        existing.longest_streak,
        activityDate
      )
    : {
        current_streak: existing.current_streak,
        longest_streak: existing.longest_streak,
        last_activity_date: existing.last_activity_date,
      };

  const { data, error } = await upskillRepo.upsertDeveloperStats({
    ...existing,
    company_id: companyId,
    current_streak: streakState.current_streak,
    longest_streak: streakState.longest_streak,
    last_activity_date: streakState.last_activity_date,
    total_programs_started: counts.startedCount,
    total_programs_completed: counts.completedCount,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    throw new Error(error.message);
  }

  return data as DeveloperUpskillStats;
};

const autoCompleteProgramIfReady = async (programId: string) => {
  const { data, error } = await upskillRepo.fetchProgramById(programId);

  if (error) {
    throw new Error(error.message);
  }

  const program = data as unknown as UpskillProgramWithDetails;
  const modules = (program.modules || []) as UpskillProgramModule[];

  if (modules.length === 0) {
    return program;
  }

  const allDone = modules.every((module) => isModuleDone(module.status));
  if (!allDone || program.status === 'COMPLETED') {
    return program;
  }

  const { data: updatedProgram, error: updateError } =
    await upskillRepo.updateProgramStatus(programId, {
      status: 'COMPLETED',
      completed_at: new Date().toISOString(),
      total_modules: modules.length,
      completed_modules: modules.length,
    } as Partial<UpskillProgram>);

  if (updateError) {
    throw new Error(updateError.message);
  }

  await syncDeveloperStats(program.user_id, program.company_id);

  return updatedProgram as unknown as UpskillProgramWithDetails;
};

export const getPrograms = async (filters?: UpskillProgramFilters) => {
  const { data, error } = await upskillRepo.fetchPrograms(filters);

  if (error) {
    throw new Error(error.message);
  }

  return ((data || []) as unknown as UpskillProgramWithDetails[]).map((program) => {
    const modules = (program.modules || []) as UpskillProgramModule[];
    const completedModules = modules.filter((module) =>
      isModuleDone(module.status)
    ).length;
    return {
      ...program,
      total_modules: modules.length || program.total_modules || 0,
      completed_modules: completedModules || program.completed_modules || 0,
      stats: {
        total_logged_effort: 0,
        completion_percentage:
          Number(program.total_effort || 0) > 0
            ? Math.round(
                ((completedModules || 0) / Math.max(modules.length || 1, 1)) * 100
              )
            : 0,
        active_module_count: modules.filter((module) => module.status === 'IN_PROGRESS')
          .length,
      },
    };
  });
};

export const getProgramById = async (
  programId: string
): Promise<UpskillProgramWithDetails> => {
  const { data, error } = await upskillRepo.fetchProgramById(programId);

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error('Up skill program not found');
  }

  const program = data as unknown as UpskillProgramWithDetails;
  const modules = ((program.modules || []) as UpskillProgramModule[]).sort(
    (a, b) => a.order_index - b.order_index
  );
  const logs = ((program.effort_logs || []) as UpskillModuleEffortLog[]).sort(
    (a, b) =>
      b.logged_on.localeCompare(a.logged_on) ||
      b.created_at.localeCompare(a.created_at)
  );
  const modulesWithMetrics = toModuleMetrics(modules, logs);
  const summary = buildSummary(program, modulesWithMetrics, logs);

  return {
    ...program,
    modules: modulesWithMetrics,
    effort_logs: logs,
    stats: {
      total_logged_effort: summary.total_logged_effort,
      completion_percentage: summary.completion_percentage,
      active_module_count: modulesWithMetrics.filter(
        (module) => module.status === 'IN_PROGRESS'
      ).length,
    },
  };
};

export const getProgramDashboard = async (
  programId: string
): Promise<UpskillProgramDashboardData> => {
  const program = await getProgramById(programId);
  const modules = (program.modules || []) as UpskillProgramModuleWithMetrics[];
  const logs = (program.effort_logs || []) as UpskillModuleEffortLog[];
  const trend = aggregateEffortTrend(logs);

  return {
    summary: buildSummary(program, modules, logs),
    module_breakdown: modules.map((module) => ({
      module_id: module.id,
      title: module.title,
      estimated_effort: Number(module.effort || 0),
      logged_effort: Number(module.logged_effort || 0),
      status: module.status,
    })),
    effort_trend: trend.map((entry) => ({
      date: entry.date,
      effort: entry.effort,
    })),
    log_frequency: trend.map((entry) => ({
      date: entry.date,
      logs: entry.logs,
    })),
    recent_logs: logs.slice(0, 8).map((log) => ({
      ...log,
      module_title:
        modules.find((module) => module.id === log.module_id)?.title || 'Module',
    })),
  };
};

export const createProgram = async (
  userId: string,
  companyId: string,
  request: CreateUpskillProgramRequest
) => {
  if (!request.title.trim()) {
    throw new Error('Program title is required');
  }

  if (request.total_effort !== undefined && request.total_effort !== null && request.total_effort <= 0) {
    throw new Error('Estimated effort must be greater than 0');
  }

  const { data, error } = await upskillRepo.createProgram(userId, companyId, request);

  if (error) {
    throw new Error(error.message);
  }

  const program = data as UpskillProgram;

  if (request.template_id) {
    const templateModules = await upskillRepo.fetchTemplateModules(request.template_id);
    const { error: cloneError } = await upskillRepo.createProgramModules(
      templateModules.map((module) => ({
        program_id: program.id,
        title: module.title,
        description: module.description || undefined,
        effort: module.effort,
        content: module.content as { type: 'plain_text'; text: string } | null,
        order_index: module.order_index,
      }))
    );

    if (cloneError) {
      throw new Error(cloneError.message);
    }

    await syncProgramCounts(program.id);
  }

  return getProgramById(program.id);
};

export const updateProgram = async (
  programId: string,
  request: UpdateUpskillProgramRequest
) => {
  const existing = await getProgramById(programId);

  if (existing.status === 'COMPLETED') {
    throw new Error('Completed programs are read-only');
  }

  if (request.total_effort !== undefined && request.total_effort !== null && request.total_effort <= 0) {
    throw new Error('Estimated effort must be greater than 0');
  }

  const { error } = await upskillRepo.updateProgram(programId, request);

  if (error) {
    throw new Error(error.message);
  }

  return getProgramById(programId);
};

export const startProgram = async (programId: string) => {
  const existing = await getProgramById(programId);

  if (existing.status !== 'APPROVED') {
    throw new Error('Only approved programs can be started');
  }

  const startedAt = new Date().toISOString();
  const { error } = await upskillRepo.updateProgramStatus(programId, {
    status: 'IN_PROGRESS',
    started_at: existing.started_at || startedAt,
  } as Partial<UpskillProgram>);

  if (error) {
    throw new Error(error.message);
  }

  await syncDeveloperStats(existing.user_id, existing.company_id);

  return getProgramById(programId);
};

export const completeProgram = async (programId: string) => {
  const existing = await getProgramById(programId);
  const modules = (existing.modules || []) as UpskillProgramModuleWithMetrics[];

  if (modules.length === 0 || !modules.every((module) => isModuleDone(module.status))) {
    throw new Error('All modules must be completed or marked as wont do before completion');
  }

  const { error } = await upskillRepo.updateProgramStatus(programId, {
    status: 'COMPLETED',
    completed_at: new Date().toISOString(),
    total_modules: modules.length,
    completed_modules: modules.length,
  } as Partial<UpskillProgram>);

  if (error) {
    throw new Error(error.message);
  }

  await syncDeveloperStats(existing.user_id, existing.company_id);

  return getProgramById(programId);
};

export const getTemplates = async (filters?: UpskillTemplateFilters) => {
  const { data, error } = await upskillRepo.fetchTemplates(filters);

  if (error) {
    throw new Error(error.message);
  }

  return (data || []) as unknown as Array<{
    id: string;
    company_id: string;
    created_by: string;
    title: string;
    description: string | null;
    total_effort: number | null;
    is_active: boolean;
    is_published: boolean;
    created_at: string;
    updated_at: string;
    creator?: { id: string; full_name: string; email?: string | null };
    modules?: UpskillProgramModule[];
  }>;
};

export const createTemplate = async (
  userId: string,
  companyId: string,
  request: CreateUpskillTemplateRequest
) => {
  if (!request.title.trim()) {
    throw new Error('Template title is required');
  }

  const { data, error } = await upskillRepo.createTemplate(userId, companyId, request);

  if (error) {
    throw new Error(error.message);
  }

  const template = data as { id: string };

  if (request.modules && request.modules.length > 0) {
    const { error: modulesError } = await upskillRepo.replaceTemplateModules(
      template.id,
      request.modules
    );

    if (modulesError) {
      throw new Error(modulesError.message);
    }
  }

  const { data: refreshed, error: refreshedError } = await upskillRepo.fetchTemplateById(
    template.id
  );

  if (refreshedError) {
    throw new Error(refreshedError.message);
  }

  return refreshed;
};

export const updateTemplate = async (
  templateId: string,
  request: UpdateUpskillTemplateRequest
) => {
  const { error } = await upskillRepo.updateTemplate(templateId, request);

  if (error) {
    throw new Error(error.message);
  }

  if (request.modules) {
    const { error: modulesError } = await upskillRepo.replaceTemplateModules(
      templateId,
      request.modules
    );

    if (modulesError) {
      throw new Error(modulesError.message);
    }
  }

  const { data, error: refreshedError } = await upskillRepo.fetchTemplateById(
    templateId
  );

  if (refreshedError) {
    throw new Error(refreshedError.message);
  }

  return data;
};

export const promoteProgramToTemplate = async (
  programId: string,
  userId: string,
  companyId: string
) => {
  const program = await getProgramById(programId);
  const modules = (program.modules || []) as UpskillProgramModuleWithMetrics[];

  return createTemplate(userId, companyId, {
    title: program.title,
    description: program.description || undefined,
    total_effort: program.total_effort,
    is_active: true,
    is_published: true,
    modules: modules.map((module) => ({
      title: module.title,
      description: module.description || undefined,
      effort: module.effort,
      content: module.content,
      order_index: module.order_index,
    })),
  });
};

export const createModule = async (request: CreateUpskillModuleRequest) => {
  const program = await getProgramById(request.program_id);

  if (program.status === 'COMPLETED') {
    throw new Error('Completed programs are read-only');
  }

  const nextIndex =
    request.order_index ??
    ((program.modules || []) as UpskillProgramModuleWithMetrics[]).length;

  const { error } = await upskillRepo.createProgramModules([
    {
      ...request,
      order_index: nextIndex,
    },
  ]);

  if (error) {
    throw new Error(error.message);
  }

  await syncProgramCounts(request.program_id);
  return getProgramById(request.program_id);
};

export const updateModule = async (
  moduleId: string,
  request: UpdateUpskillModuleRequest
) => {
  const moduleLookup = await supabaseModuleToProgram(moduleId);
  const program = await getProgramById(moduleLookup.program_id);

  if (program.status === 'COMPLETED') {
    throw new Error('Completed programs are read-only');
  }

  const { error } = await upskillRepo.updateProgramModule(moduleId, request);

  if (error) {
    throw new Error(error.message);
  }

  await syncProgramCounts(moduleLookup.program_id);
  await autoCompleteProgramIfReady(moduleLookup.program_id);

  return getProgramById(moduleLookup.program_id);
};

export const deleteModule = async (moduleId: string) => {
  const moduleLookup = await supabaseModuleToProgram(moduleId);
  const program = await getProgramById(moduleLookup.program_id);

  if (program.status === 'COMPLETED') {
    throw new Error('Completed programs are read-only');
  }

  const { error } = await upskillRepo.deleteProgramModule(moduleId);

  if (error) {
    throw new Error(error.message);
  }

  await syncProgramCounts(moduleLookup.program_id);
  return getProgramById(moduleLookup.program_id);
};

const supabaseModuleToProgram = async (moduleId: string) => {
  const { data, error } = await upskillRepo.fetchProgramByIdForModule(moduleId);

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error('Up skill module not found');
  }

  return data;
};

export const submitProgramForReview = async (
  programId: string,
  reviewerIds: string[]
) => {
  const program = await getProgramById(programId);

  if (program.status !== 'DRAFT') {
    throw new Error('Only draft programs can be submitted for review');
  }

  const uniqueReviewerIds = Array.from(new Set(reviewerIds.filter(Boolean)));

  if (uniqueReviewerIds.length === 0) {
    throw new Error('Please choose at least one reviewer');
  }

  const nextReviewRound = (program.review_round || 0) + 1;

  const { error: updateError } = await upskillRepo.updateProgramStatus(programId, {
    status: 'PENDING_REVIEW',
    review_round: nextReviewRound,
  } as Partial<UpskillProgram>);

  if (updateError) {
    throw new Error(updateError.message);
  }

  const { error } = await upskillRepo.createProgramReviews(
    uniqueReviewerIds.map((reviewerId) => ({
      program_id: programId,
      review_round: nextReviewRound,
      reviewer_id: reviewerId,
    }))
  );

  if (error) {
    throw new Error(error.message);
  }

  return getProgramById(programId);
};

export const getReviewQueue = async (reviewerId: string) => {
  const { data, error } = await upskillRepo.fetchPendingReviewsForReviewer(reviewerId);

  if (error) {
    throw new Error(error.message);
  }

  return (data || []) as unknown as Array<
    UpskillProgramReview & {
      program?: UpskillProgramWithDetails;
    }
  >;
};

export const respondToReview = async (
  reviewId: string,
  reviewerId: string,
  request: RespondUpskillProgramReviewRequest
) => {
  const reviewLookup = await upskillRepo.fetchReviewById(reviewId);

  if (reviewLookup.error) {
    throw new Error(reviewLookup.error.message);
  }

  const review = reviewLookup.data as unknown as UpskillProgramReview;

  if (!review || review.reviewer_id !== reviewerId) {
    throw new Error('Review not found');
  }

  if (review.decision !== 'PENDING') {
    throw new Error('This review has already been handled');
  }

  const { error } = await upskillRepo.updateProgramReview(reviewId, request);

  if (error) {
    throw new Error(error.message);
  }

  const program = await getProgramById(review.program_id);

  if (request.decision === 'APPROVED') {
    const { error: programError } = await upskillRepo.updateProgramStatus(review.program_id, {
      status: 'APPROVED',
      approved_by: reviewerId,
      approved_at: new Date().toISOString(),
    } as Partial<UpskillProgram>);

    if (programError) {
      throw new Error(programError.message);
    }

    await upskillRepo.autoClosePendingReviews(
      review.program_id,
      review.review_round,
      review.id
    );
  } else {
    const sameRoundReviews = await upskillRepo.fetchReviewsByProgramRound(
      review.program_id,
      review.review_round
    );

    const hasApproval = sameRoundReviews.some(
      (item) =>
        (item as unknown as UpskillProgramReview).decision ===
        ('APPROVED' as UpskillReviewDecision)
    );

    if (!hasApproval) {
      const { error: programError } = await upskillRepo.updateProgramStatus(review.program_id, {
        status: 'DRAFT',
        approved_by: null,
        approved_at: null,
      } as Partial<UpskillProgram>);

      if (programError) {
        throw new Error(programError.message);
      }
    }
  }

  return getProgramById(program.id);
};

export const getPotentialReviewers = async (
  companyId: string,
  excludeUserId?: string
) => {
  return upskillRepo.fetchPotentialReviewers(companyId, excludeUserId);
};

export const recordEffortLog = async (
  moduleId: string,
  userId: string,
  request: RecordUpskillEffortLogRequest
) => {
  if (request.effort_used <= 0) {
    throw new Error('Effort used must be greater than 0');
  }

  const moduleLookup = await supabaseModuleToProgram(moduleId);
  const program = await getProgramById(moduleLookup.program_id);

  if (program.status !== 'IN_PROGRESS') {
    throw new Error('You can only log effort for programs in progress');
  }

  const { error } = await upskillRepo.createEffortLog({
    module_id: moduleId,
    program_id: program.id,
    user_id: userId,
    effort_used: request.effort_used,
    notes: request.notes || null,
    logged_on: request.logged_on,
  });

  if (error) {
    throw new Error(error.message);
  }

  const targetModule = (program.modules || []).find((module) => module.id === moduleId);
  if (targetModule && targetModule.status === 'TODO') {
    const { error: moduleUpdateError } = await upskillRepo.updateProgramModule(moduleId, {
      status: 'IN_PROGRESS',
    });

    if (moduleUpdateError) {
      throw new Error(moduleUpdateError.message);
    }
  }

  const nextProgramStreak = calculateNextStreak(
    program.last_activity_date,
    program.current_streak,
    program.longest_streak,
    request.logged_on
  );

  const { error: programError } = await upskillRepo.updateProgramStatus(program.id, {
    current_streak: nextProgramStreak.current_streak,
    longest_streak: nextProgramStreak.longest_streak,
    last_activity_date: nextProgramStreak.last_activity_date,
  } as Partial<UpskillProgram>);

  if (programError) {
    throw new Error(programError.message);
  }

  await syncDeveloperStats(userId, program.company_id, request.logged_on);

  return getProgramById(program.id);
};

export const getTeamDashboard = async (
  teamId: string
): Promise<TeamUpskillDashboardData> => {
  const teamMembers = await upskillRepo.fetchTeamMembers(teamId);

  const members = teamMembers.map((member) => ({
    user_id: member.user_id as string,
    full_name:
      (member.profile as { full_name?: string | null } | null)?.full_name ||
      'Unknown User',
    email:
      (member.profile as { email?: string | null } | null)?.email || null,
  }));

  const userIds = members.map((member) => member.user_id);
  const [programs, stats] = await Promise.all([
    upskillRepo.fetchProgramsByUserIds(userIds),
    upskillRepo.fetchDeveloperStatsByUserIds(userIds),
  ]);

  const statsByUserId = new Map(
    stats.map((stat) => [stat.user_id as string, stat as DeveloperUpskillStats])
  );

  const programList = programs as Array<
    UpskillProgram & {
      modules?: Array<{ id: string; status: UpskillModuleStatus; effort: number | null }>;
      effort_logs?: UpskillModuleEffortLog[];
    }
  >;

  const memberSnapshots: TeamMemberUpskillSnapshot[] = members.map((member) => {
    const memberPrograms = programList.filter((program) => program.user_id === member.user_id);
    const statsRow = statsByUserId.get(member.user_id);

    const activePrograms = memberPrograms.filter((program) =>
      ['APPROVED', 'IN_PROGRESS'].includes(program.status)
    );

    const totalLoggedEffort = memberPrograms.reduce(
      (sum, program) => sum + sumLoggedEffort(program.effort_logs || []),
      0
    );

    const latestActivityDate = memberPrograms
      .map((program) => program.last_activity_date)
      .filter(Boolean)
      .sort()
      .reverse()[0] || null;

    return {
      user_id: member.user_id,
      full_name: member.full_name,
      email: member.email,
      active_programs: activePrograms.length,
      overall_current_streak: getEffectiveStreak(
        statsRow?.current_streak || 0,
        statsRow?.last_activity_date || null
      ),
      overall_longest_streak: statsRow?.longest_streak || 0,
      total_logged_effort: Number(totalLoggedEffort.toFixed(2)),
      latest_activity_date: latestActivityDate,
      active_program_details: activePrograms.map((program) => {
        const modules = program.modules || [];
        const programLogs = program.effort_logs || [];
        const completedModules = modules.filter((module) =>
          isModuleDone(module.status)
        ).length;
        const estimatedEffort = Number(program.total_effort || 0);
        const completedEffort = Number(sumLoggedEffort(programLogs).toFixed(2));
        return {
          program_id: program.id,
          title: program.title,
          status: program.status,
          estimated_effort: estimatedEffort,
          completed_effort: completedEffort,
          effort_completion_percentage:
            estimatedEffort > 0
              ? Math.min(100, Math.round((completedEffort / estimatedEffort) * 100))
              : 0,
          total_modules: modules.length,
          completed_modules: completedModules,
          completion_percentage:
            modules.length > 0
              ? Math.round((completedModules / modules.length) * 100)
              : 0,
          current_streak: getEffectiveStreak(
            program.current_streak,
            program.last_activity_date
          ),
          total_logged_effort: completedEffort,
          total_logs: programLogs.length,
          logs_last_7_days: getLogsLastSevenDays(programLogs),
          active_days: getDistinctActiveDays(programLogs),
          last_activity_date: program.last_activity_date,
        };
      }),
    };
  });

  const allLogs = programList.flatMap((program) => program.effort_logs || []);
  const trend = aggregateEffortTrend(allLogs);
  const totalLoggedEffort = memberSnapshots.reduce(
    (sum, member) => sum + member.total_logged_effort,
    0
  );
  const activePrograms = memberSnapshots.reduce(
    (sum, member) => sum + member.active_programs,
    0
  );

  return {
    summary: {
      active_programs: activePrograms,
      active_learners: memberSnapshots.filter((member) => member.active_programs > 0).length,
      total_logged_effort: Number(totalLoggedEffort.toFixed(2)),
      average_current_streak:
        memberSnapshots.length > 0
          ? Math.round(
              memberSnapshots.reduce(
                (sum, member) => sum + member.overall_current_streak,
                0
              ) / memberSnapshots.length
            )
          : 0,
    },
    member_snapshots: memberSnapshots,
    activity_trend: trend.map((entry) => ({
      date: entry.date,
      effort: entry.effort,
    })),
    log_frequency: trend.map((entry) => ({
      date: entry.date,
      logs: entry.logs,
    })),
  };
};
