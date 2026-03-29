import type { ApiResponse, UserRole } from '@/shared/types';
import * as projectsRepo from '../repository/projects.repository';
import type {
  ClientWithStats,
  CreateClientRequest,
  CreateProjectMemberRequest,
  CreateProjectRequest,
  ProjectMemberWithProfile,
  ProjectWithClient,
  ProjectWithDetails,
  UpdateClientRequest,
  UpdateProjectMemberRequest,
  UpdateProjectRequest,
} from '../types';

const canManageProjects = (role: UserRole) =>
  role === 'COMPANY_ADMIN' || role === 'TEAM_LEAD';

const normalizeProject = (project: {
  client?: ProjectWithClient['client'];
  creator?: ProjectWithClient['creator'];
  project_members?: Array<{ id: string; left_at: string | null; removed_at: string | null }>;
} & Omit<ProjectWithClient, 'active_member_count' | 'total_member_count'>): ProjectWithClient => {
  const members = project.project_members || [];
  return {
    ...project,
    active_member_count: members.filter((member) => !member.left_at && !member.removed_at).length,
    total_member_count: members.length,
  };
};

const normalizeClient = (client: ClientWithStats): ClientWithStats => client;

const normalizeMember = (member: ProjectMemberWithProfile): ProjectMemberWithProfile => member;

export const getClients = async (
  companyId: string,
  role: UserRole
): Promise<ApiResponse<ClientWithStats[]>> => {
  try {
    if (!canManageProjects(role)) {
      return { success: false, error: 'You do not have permission to view clients' };
    }

    const clients = await projectsRepo.getClientsByCompany(companyId);
    return {
      success: true,
      data: clients.map((client) => normalizeClient(client as ClientWithStats)),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch clients',
    };
  }
};

export const createClient = async (
  payload: CreateClientRequest,
  userId: string,
  role: UserRole
): Promise<ApiResponse<ClientWithStats>> => {
  try {
    if (!canManageProjects(role)) {
      return { success: false, error: 'You do not have permission to create clients' };
    }

    const client = await projectsRepo.createClient({ ...payload, created_by: userId });
    return {
      success: true,
      data: normalizeClient({ ...(client as ClientWithStats), project_count: client.projects?.[0]?.count || 0 }),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create client',
    };
  }
};

export const updateClient = async (
  clientId: string,
  payload: UpdateClientRequest,
  role: UserRole
): Promise<ApiResponse<ClientWithStats>> => {
  try {
    if (!canManageProjects(role)) {
      return { success: false, error: 'You do not have permission to update clients' };
    }

    const client = await projectsRepo.updateClient(clientId, payload);
    return {
      success: true,
      data: normalizeClient({ ...(client as ClientWithStats), project_count: client.projects?.[0]?.count || 0 }),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update client',
    };
  }
};

export const getProjects = async (
  userId: string,
  companyId: string,
  role: UserRole
): Promise<ApiResponse<ProjectWithClient[]>> => {
  try {
    const rawProjects = canManageProjects(role)
      ? await projectsRepo.getProjectsByCompany(companyId)
      : await projectsRepo.getProjectsByUserMembership(userId);

    const projects = (Array.isArray(rawProjects) ? rawProjects : [])
      .map((entry) =>
        'project' in entry ? (Array.isArray(entry.project) ? entry.project[0] : entry.project) : entry
      )
      .filter((project): project is NonNullable<typeof project> => Boolean(project));

    const uniqueProjects = Array.from(
      new Map(projects.map((project) => [project.id, normalizeProject(project as never)])).values()
    );

    return { success: true, data: uniqueProjects };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch projects',
    };
  }
};

