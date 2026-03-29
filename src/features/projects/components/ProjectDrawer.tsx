import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Spinner } from '@/components/ui/spinner';
import type {
  ClientWithStats,
  CreateProjectRequest,
  ProjectKind,
  ProjectStatus,
  ProjectWithClient,
  UpdateProjectRequest,
} from '../types';

const projectKindOptions: Array<{ label: string; value: ProjectKind }> = [
  { label: 'Client Delivery', value: 'CLIENT_DELIVERY' },
  { label: 'Internal Product', value: 'INTERNAL_PRODUCT' },
  { label: 'Internal Initiative', value: 'INTERNAL_INITIATIVE' },
];

const projectStatusOptions: Array<{ label: string; value: ProjectStatus }> = [
  { label: 'Active', value: 'ACTIVE' },
  { label: 'On Hold', value: 'ON_HOLD' },
  { label: 'Completed', value: 'COMPLETED' },
  { label: 'Archived', value: 'ARCHIVED' },
];

interface ProjectDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialProject?: ProjectWithClient | null;
  clients: ClientWithStats[];
  companyId: string;
  onSubmit: (
    payload: CreateProjectRequest | UpdateProjectRequest
  ) => Promise<{ success: boolean; error?: string }>;
}

export const ProjectDrawer = ({
  open,
  onOpenChange,
  initialProject,
  clients,
  companyId,
  onSubmit,
}: ProjectDrawerProps) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [clientId, setClientId] = useState<string>('none');
  const [projectKind, setProjectKind] = useState<ProjectKind>('CLIENT_DELIVERY');
  const [status, setStatus] = useState<ProjectStatus>('ACTIVE');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setName(initialProject?.name || '');
    setDescription(initialProject?.description || '');
    setClientId(initialProject?.client_id || 'none');
    setProjectKind(initialProject?.project_kind || 'CLIENT_DELIVERY');
    setStatus(initialProject?.status || 'ACTIVE');
    setError(null);
  }, [initialProject, open]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('Project name is required');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const payload = initialProject
      ? {
          name: name.trim(),
          description: description.trim() || null,
          client_id: clientId === 'none' ? null : clientId,
          project_kind: projectKind,
          status,
        }
      : {
          company_id: companyId,
          name: name.trim(),
          description: description.trim() || undefined,
          client_id: clientId === 'none' ? null : clientId,
          project_kind: projectKind,
          status,
        };

    const response = await onSubmit(payload);
    setIsSubmitting(false);

    if (response.success) {
      onOpenChange(false);
      return;
    }

    setError(response.error || 'Unable to save project');
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="right">
      <DrawerContent className="!w-full !max-w-3xl overflow-y-auto p-6">
        <DrawerHeader className="flex flex-row items-start justify-between gap-4">
          <div className="space-y-2">
            <DrawerTitle className="text-2xl">
              {initialProject ? 'Edit Project' : 'Create Project'}
            </DrawerTitle>
            <p className="text-sm text-muted-foreground">
              Track client delivery work, internal products, and internal initiatives in one place.
            </p>
          </div>
          <DrawerClose asChild>
            <Button variant="ghost" size="icon">
              <X className="h-4 w-4" />
            </Button>
          </DrawerClose>
        </DrawerHeader>

        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="project-name">Project Name</Label>
              <Input
                id="project-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="e.g. Healthcare Portal Revamp"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="project-client">Client</Label>
              <Select value={clientId} onValueChange={setClientId}>
                <SelectTrigger id="project-client">
                  <SelectValue placeholder="Select an optional client" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No client / internal project</SelectItem>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="project-kind">Project Type</Label>
              <Select
                value={projectKind}
                onValueChange={(value) => setProjectKind(value as ProjectKind)}
              >
                <SelectTrigger id="project-kind">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {projectKindOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="project-status">Status</Label>
              <Select value={status} onValueChange={(value) => setStatus(value as ProjectStatus)}>
                <SelectTrigger id="project-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {projectStatusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="project-description">Description</Label>
            <Textarea
              id="project-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Capture delivery context, domain, or anything reviewers should know."
              rows={5}
            />
          </div>

          {error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300">
              {error}
            </div>
          ) : null}
        </div>

        <DrawerFooter>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-[#3DCF8E] text-white hover:bg-[#2fb577]"
            >
              {isSubmitting ? (
                <>
                  <Spinner className="mr-2" />
                  Saving...
                </>
              ) : initialProject ? (
                'Save Changes'
              ) : (
                'Create Project'
              )}
            </Button>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};
