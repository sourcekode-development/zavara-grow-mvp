import { create } from 'zustand';
import type {
  CreateUpskillModuleRequest,
  CreateUpskillProgramRequest,
  CreateUpskillTemplateRequest,
  RecordUpskillEffortLogRequest,
  RespondUpskillProgramReviewRequest,
  TeamUpskillDashboardData,
  UpdateUpskillModuleRequest,
  UpdateUpskillProgramRequest,
  UpdateUpskillTemplateRequest,
  UpskillProgramDashboardData,
  UpskillProgramFilters,
  UpskillProgramWithDetails,
  UpskillTemplateFilters,
  UpskillTemplateWithModules,
} from '../types';
import * as upskillApi from '../apis/upskill.api';

interface UpskillState {
  programs: UpskillProgramWithDetails[];
  currentProgram: UpskillProgramWithDetails | null;
  programDashboard: UpskillProgramDashboardData | null;
  templates: UpskillTemplateWithModules[];
  reviewQueue: Array<{
    id: string;
    reviewer_id: string;
    decision: string;
    program?: UpskillProgramWithDetails;
  }>;
  teamDashboard: TeamUpskillDashboardData | null;
  reviewers: Array<{ id: string; full_name: string; email?: string | null; role?: string }>;
  isLoading: boolean;
  error: string | null;
  fetchPrograms: (filters?: UpskillProgramFilters) => Promise<void>;
  fetchProgramById: (programId: string) => Promise<void>;
  fetchProgramDashboard: (programId: string) => Promise<void>;
  fetchTemplates: (filters?: UpskillTemplateFilters) => Promise<void>;
  fetchReviewQueue: (reviewerId: string) => Promise<void>;
  fetchTeamDashboard: (teamId: string) => Promise<void>;
  fetchReviewers: (companyId: string, excludeUserId?: string) => Promise<void>;
  createProgram: (
    userId: string,
    companyId: string,
    request: CreateUpskillProgramRequest
  ) => Promise<UpskillProgramWithDetails | null>;
  updateProgram: (
    programId: string,
    request: UpdateUpskillProgramRequest
  ) => Promise<UpskillProgramWithDetails | null>;
  startProgram: (programId: string) => Promise<UpskillProgramWithDetails | null>;
  completeProgram: (programId: string) => Promise<UpskillProgramWithDetails | null>;
  submitProgramForReview: (
    programId: string,
    reviewerIds: string[]
  ) => Promise<UpskillProgramWithDetails | null>;
  respondToReview: (
    reviewId: string,
    reviewerId: string,
    request: RespondUpskillProgramReviewRequest
  ) => Promise<UpskillProgramWithDetails | null>;
  createModule: (
    request: CreateUpskillModuleRequest
  ) => Promise<UpskillProgramWithDetails | null>;
  updateModule: (
    moduleId: string,
    request: UpdateUpskillModuleRequest
  ) => Promise<UpskillProgramWithDetails | null>;
  deleteModule: (moduleId: string) => Promise<UpskillProgramWithDetails | null>;
  recordEffortLog: (
    moduleId: string,
    userId: string,
    request: RecordUpskillEffortLogRequest
  ) => Promise<UpskillProgramWithDetails | null>;
  createTemplate: (
    userId: string,
    companyId: string,
    request: CreateUpskillTemplateRequest
  ) => Promise<void>;
  updateTemplate: (
    templateId: string,
    request: UpdateUpskillTemplateRequest
  ) => Promise<void>;
  deleteTemplate: (templateId: string) => Promise<boolean>;
  promoteProgramToTemplate: (
    programId: string,
    userId: string,
    companyId: string
  ) => Promise<void>;
  clearError: () => void;
}

