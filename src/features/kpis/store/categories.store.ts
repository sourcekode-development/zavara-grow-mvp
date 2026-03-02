import { create } from 'zustand';
import type { KpiCategory, KpiCategoryFilters } from '../types';

interface CategoriesState {
  categories: KpiCategory[];
  isLoading: boolean;
  filters: KpiCategoryFilters;
  setCategories: (categories: KpiCategory[]) => void;
  addCategory: (category: KpiCategory) => void;
  updateCategory: (id: string, updates: Partial<KpiCategory>) => void;
  removeCategory: (id: string) => void;
  setFilters: (filters: KpiCategoryFilters) => void;
  setLoading: (loading: boolean) => void;
  reset: () => void;
}

const initialState = {
  categories: [],
  isLoading: false,
  filters: {},
};

export const useCategoriesStore = create<CategoriesState>((set) => ({
  ...initialState,

  setCategories: (categories) => set({ categories }),

  addCategory: (category) =>
    set((state) => ({
      categories: [category, ...state.categories],
    })),

  updateCategory: (id, updates) =>
    set((state) => ({
      categories: state.categories.map((cat) =>
        cat.id === id ? { ...cat, ...updates } : cat
      ),
    })),

  removeCategory: (id) =>
    set((state) => ({
      categories: state.categories.filter((cat) => cat.id !== id),
    })),

  setFilters: (filters) => set({ filters }),

  setLoading: (loading) => set({ isLoading: loading }),

  reset: () => set(initialState),
}));
