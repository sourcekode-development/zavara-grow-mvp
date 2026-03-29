import { Building2, FolderKanban, X } from 'lucide-react';
import { useNavigate } from 'react-router';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Separator } from '@/components/ui/separator';
import type { ClientWithStats, ProjectWithClient } from '../types';

interface ClientDetailDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: ClientWithStats | null;
  linkedProjects: ProjectWithClient[];
}

const projectKindLabels = {
  CLIENT_DELIVERY: 'Client Delivery',
  INTERNAL_PRODUCT: 'Internal Product',
  INTERNAL_INITIATIVE: 'Internal Initiative',
} as const;

export const ClientDetailDrawer = ({
  open,
  onOpenChange,
  client,
  linkedProjects,
}: ClientDetailDrawerProps) => {
  const navigate = useNavigate();

  if (!client) return null;

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="right">
      <DrawerContent className="!w-full !max-w-4xl overflow-y-auto p-6">
        <DrawerHeader className="flex flex-row items-start justify-between gap-4">
          <div className="flex-1">
            <DrawerTitle className="text-2xl">{client.name}</DrawerTitle>
            <p className="mt-2 text-sm text-muted-foreground">
              Review the client summary and quickly jump into linked delivery projects.
            </p>
          </div>
          <DrawerClose asChild>
            <Button variant="ghost" size="icon" className="shrink-0">
              <X className="h-4 w-4" />
            </Button>
          </DrawerClose>
        </DrawerHeader>

        <div className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-2">
            <Card className="bg-muted/40">
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <Building2 className="h-5 w-5 text-[#3DCF8E]" />
                  <div>
                    <p className="text-xs text-muted-foreground">Client Name</p>
                    <p className="text-lg font-semibold">{client.name}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-muted/40">
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <FolderKanban className="h-5 w-5 text-[#3DCF8E]" />
                  <div>
                    <p className="text-xs text-muted-foreground">Linked Projects</p>
                    <p className="text-lg font-semibold">{linkedProjects.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                {client.description || 'No description provided for this client yet.'}
              </p>
            </CardContent>
          </Card>

          <Separator />

          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold">Linked Projects</h3>
              <p className="text-sm text-muted-foreground">
                Every active and historical project currently associated with this client.
              </p>
            </div>

            {linkedProjects.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border/70 p-10 text-center text-sm text-muted-foreground">
                No projects are linked to this client yet.
              </div>
            ) : (
              <div className="space-y-3">
                {linkedProjects.map((project) => (
                  <Card key={project.id}>
                    <CardContent className="flex flex-col gap-4 py-5 md:flex-row md:items-start md:justify-between">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="font-semibold">{project.name}</h4>
                          <Badge variant="outline">
                            {projectKindLabels[project.project_kind]}
                          </Badge>
                          <Badge variant="secondary">
                            {project.status.replace('_', ' ')}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {project.description || 'No project description provided.'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {project.active_member_count} active members
                        </p>
                      </div>

                      <div className="flex shrink-0 justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            onOpenChange(false);
                            navigate(`/projects/${project.id}`);
                          }}
                        >
                          Open Project
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};