export const useUpskillStore = create<UpskillState>((set, get) => ({
  programs: [],
  currentProgram: null,
  programDashboard: null,
  templates: [],
  reviewQueue: [],
  teamDashboard: null,
  reviewers: [],
  isLoading: false,
  error: null,

  fetchPrograms: async (filters) => {
    set({ isLoading: true, error: null });
    try {
      const programs = await upskillApi.getPrograms(filters);
      set({ programs, isLoading: false });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch programs',
      });
    }
  },

  fetchProgramById: async (programId) => {
    set({ isLoading: true, error: null });
    try {
      const currentProgram = await upskillApi.getProgramById(programId);
      set({ currentProgram, isLoading: false });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch program',
      });
    }
  },

  fetchProgramDashboard: async (programId) => {
    set({ isLoading: true, error: null });
    try {
      const programDashboard = await upskillApi.getProgramDashboard(programId);
      set({ programDashboard, isLoading: false });
    } catch (error) {
      set({
        isLoading: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to fetch program dashboard',
      });
    }
  },

  fetchTemplates: async (filters) => {
    set({ isLoading: true, error: null });
    try {
      const templates = await upskillApi.getTemplates(filters);
      set({ templates: templates as UpskillTemplateWithModules[], isLoading: false });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch templates',
      });
    }
  },

  fetchReviewQueue: async (reviewerId) => {
    set({ isLoading: true, error: null });
    try {
      const reviewQueue = await upskillApi.getReviewQueue(reviewerId);
      set({ reviewQueue, isLoading: false });
    } catch (error) {
      set({
        isLoading: false,
        error:
          error instanceof Error ? error.message : 'Failed to fetch review queue',
      });
    }
  },

  fetchTeamDashboard: async (teamId) => {
    set({ isLoading: true, error: null });
    try {
      const teamDashboard = await upskillApi.getTeamDashboard(teamId);
      set({ teamDashboard, isLoading: false });
    } catch (error) {
      set({
        isLoading: false,
        error:
          error instanceof Error ? error.message : 'Failed to fetch team dashboard',
      });
    }
  },

  fetchReviewers: async (companyId, excludeUserId) => {
    set({ isLoading: true, error: null });
    try {
      const reviewers = await upskillApi.getPotentialReviewers(companyId, excludeUserId);
      set({ reviewers, isLoading: false });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch reviewers',
      });
    }
  },

  createProgram: async (userId, companyId, request) => {
    set({ isLoading: true, error: null });
    try {
      const currentProgram = await upskillApi.createProgram(userId, companyId, request);
      set({ currentProgram, isLoading: false });
      return currentProgram;
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to create program',
      });
      return null;
    }
  },

  updateProgram: async (programId, request) => {
    set({ isLoading: true, error: null });
    try {
      const currentProgram = await upskillApi.updateProgram(programId, request);
      set({ currentProgram, isLoading: false });
      return currentProgram;
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to update program',
      });
      return null;
    }
  },

  startProgram: async (programId) => {
    set({ isLoading: true, error: null });
    try {
      const currentProgram = await upskillApi.startProgram(programId);
      set({ currentProgram, isLoading: false });
      return currentProgram;
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to start program',
      });
      return null;
    }
  },

  completeProgram: async (programId) => {
    set({ isLoading: true, error: null });
    try {
      const currentProgram = await upskillApi.completeProgram(programId);
      set({ currentProgram, isLoading: false });
      return currentProgram;
    } catch (error) {
      set({
        isLoading: false,
        error:
          error instanceof Error ? error.message : 'Failed to complete program',
      });
      return null;
    }
  },

  submitProgramForReview: async (programId, reviewerIds) => {
    set({ isLoading: true, error: null });
    try {
      const currentProgram = await upskillApi.submitProgramForReview(
        programId,
        reviewerIds
      );
      set({ currentProgram, isLoading: false });
      return currentProgram;
    } catch (error) {
      set({
        isLoading: false,
        error:
          error instanceof Error ? error.message : 'Failed to submit program',
      });
      return null;
    }
  },

  respondToReview: async (reviewId, reviewerId, request) => {
    set({ isLoading: true, error: null });
    try {
      const currentProgram = await upskillApi.respondToReview(
        reviewId,
        reviewerId,
        request
      );
      const currentQueue = get().reviewQueue.filter((review) => review.id !== reviewId);
      set({ currentProgram, reviewQueue: currentQueue, isLoading: false });
      return currentProgram;
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to respond to review',
      });
      return null;
    }
  },

  createModule: async (request) => {
    set({ isLoading: true, error: null });
    try {
      const currentProgram = await upskillApi.createModule(request);
      set({ currentProgram, isLoading: false });
      return currentProgram;
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to create module',
      });
      return null;
    }
  },

  updateModule: async (moduleId, request) => {
    set({ isLoading: true, error: null });
    try {
      const currentProgram = await upskillApi.updateModule(moduleId, request);
      set({ currentProgram, isLoading: false });
      return currentProgram;
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to update module',
      });
      return null;
    }
  },

  deleteModule: async (moduleId) => {
    set({ isLoading: true, error: null });
    try {
      const currentProgram = await upskillApi.deleteModule(moduleId);
      set({ currentProgram, isLoading: false });
      return currentProgram;
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to delete module',
      });
      return null;
    }
  },

  recordEffortLog: async (moduleId, userId, request) => {
    set({ isLoading: true, error: null });
    try {
      const currentProgram = await upskillApi.recordEffortLog(moduleId, userId, request);
      set({ currentProgram, isLoading: false });
      return currentProgram;
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to log effort',
      });
      return null;
    }
  },

  createTemplate: async (userId, companyId, request) => {
    set({ isLoading: true, error: null });
    try {
      await upskillApi.createTemplate(userId, companyId, request);
      set({ isLoading: false });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to create template',
      });
    }
  },

  updateTemplate: async (templateId, request) => {
    set({ isLoading: true, error: null });
    try {
      await upskillApi.updateTemplate(templateId, request);
      set({ isLoading: false });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to update template',
      });
    }
  },

  deleteTemplate: async (templateId) => {
    set({ isLoading: true, error: null });
    try {
      await upskillApi.deleteTemplate(templateId);
      set((state) => ({
        isLoading: false,
        templates: state.templates.filter((template) => template.id !== templateId),
      }));
      return true;
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to delete template',
      });
      return false;
    }
  },

  promoteProgramToTemplate: async (programId, userId, companyId) => {
    set({ isLoading: true, error: null });
    try {
      await upskillApi.promoteProgramToTemplate(programId, userId, companyId);
      set({ isLoading: false });
    } catch (error) {
      set({
        isLoading: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to create template from program',
      });
    }
  },

  clearError: () => set({ error: null }),
}));
