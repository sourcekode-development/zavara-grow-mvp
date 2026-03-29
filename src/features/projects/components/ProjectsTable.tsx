import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Spinner } from '@/components/ui/spinner';
import type { ProjectKind, ProjectStatus, ProjectWithClient } from '../types';

interface ProjectsTableProps {
  projects: ProjectWithClient[];
  isLoading: boolean;
  canManage: boolean;
  onViewProject: (projectId: string) => void;
  onEditProject?: (project: ProjectWithClient) => void;
}

const kindLabels: Record<ProjectKind, string> = {
  CLIENT_DELIVERY: 'Client Delivery',
  INTERNAL_PRODUCT: 'Internal Product',
  INTERNAL_INITIATIVE: 'Internal Initiative',
};

const statusClasses: Record<ProjectStatus, string> = {
  ACTIVE: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400',
  ON_HOLD: 'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400',
  COMPLETED: 'bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400',
  ARCHIVED: 'bg-slate-100 text-slate-700 dark:bg-slate-900/50 dark:text-slate-400',
};

export const ProjectsTable = ({
  projects,
  isLoading,
  canManage,
  onViewProject,
  onEditProject,
}: ProjectsTableProps) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border/70 p-12 text-center">
        <h3 className="text-lg font-semibold">No projects found</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          {canManage
            ? 'Create your first project to start assigning delivery ownership.'
            : 'You have not been assigned to any projects yet.'}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-background">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Project</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Members</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.map((project) => (
            <TableRow key={project.id}>
              <TableCell>
                <div>
                  <div className="font-medium">{project.name}</div>
                  {project.description ? (
                    <div className="mt-1 line-clamp-1 text-sm text-muted-foreground">
                      {project.description}
                    </div>
                  ) : null}
                </div>
              </TableCell>
              <TableCell>
                {project.client ? (
                  <Badge variant="outline">{project.client.name}</Badge>
                ) : (
                  <span className="text-sm text-muted-foreground">Internal</span>
                )}
              </TableCell>
              <TableCell>{kindLabels[project.project_kind]}</TableCell>
              <TableCell>
                <Badge variant="secondary" className={statusClasses[project.status]}>
                  {project.status.replace('_', ' ')}
                </Badge>
              </TableCell>
              <TableCell>{project.active_member_count}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => onViewProject(project.id)}>
                    View
                  </Button>
                  {canManage && onEditProject ? (
                    <Button variant="ghost" size="sm" onClick={() => onEditProject(project)}>
                      Edit
                    </Button>
                  ) : null}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
