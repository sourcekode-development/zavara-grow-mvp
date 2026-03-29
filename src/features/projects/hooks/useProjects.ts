import { useProjectsStore } from '../store/projects.store';

export const useProjects = () => {
  const projects = useProjectsStore((state) => state.projects);
  const clients = useProjectsStore((state) => state.clients);
  const currentProject = useProjectsStore((state) => state.currentProject);
  const availableUsers = useProjectsStore((state) => state.availableUsers);
  const isLoading = useProjectsStore((state) => state.isLoading);
  const error = useProjectsStore((state) => state.error);

  const fetchProjects = useProjectsStore((state) => state.fetchProjects);
  const fetchClients = useProjectsStore((state) => state.fetchClients);
  const fetchProjectDetails = useProjectsStore((state) => state.fetchProjectDetails);
  const fetchAvailableUsers = useProjectsStore((state) => state.fetchAvailableUsers);
  const createClient = useProjectsStore((state) => state.createClient);
  const updateClient = useProjectsStore((state) => state.updateClient);
  const createProject = useProjectsStore((state) => state.createProject);
  const updateProject = useProjectsStore((state) => state.updateProject);
  const addProjectMember = useProjectsStore((state) => state.addProjectMember);
  const updateProjectMember = useProjectsStore((state) => state.updateProjectMember);
  const removeProjectMember = useProjectsStore((state) => state.removeProjectMember);
  const clearError = useProjectsStore((state) => state.clearError);

  return {
    projects,
    clients,
    currentProject,
    availableUsers,
    isLoading,
    error,
    fetchProjects,
    fetchClients,
    fetchProjectDetails,
    fetchAvailableUsers,
    createClient,
    updateClient,
    createProject,
    updateProject,
    addProjectMember,
    updateProjectMember,
    removeProjectMember,
    clearError,
  };
};
