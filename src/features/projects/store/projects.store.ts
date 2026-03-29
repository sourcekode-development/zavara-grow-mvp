import { create } from 'zustand';
import type { UserRole } from '@/shared/types';
import * as projectsApi from '../apis/projects.api';
import type {
  ClientWithStats,
  CreateClientRequest,
  CreateProjectMemberRequest,
  CreateProjectRequest,
  ProjectsState,
  ProjectWithClient,
  UpdateClientRequest,
  UpdateProjectMemberRequest,
  UpdateProjectRequest,
} from '../types';

interface ProjectsStore extends ProjectsState {
  fetchProjects: (userId: string, companyId: string, role: UserRole) => Promise<void>;
  fetchClients: (companyId: string, role: UserRole) => Promise<void>;
  fetchProjectDetails: (
    projectId: string,
    userId: string,
    companyId: string,
    role: UserRole
  ) => Promise<void>;
  fetchAvailableUsers: (companyId: string, projectId: string, role: UserRole) => Promise<void>;
  createClient: (
    payload: CreateClientRequest,
    userId: string,
    role: UserRole
  ) => Promise<{ success: boolean; error?: string; data?: ClientWithStats }>;
  updateClient: (
    clientId: string,
    payload: UpdateClientRequest,
    role: UserRole
  ) => Promise<{ success: boolean; error?: string; data?: ClientWithStats }>;
  createProject: (
    payload: CreateProjectRequest,
    userId: string,
    role: UserRole
  ) => Promise<{ success: boolean; error?: string; data?: ProjectWithClient }>;
  updateProject: (
    projectId: string,
    payload: UpdateProjectRequest,
    role: UserRole
  ) => Promise<{ success: boolean; error?: string; data?: ProjectWithClient }>;
  addProjectMember: (
    payload: CreateProjectMemberRequest,
    userId: string,
    role: UserRole
  ) => Promise<{ success: boolean; error?: string }>;
  updateProjectMember: (
    projectId: string,
    projectMemberId: string,
    payload: UpdateProjectMemberRequest,
    role: UserRole
  ) => Promise<{ success: boolean; error?: string }>;
  removeProjectMember: (
    projectId: string,
    projectMemberId: string,
    leftAt: string,
    userId: string,
    role: UserRole
  ) => Promise<{ success: boolean; error?: string }>;
  clearError: () => void;
}

const replaceProjectInList = (
  projects: ProjectWithClient[],
  nextProject: ProjectWithClient
) => {
  const existing = projects.some((project) => project.id === nextProject.id);
  if (!existing) {
    return [nextProject, ...projects];
  }

  return projects.map((project) =>
    project.id === nextProject.id ? nextProject : project
  );
};

