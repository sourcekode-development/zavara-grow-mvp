import { create } from 'zustand';
import type { AuthState, AuthUser, LoginCredentials } from '@/shared/types';
import * as authApi from '../apis/auth.api';

interface AuthStore extends AuthState {
  // Actions
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  checkSession: () => Promise<void>;
  setUser: (user: AuthUser | null) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  // Initial state
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  // Actions
  login: async (credentials) => {
    set({ isLoading: true, error: null });
    
    const response = await authApi.login(credentials);
    
    if (response.success && response.data) {
      set({
        user: response.data.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
      return { success: true };
    } else {
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: response.error || 'Login failed',
      });
      return { success: false, error: response.error };
    }
  },

  logout: async () => {
    set({ isLoading: true });
    
    await authApi.logout();
    
    set({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  },

  checkSession: async () => {
    set({ isLoading: true });
    
    const response = await authApi.getCurrentUser();
    
    if (response.success && response.data) {
      set({
        user: response.data.user,
        isAuthenticated: true,
        isLoading: false,
      });
    } else {
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  setUser: (user) => {
    set({ 
      user, 
      isAuthenticated: !!user,
      error: null,
    });
  },

  setLoading: (isLoading) => {
    set({ isLoading });
  },

  setError: (error) => {
    set({ error });
  },

  clearError: () => {
    set({ error: null });
  },
}));
