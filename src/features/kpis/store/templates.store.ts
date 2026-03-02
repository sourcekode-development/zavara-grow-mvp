import { create } from 'zustand';
import type { KpiTemplateWithMetrics, KpiTemplateFilters } from '../types';

interface TemplatesState {
  templates: KpiTemplateWithMetrics[];
  isLoading: boolean;
  filters: KpiTemplateFilters;
  selectedTemplate: KpiTemplateWithMetrics | null;
  setTemplates: (templates: KpiTemplateWithMetrics[]) => void;
  addTemplate: (template: KpiTemplateWithMetrics) => void;
  updateTemplate: (id: string, updates: Partial<KpiTemplateWithMetrics>) => void;
  removeTemplate: (id: string) => void;
  setSelectedTemplate: (template: KpiTemplateWithMetrics | null) => void;
  setFilters: (filters: KpiTemplateFilters) => void;
  setLoading: (loading: boolean) => void;
  reset: () => void;
}

const initialState = {
  templates: [],
  isLoading: false,
  filters: {},
  selectedTemplate: null,
};

export const useTemplatesStore = create<TemplatesState>((set) => ({
  ...initialState,

  setTemplates: (templates) => set({ templates }),

  addTemplate: (template) =>
    set((state) => ({
      templates: [template, ...state.templates],
    })),

  updateTemplate: (id, updates) =>
    set((state) => ({
      templates: state.templates.map((tmpl) =>
        tmpl.id === id ? { ...tmpl, ...updates } : tmpl
      ),
    })),

  removeTemplate: (id) =>
    set((state) => ({
      templates: state.templates.filter((tmpl) => tmpl.id !== id),
    })),

  setSelectedTemplate: (template) => set({ selectedTemplate: template }),

  setFilters: (filters) => set({ filters }),

  setLoading: (loading) => set({ isLoading: loading }),

  reset: () => set(initialState),
}));
