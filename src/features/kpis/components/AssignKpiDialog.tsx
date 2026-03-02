import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useAssignKpi } from '../hooks/useDeveloperKpis';
import { kpiTemplatesApi } from '../apis/templates.api';
import { fetchUsers } from '@/features/users/apis/users.api';
import { useAuthStore } from '@/features/auth/store/auth.store';
import type { KpiTemplate, AssignKpiRequest } from '../types';
import type { UserProfile } from '@/shared/types';

interface AssignKpiDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const AssignKpiDialog = ({
  open,
  onOpenChange,
  onSuccess,
}: AssignKpiDialogProps) => {
  const [templates, setTemplates] = useState<KpiTemplate[]>([]);
  const [developers, setDevelopers] = useState<UserProfile[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  const [isLoadingDevelopers, setIsLoadingDevelopers] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { assignKpi } = useAssignKpi();
  const { user } = useAuthStore();

  const { register, handleSubmit, watch, setValue, reset } =
    useForm<AssignKpiRequest>({
      defaultValues: {
        user_id: '',
        template_id: '',
        start_date: '',
        end_date: '',
      },
    });

  const selectedTemplateId = watch('template_id');
  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId);

  // Fetch templates and developers
  useEffect(() => {
    if (open && user?.profile?.company_id) {
      // Fetch active templates
      setIsLoadingTemplates(true);
      kpiTemplatesApi.getTemplates({}).then((result) => {
        if (result.data) {
          setTemplates(result.data);
        }
        setIsLoadingTemplates(false);
      });

      // Fetch developers
      setIsLoadingDevelopers(true);
      fetchUsers(user.profile.company_id, { role: 'DEVELOPER' }).then(
        (result) => {
          if (result.data) {
            setDevelopers(result.data.users);
          }
          setIsLoadingDevelopers(false);
        }
      );
    }
  }, [open, user?.profile?.company_id]);

  const onSubmit = async (data: AssignKpiRequest) => {
    setIsSubmitting(true);

    // Clean up empty strings for optional date fields
    const cleanedData = {
      ...data,
      end_date: data.end_date?.trim() || undefined,
    };

    const result = await assignKpi(cleanedData);

    if (result.data && !result.error) {
      toast.success('KPI assigned successfully');
      reset();
      onOpenChange(false);
      onSuccess?.();
    } else {
      toast.error(result.error || 'Failed to assign KPI');
    }

    setIsSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Assign KPI to Developer</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="user_id">Developer *</Label>
            <Select
              onValueChange={(value) => setValue('user_id', value)}
              disabled={isLoadingDevelopers}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select developer..." />
              </SelectTrigger>
              <SelectContent>
                {developers.map((dev) => (
                  <SelectItem key={dev.id} value={dev.id}>
                    {dev.full_name} ({dev.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="template_id">KPI Template *</Label>
            <Select
              onValueChange={(value) => setValue('template_id', value)}
              disabled={isLoadingTemplates}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select template..." />
              </SelectTrigger>
              <SelectContent>
                {templates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.title} ({template.cycle_type})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedTemplate && (
              <p className="text-sm text-muted-foreground">
                Cycle: {selectedTemplate.cycle_type}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">Start Date *</Label>
              <Input
                type="date"
                {...register('start_date', { required: true })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end_date">End Date</Label>
              <Input type="date" {...register('end_date')} />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                reset();
                onOpenChange(false);
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Assigning...' : 'Assign KPI'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
