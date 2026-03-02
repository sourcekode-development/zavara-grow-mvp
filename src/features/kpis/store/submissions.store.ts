import { create } from 'zustand';
import type { KpiMetricSubmissionWithDetails, KpiSubmissionFilters } from '../types';

interface SubmissionsState {
  submissions: KpiMetricSubmissionWithDetails[];
  isLoading: boolean;
  filters: KpiSubmissionFilters;
  selectedSubmission: KpiMetricSubmissionWithDetails | null;
  setSubmissions: (submissions: KpiMetricSubmissionWithDetails[]) => void;
  addSubmission: (submission: KpiMetricSubmissionWithDetails) => void;
  updateSubmission: (id: string, updates: Partial<KpiMetricSubmissionWithDetails>) => void;
  removeSubmission: (id: string) => void;
  setSelectedSubmission: (submission: KpiMetricSubmissionWithDetails | null) => void;
  setFilters: (filters: KpiSubmissionFilters) => void;
  setLoading: (loading: boolean) => void;
  reset: () => void;
}

const initialState = {
  submissions: [],
  isLoading: false,
  filters: {},
  selectedSubmission: null,
};

export const useSubmissionsStore = create<SubmissionsState>((set) => ({
  ...initialState,

  setSubmissions: (submissions) => set({ submissions }),

  addSubmission: (submission) =>
    set((state) => ({
      submissions: [submission, ...state.submissions],
    })),

  updateSubmission: (id, updates) =>
    set((state) => ({
      submissions: state.submissions.map((submission) =>
        submission.id === id ? { ...submission, ...updates } : submission
      ),
    })),

  removeSubmission: (id) =>
    set((state) => ({
      submissions: state.submissions.filter((submission) => submission.id !== id),
    })),

  setSelectedSubmission: (submission) => set({ selectedSubmission: submission }),

  setFilters: (filters) => set({ filters }),

  setLoading: (loading) => set({ isLoading: loading }),

  reset: () => set(initialState),
}));