export const useProjectsStore = create<ProjectsStore>((set) => ({
  projects: [],
  clients: [],
  currentProject: null,
  availableUsers: [],
  isLoading: false,
  error: null,

  fetchProjects: async (userId, companyId, role) => {
    set({ isLoading: true, error: null });
    const response = await projectsApi.getProjects(userId, companyId, role);

    if (response.success && response.data) {
      set({ projects: response.data, isLoading: false });
      return;
    }

    set({ error: response.error || 'Failed to fetch projects', isLoading: false });
  },

  fetchClients: async (companyId, role) => {
    set({ isLoading: true, error: null });
    const response = await projectsApi.getClients(companyId, role);

    if (response.success && response.data) {
      set({ clients: response.data, isLoading: false });
      return;
    }

    set({ error: response.error || 'Failed to fetch clients', isLoading: false });
  },

  fetchProjectDetails: async (projectId, userId, companyId, role) => {
    set({ isLoading: true, error: null });
    const response = await projectsApi.getProjectDetails(projectId, userId, companyId, role);

    if (response.success && response.data) {
      set({
        currentProject: response.data,
        projects: replaceProjectInList(useProjectsStore.getState().projects, response.data),
        isLoading: false,
      });
      return;
    }

    set({ error: response.error || 'Failed to fetch project details', isLoading: false });
  },

  fetchAvailableUsers: async (companyId, projectId, role) => {
    const response = await projectsApi.getAvailableUsers(companyId, projectId, role);

    if (response.success && response.data) {
      set({ availableUsers: response.data });
      return;
    }

    set({ error: response.error || 'Failed to fetch available users' });
  },

  createClient: async (payload, userId, role) => {
    set({ isLoading: true, error: null });
    const response = await projectsApi.createClient(payload, userId, role);

    if (response.success && response.data) {
      set((state) => ({
        clients: [response.data!, ...state.clients],
        isLoading: false,
      }));
      return { success: true, data: response.data };
    }

    set({ error: response.error || 'Failed to create client', isLoading: false });
    return { success: false, error: response.error };
  },

  updateClient: async (clientId, payload, role) => {
    set({ isLoading: true, error: null });
    const response = await projectsApi.updateClient(clientId, payload, role);

    if (response.success && response.data) {
      set((state) => ({
        clients: state.clients.map((client) =>
          client.id === clientId ? response.data! : client
        ),
        isLoading: false,
      }));
      return { success: true, data: response.data };
    }

    set({ error: response.error || 'Failed to update client', isLoading: false });
    return { success: false, error: response.error };
  },

  createProject: async (payload, userId, role) => {
    set({ isLoading: true, error: null });
    const response = await projectsApi.createProject(payload, userId, role);

    if (response.success && response.data) {
      set((state) => ({
        projects: [response.data!, ...state.projects],
        isLoading: false,
      }));
      return { success: true, data: response.data };
    }

    set({ error: response.error || 'Failed to create project', isLoading: false });
    return { success: false, error: response.error };
  },

  updateProject: async (projectId, payload, role) => {
    set({ isLoading: true, error: null });
    const response = await projectsApi.updateProject(projectId, payload, role);

    if (response.success && response.data) {
      set((state) => ({
        projects: replaceProjectInList(state.projects, response.data!),
        currentProject:
          state.currentProject?.id === projectId
            ? { ...state.currentProject, ...response.data! }
            : state.currentProject,
        isLoading: false,
      }));
      return { success: true, data: response.data };
    }

    set({ error: response.error || 'Failed to update project', isLoading: false });
    return { success: false, error: response.error };
  },

  addProjectMember: async (payload, userId, role) => {
    set({ isLoading: true, error: null });
    const response = await projectsApi.addProjectMember(payload, userId, role);

    if (response.success && response.data) {
      set((state) => ({
        currentProject: state.currentProject
          ? {
              ...state.currentProject,
              active_members: [response.data!, ...state.currentProject.active_members],
              total_member_count: state.currentProject.total_member_count + 1,
              active_member_count: state.currentProject.active_member_count + 1,
            }
          : state.currentProject,
        availableUsers: state.availableUsers.filter((user) => user.id !== payload.user_id),
        isLoading: false,
      }));
      return { success: true };
    }

    set({ error: response.error || 'Failed to add project member', isLoading: false });
    return { success: false, error: response.error };
  },

  updateProjectMember: async (projectId, projectMemberId, payload, role) => {
    set({ isLoading: true, error: null });
    const response = await projectsApi.updateProjectMember(projectId, projectMemberId, payload, role);

    if (response.success && response.data) {
      set((state) => {
        if (!state.currentProject) {
          return { isLoading: false };
        }

        const existingMember = state.currentProject.active_members.find(
          (member) => member.id === projectMemberId
        ) || state.currentProject.member_history.find((member) => member.id === projectMemberId);

        const wasActive = Boolean(existingMember && !existingMember.left_at && !existingMember.removed_at);
        const isActive = !response.data!.left_at && !response.data!.removed_at;

        const nextActiveMembers = state.currentProject.active_members
          .filter((member) => member.id !== projectMemberId)
          .concat(isActive ? [response.data!] : []);

        const nextHistory = state.currentProject.member_history
          .filter((member) => member.id !== projectMemberId)
          .concat(isActive ? [] : [response.data!]);

        return {
          currentProject: {
            ...state.currentProject,
            active_members: nextActiveMembers.sort((a, b) => a.joined_at < b.joined_at ? 1 : -1),
            member_history: nextHistory.sort((a, b) => a.joined_at < b.joined_at ? 1 : -1),
            active_member_count:
              state.currentProject.active_member_count + (Number(isActive) - Number(wasActive)),
          },
          isLoading: false,
        };
      });
      return { success: true };
    }

    set({ error: response.error || 'Failed to update project member', isLoading: false });
    return { success: false, error: response.error };
  },

  removeProjectMember: async (projectId, projectMemberId, leftAt, userId, role) => {
    set({ isLoading: true, error: null });
    const response = await projectsApi.removeProjectMember(projectId, projectMemberId, leftAt, userId, role);

    if (response.success && response.data) {
      set((state) => {
        if (!state.currentProject) {
          return { isLoading: false };
        }

        return {
          currentProject: {
            ...state.currentProject,
            active_members: state.currentProject.active_members.filter(
              (member) => member.id !== projectMemberId
            ),
            member_history: [response.data!, ...state.currentProject.member_history.filter(
              (member) => member.id !== projectMemberId
            )],
            active_member_count: Math.max(0, state.currentProject.active_member_count - 1),
          },
          isLoading: false,
        };
      });
      return { success: true };
    }

    set({ error: response.error || 'Failed to remove project member', isLoading: false });
    return { success: false, error: response.error };
  },

  clearError: () => set({ error: null }),
}));
