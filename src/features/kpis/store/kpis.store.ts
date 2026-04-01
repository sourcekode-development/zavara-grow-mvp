import { create } from 'zustand';

interface KpiUiState {
  dimensionsSearch: string;
  metricsSearch: string;
  templatesSearch: string;
  claimsTab: 'submitted' | 'pending';
  setDimensionsSearch: (value: string) => void;
  setMetricsSearch: (value: string) => void;
  setTemplatesSearch: (value: string) => void;
  setClaimsTab: (value: 'submitted' | 'pending') => void;
}

export const useKpisStore = create<KpiUiState>((set) => ({
  dimensionsSearch: '',
  metricsSearch: '',
  templatesSearch: '',
  claimsTab: 'submitted',
  setDimensionsSearch: (value) => set({ dimensionsSearch: value }),
  setMetricsSearch: (value) => set({ metricsSearch: value }),
  setTemplatesSearch: (value) => set({ templatesSearch: value }),
  setClaimsTab: (value) => set({ claimsTab: value }),
}));
