import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { Plus, Search } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { ClientsTable } from '../components/ClientsTable';
import { ClientDetailDrawer } from '../components/ClientDetailDrawer';
import { ClientDrawer } from '../components/ClientDrawer';
import { ProjectDrawer } from '../components/ProjectDrawer';
import { ProjectsTable } from '../components/ProjectsTable';
import { useProjects } from '../hooks/useProjects';
import type { ClientWithStats, ProjectWithClient } from '../types';

export const ProjectsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const profile = user?.profile;
  const {
    projects,
    clients,
    isLoading,
    error,
    fetchProjects,
    fetchClients,
    createClient,
    updateClient,
    createProject,
    updateProject,
    clearError,
  } = useProjects();

  const [projectSearch, setProjectSearch] = useState('');
  const [clientSearch, setClientSearch] = useState('');
  const [clientDrawerOpen, setClientDrawerOpen] = useState(false);
  const [clientDetailDrawerOpen, setClientDetailDrawerOpen] = useState(false);
  const [projectDrawerOpen, setProjectDrawerOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<ClientWithStats | null>(null);
  const [selectedProject, setSelectedProject] = useState<ProjectWithClient | null>(null);

  const canManage = profile?.role === 'COMPANY_ADMIN' || profile?.role === 'TEAM_LEAD';

  useEffect(() => {
    if (!profile) return;

    fetchProjects(profile.id, profile.company_id, profile.role);
    if (canManage) {
      fetchClients(profile.company_id, profile.role);
    }
  }, [profile, canManage, fetchProjects, fetchClients]);

  const filteredProjects = useMemo(
    () =>
      projects.filter((project) => {
        const query = projectSearch.toLowerCase();
        return (
          project.name.toLowerCase().includes(query) ||
          project.client?.name.toLowerCase().includes(query) ||
          project.project_kind.toLowerCase().includes(query)
        );
      }),
    [projects, projectSearch]
  );

  const filteredClients = useMemo(
    () =>
      clients.filter((client) => client.name.toLowerCase().includes(clientSearch.toLowerCase())),
    [clients, clientSearch]
  );

  const selectedClientProjects = useMemo(
    () => projects.filter((project) => project.client_id === selectedClient?.id),
    [projects, selectedClient]
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground">
            Link developers to delivery work, internal products, and reviewer ownership.
          </p>
        </div>

        {canManage ? (
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setSelectedClient(null);
                setClientDrawerOpen(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              New Client
            </Button>
            <Button
              className="bg-[#3DCF8E] hover:bg-[#3DCF8E]/90"
              onClick={() => {
                setSelectedProject(null);
                setProjectDrawerOpen(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              New Project
            </Button>
          </div>
        ) : null}
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300">
          <div className="flex items-center justify-between gap-4">
            <span>{error}</span>
            <Button variant="ghost" size="sm" onClick={clearError}>
              Dismiss
            </Button>
          </div>
        </div>
      ) : null}

      <Tabs defaultValue="projects" className="gap-6">
        <TabsList className="w-full justify-start bg-white dark:bg-[#1A2633]">
          <TabsTrigger value="projects">Projects</TabsTrigger>
          {canManage ? <TabsTrigger value="clients">Clients</TabsTrigger> : null}
        </TabsList>

        <TabsContent value="projects" className="space-y-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={projectSearch}
              onChange={(event) => setProjectSearch(event.target.value)}
              className="pl-10"
              placeholder="Search projects, clients, or project type"
            />
          </div>

          <ProjectsTable
            projects={filteredProjects}
            isLoading={isLoading}
            canManage={canManage}
            onViewProject={(projectId) => navigate(`/projects/${projectId}`)}
            onEditProject={(project) => {
              setSelectedProject(project);
              setProjectDrawerOpen(true);
            }}
          />
        </TabsContent>

        {canManage ? (
          <TabsContent value="clients" className="space-y-4">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={clientSearch}
                onChange={(event) => setClientSearch(event.target.value)}
                className="pl-10"
                placeholder="Search clients"
              />
            </div>

            <ClientsTable
              clients={filteredClients}
              isLoading={isLoading}
              onViewClient={(client) => {
                setSelectedClient(client);
                setClientDetailDrawerOpen(true);
              }}
              onEditClient={(client) => {
                setSelectedClient(client);
                setClientDrawerOpen(true);
              }}
            />
          </TabsContent>
        ) : null}
      </Tabs>

      {profile ? (
        <>
          <ClientDrawer
            open={clientDrawerOpen}
            onOpenChange={setClientDrawerOpen}
            initialClient={selectedClient}
            companyId={profile.company_id}
            onSubmit={async (payload) => {
              const result = selectedClient
                ? await updateClient(selectedClient.id, payload, profile.role)
                : await createClient(payload as never, profile.id, profile.role);

              if (result.success) {
                toast.success(selectedClient ? 'Client updated' : 'Client created');
                fetchClients(profile.company_id, profile.role);
              } else if (result.error) {
                toast.error(result.error);
              }

              return result;
            }}
          />

          <ClientDetailDrawer
            open={clientDetailDrawerOpen}
            onOpenChange={setClientDetailDrawerOpen}
            client={selectedClient}
            linkedProjects={selectedClientProjects}
          />

          <ProjectDrawer
            open={projectDrawerOpen}
            onOpenChange={setProjectDrawerOpen}
            initialProject={selectedProject}
            clients={clients}
            companyId={profile.company_id}
            onSubmit={async (payload) => {
              const result = selectedProject
                ? await updateProject(selectedProject.id, payload, profile.role)
                : await createProject(payload as never, profile.id, profile.role);

              if (result.success) {
                toast.success(selectedProject ? 'Project updated' : 'Project created');
                fetchProjects(profile.id, profile.company_id, profile.role);
              } else if (result.error) {
                toast.error(result.error);
              }

              return result;
            }}
          />
        </>
      ) : null}
    </div>
  );
};
