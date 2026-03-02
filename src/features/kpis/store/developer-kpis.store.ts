import { create } from 'zustand';
import type { DeveloperKpiWithMetrics, DeveloperKpiFilters } from '../types';

interface DeveloperKpisState {
  developerKpis: DeveloperKpiWithMetrics[];
  isLoading: boolean;
  filters: DeveloperKpiFilters;
  selectedKpi: DeveloperKpiWithMetrics | null;
  setDeveloperKpis: (kpis: DeveloperKpiWithMetrics[]) => void;
  addDeveloperKpi: (kpi: DeveloperKpiWithMetrics) => void;
  updateDeveloperKpi: (id: string, updates: Partial<DeveloperKpiWithMetrics>) => void;
  removeDeveloperKpi: (id: string) => void;
  setSelectedKpi: (kpi: DeveloperKpiWithMetrics | null) => void;
  setFilters: (filters: DeveloperKpiFilters) => void;
  setLoading: (loading: boolean) => void;
  reset: () => void;
}

const initialState = {
  developerKpis: [],
  isLoading: false,
  filters: {},
  selectedKpi: null,
};

export const useDeveloperKpisStore = create<DeveloperKpisState>((set) => ({
  ...initialState,

  setDeveloperKpis: (developerKpis) => set({ developerKpis }),

  addDeveloperKpi: (kpi) =>
    set((state) => ({
      developerKpis: [kpi, ...state.developerKpis],
    })),

  updateDeveloperKpi: (id, updates) =>
    set((state) => ({
      developerKpis: state.developerKpis.map((kpi) =>
        kpi.id === id ? { ...kpi, ...updates } : kpi
      ),
    })),

  removeDeveloperKpi: (id) =>
    set((state) => ({
      developerKpis: state.developerKpis.filter((kpi) => kpi.id !== id),
    })),

  setSelectedKpi: (kpi) => set({ selectedKpi: kpi }),

  setFilters: (filters) => set({ filters }),

  setLoading: (loading) => set({ isLoading: loading }),

  reset: () => set(initialState),
}));
