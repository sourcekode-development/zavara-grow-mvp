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
import { Switch } from '@/components/ui/switch';
import { Spinner } from '@/components/ui/spinner';
import type {
  CreateProjectMemberRequest,
  ProjectMemberRole,
  ProjectMemberWithProfile,
  ProjectUserSummary,
  UpdateProjectMemberRequest,
} from '../types';

const projectRoleOptions: Array<{ label: string; value: ProjectMemberRole }> = [
  { label: 'Developer', value: 'DEVELOPER' },
  { label: 'Project Manager', value: 'PROJECT_MANAGER' },
  { label: 'Delivery Owner', value: 'DELIVERY_OWNER' },
];

interface ProjectMemberDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  availableUsers: ProjectUserSummary[];
  initialMember?: ProjectMemberWithProfile | null;
  onSubmit: (
    payload: CreateProjectMemberRequest | UpdateProjectMemberRequest
  ) => Promise<{ success: boolean; error?: string }>;
}

export const ProjectMemberDrawer = ({
  open,
  onOpenChange,
  projectId,
  availableUsers,
  initialMember,
  onSubmit,
}: ProjectMemberDrawerProps) => {
  const [userId, setUserId] = useState('');
  const [projectRole, setProjectRole] = useState<ProjectMemberRole>('DEVELOPER');
  const [joinedAt, setJoinedAt] = useState('');
  const [leftAt, setLeftAt] = useState('');
  const [isPrimaryReviewer, setIsPrimaryReviewer] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setUserId(initialMember?.user_id || '');
    setProjectRole(initialMember?.project_role || 'DEVELOPER');
    setJoinedAt(initialMember?.joined_at || new Date().toISOString().slice(0, 10));
    setLeftAt(initialMember?.left_at || '');
    setIsPrimaryReviewer(initialMember?.is_primary_reviewer || false);
    setError(null);
  }, [initialMember, open]);

  const handleSubmit = async () => {
    if (!initialMember && !userId) {
      setError('Select a user to add');
      return;
    }

    if (!joinedAt) {
      setError('Joined date is required');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    const response = await onSubmit(
      initialMember
        ? {
            project_role: projectRole,
            joined_at: joinedAt,
            left_at: leftAt || null,
            is_primary_reviewer: isPrimaryReviewer,
          }
        : {
            project_id: projectId,
            user_id: userId,
            project_role: projectRole,
            joined_at: joinedAt,
            is_primary_reviewer: isPrimaryReviewer,
          }
    );
    setIsSubmitting(false);

    if (response.success) {
      onOpenChange(false);
      return;
    }

    setError(response.error || 'Unable to save project member');
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="right">
      <DrawerContent className="!w-full !max-w-2xl overflow-y-auto p-6">
        <DrawerHeader className="flex flex-row items-start justify-between gap-4">
          <div className="space-y-2">
            <DrawerTitle className="text-2xl">
              {initialMember ? 'Edit Assignment' : 'Add Project Member'}
            </DrawerTitle>
            <p className="text-sm text-muted-foreground">
              Capture project ownership, history dates, and reviewer routing in one place.
            </p>
          </div>
          <DrawerClose asChild>
            <Button variant="ghost" size="icon">
              <X className="h-4 w-4" />
            </Button>
          </DrawerClose>
        </DrawerHeader>

        <div className="space-y-6">
          {!initialMember ? (
            <div className="space-y-2">
              <Label htmlFor="project-member-user">Member</Label>
              <Select value={userId} onValueChange={setUserId}>
                <SelectTrigger id="project-member-user">
                  <SelectValue placeholder="Select a company member" />
                </SelectTrigger>
                <SelectContent>
                  {availableUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="project-member-role">Project Role</Label>
            <Select
              value={projectRole}
              onValueChange={(value) => setProjectRole(value as ProjectMemberRole)}
            >
              <SelectTrigger id="project-member-role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {projectRoleOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="project-member-joined-at">Joined Date</Label>
              <Input
                id="project-member-joined-at"
                type="date"
                value={joinedAt}
                onChange={(event) => setJoinedAt(event.target.value)}
              />
            </div>
            {initialMember ? (
              <div className="space-y-2">
                <Label htmlFor="project-member-left-at">Leave Date</Label>
                <Input
                  id="project-member-left-at"
                  type="date"
                  value={leftAt}
                  onChange={(event) => setLeftAt(event.target.value)}
                />
              </div>
            ) : null}
          </div>

          <div className="flex items-center justify-between rounded-xl border border-border/60 p-4">
            <div>
              <div className="font-medium">Primary Reviewer</div>
              <div className="text-sm text-muted-foreground">
                Use this for the default KPI review and manager survey owner.
              </div>
            </div>
            <Switch checked={isPrimaryReviewer} onCheckedChange={setIsPrimaryReviewer} />
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
              ) : initialMember ? (
                'Save Assignment'
              ) : (
                'Add Member'
              )}
            </Button>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};
