import { useEffect, useState } from 'react';
import * as upskillApi from '../apis/upskill.api';
import { useUpskillStore } from '../store/upskill.store';
import type {
  UpskillProgramFilters,
  UpskillProgramWithDetails,
  UpskillTemplateFilters,
} from '../types';

export const useUpskillPrograms = (filters?: UpskillProgramFilters) => {
  const { programs, isLoading, error, fetchPrograms, clearError } = useUpskillStore();

  useEffect(() => {
    fetchPrograms(filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters?.user_id, filters?.company_id, filters?.search, JSON.stringify(filters?.status)]);

  return {
    programs,
    isLoading,
    error,
    clearError,
    refetch: () => fetchPrograms(filters),
  };
};

export const useUpskillProgram = (programId?: string) => {
  const {
    currentProgram,
    programDashboard,
    isLoading,
    error,
    fetchProgramById,
    fetchProgramDashboard,
    clearError,
  } = useUpskillStore();

  useEffect(() => {
    if (!programId) return;
    fetchProgramById(programId);
    fetchProgramDashboard(programId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [programId]);

  return {
    program: currentProgram,
    dashboard: programDashboard,
    isLoading,
    error,
    clearError,
    refetch: async () => {
      if (!programId) return;
      await fetchProgramById(programId);
      await fetchProgramDashboard(programId);
    },
  };
};

export const useUpskillProgramDetails = (programId?: string) => {
  const [program, setProgram] = useState<UpskillProgramWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProgramDetails = async (id: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const nextProgram = await upskillApi.getProgramById(id);
      setProgram(nextProgram);
    } catch (fetchError) {
      setError(
        fetchError instanceof Error ? fetchError.message : 'Failed to fetch program'
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!programId) {
      setProgram(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    void fetchProgramDetails(programId);
  }, [programId]);

  return {
    program,
    isLoading,
    error,
    clearError: () => setError(null),
    refetch: () => programId && fetchProgramDetails(programId),
  };
};

export const useUpskillTemplates = (filters?: UpskillTemplateFilters) => {
  const { templates, isLoading, error, fetchTemplates, clearError } = useUpskillStore();

  useEffect(() => {
    fetchTemplates(filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters?.company_id, filters?.search, filters?.is_active]);

  return {
    templates,
    isLoading,
    error,
    clearError,
    refetch: () => fetchTemplates(filters),
  };
};

export const useUpskillReviewQueue = (reviewerId?: string) => {
  const { reviewQueue, isLoading, error, fetchReviewQueue, clearError } = useUpskillStore();

  useEffect(() => {
    if (reviewerId) {
      fetchReviewQueue(reviewerId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reviewerId]);

  return {
    reviewQueue,
    isLoading,
    error,
    clearError,
    refetch: () => reviewerId && fetchReviewQueue(reviewerId),
  };
};

export const useUpskillTeamDashboard = (teamId?: string) => {
  const { teamDashboard, isLoading, error, fetchTeamDashboard, clearError } = useUpskillStore();

  useEffect(() => {
    if (teamId) {
      fetchTeamDashboard(teamId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId]);

  return {
    teamDashboard,
    isLoading,
    error,
    clearError,
    refetch: () => teamId && fetchTeamDashboard(teamId),
  };
};

export const useUpskillActions = () => {
  const store = useUpskillStore();

  return {
    isLoading: store.isLoading,
    error: store.error,
    clearError: store.clearError,
    fetchReviewers: store.fetchReviewers,
    createProgram: store.createProgram,
    updateProgram: store.updateProgram,
    startProgram: store.startProgram,
    completeProgram: store.completeProgram,
    submitProgramForReview: store.submitProgramForReview,
    respondToReview: store.respondToReview,
    createModule: store.createModule,
    updateModule: store.updateModule,
    deleteModule: store.deleteModule,
    recordEffortLog: store.recordEffortLog,
    createTemplate: store.createTemplate,
    updateTemplate: store.updateTemplate,
    deleteTemplate: store.deleteTemplate,
    promoteProgramToTemplate: store.promoteProgramToTemplate,
  };
};