export const getProjectDetails = async (
  projectId: string,
  userId: string,
  companyId: string,
  role: UserRole
): Promise<ApiResponse<ProjectWithDetails>> => {
  try {
    const project = normalizeProject((await projectsRepo.getProjectById(projectId)) as never);

    if (project.company_id !== companyId) {
      return { success: false, error: 'This project does not belong to your company' };
    }

    const members = (await projectsRepo.getProjectMembers(projectId)).map((member) =>
      normalizeMember(member as ProjectMemberWithProfile)
    );

    const hasMembership = members.some((member) => member.user_id === userId);
    if (!canManageProjects(role) && !hasMembership) {
      return { success: false, error: 'You do not have access to this project' };
    }

    return {
      success: true,
      data: {
        ...project,
        active_members: members.filter((member) => !member.left_at && !member.removed_at),
        member_history: members.filter((member) => Boolean(member.left_at || member.removed_at)),
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch project details',
    };
  }
};

export const createProject = async (
  payload: CreateProjectRequest,
  userId: string,
  role: UserRole
): Promise<ApiResponse<ProjectWithClient>> => {
  try {
    if (!canManageProjects(role)) {
      return { success: false, error: 'You do not have permission to create projects' };
    }

    const project = await projectsRepo.createProject({ ...payload, created_by: userId });
    return { success: true, data: normalizeProject(project as never) };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create project',
    };
  }
};

export const updateProject = async (
  projectId: string,
  payload: UpdateProjectRequest,
  role: UserRole
): Promise<ApiResponse<ProjectWithClient>> => {
  try {
    if (!canManageProjects(role)) {
      return { success: false, error: 'You do not have permission to update projects' };
    }

    const project = await projectsRepo.updateProject(projectId, payload);
    return { success: true, data: normalizeProject(project as never) };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update project',
    };
  }
};

export const getAvailableUsers = async (
  companyId: string,
  projectId: string,
  role: UserRole
) => {
  try {
    if (!canManageProjects(role)) {
      return { success: false, error: 'You do not have permission to manage project members' };
    }

    const users = await projectsRepo.getAvailableUsersForProject(companyId, projectId);
    return { success: true, data: users };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch available users',
    };
  }
};

export const addProjectMember = async (
  payload: CreateProjectMemberRequest,
  userId: string,
  role: UserRole
): Promise<ApiResponse<ProjectMemberWithProfile>> => {
  try {
    if (!canManageProjects(role)) {
      return { success: false, error: 'You do not have permission to manage project members' };
    }

    const existingMember = await projectsRepo.getActiveProjectMemberByUser(payload.project_id, payload.user_id);
    if (existingMember) {
      return { success: false, error: 'This member is already assigned to the project' };
    }

    if (payload.is_primary_reviewer) {
      const activeReviewer = await projectsRepo.getActivePrimaryReviewer(payload.project_id);
      if (activeReviewer) {
        return { success: false, error: 'This project already has a primary reviewer' };
      }
    }

    const member = await projectsRepo.createProjectMember({ ...payload, assigned_by: userId });
    return { success: true, data: normalizeMember(member as ProjectMemberWithProfile) };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add project member',
    };
  }
};

export const updateProjectMember = async (
  projectId: string,
  projectMemberId: string,
  payload: UpdateProjectMemberRequest,
  role: UserRole
): Promise<ApiResponse<ProjectMemberWithProfile>> => {
  try {
    if (!canManageProjects(role)) {
      return { success: false, error: 'You do not have permission to manage project members' };
    }

    if (payload.is_primary_reviewer) {
      const activeReviewer = await projectsRepo.getActivePrimaryReviewer(projectId);
      if (activeReviewer && activeReviewer.id !== projectMemberId) {
        return { success: false, error: 'This project already has a primary reviewer' };
      }
    }

    const member = await projectsRepo.updateProjectMember(projectMemberId, payload);
    return { success: true, data: normalizeMember(member as ProjectMemberWithProfile) };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update project member',
    };
  }
};

export const removeProjectMember = async (
  projectId: string,
  projectMemberId: string,
  leftAt: string,
  userId: string,
  role: UserRole
): Promise<ApiResponse<ProjectMemberWithProfile>> => {
  try {
    if (!canManageProjects(role)) {
      return { success: false, error: 'You do not have permission to manage project members' };
    }

    const member = await projectsRepo.softRemoveProjectMember(projectMemberId, {
      left_at: leftAt,
      removed_at: new Date().toISOString(),
      removed_by: userId,
    });

    if (member.project_id !== projectId) {
      return { success: false, error: 'Project member not found for this project' };
    }

    return { success: true, data: normalizeMember(member as ProjectMemberWithProfile) };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to remove project member',
    };
  }
};
