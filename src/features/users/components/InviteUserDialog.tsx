import { useForm, Controller } from 'react-hook-form';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field, FieldLabel } from '@/components/ui/field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCreateInvite } from '../hooks/useCreateInvite';
import { UserRole } from '@/shared/types';
import type { InviteFormData } from '../types';
import { toast } from 'sonner';

interface InviteUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const InviteUserDialog = ({
  open,
  onOpenChange,
  onSuccess,
}: InviteUserDialogProps) => {
  const { createInvite, isCreating } = useCreateInvite();
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<InviteFormData>();

  const handleClose = () => {
    reset();
    onOpenChange(false);
  };

  const onSubmit = async (data: InviteFormData) => {
    const result = await createInvite(data);

    if (result.success) {
      toast.success('Invite sent successfully!');
      handleClose();
      onSuccess?.();
    } else {
      toast.error(result.error || 'Failed to send invite');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-125">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Invite User</DialogTitle>
            <DialogDescription>
              Send an invitation to join your company. The user will see this
              invitation when they sign up.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <Field>
              <FieldLabel htmlFor="email">Email Address</FieldLabel>
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address',
                  },
                })}
              />
              {errors.email && (
                <p className="text-sm text-red-500 mt-1">
                  {errors.email.message}
                </p>
              )}
            </Field>

            <Field>
              <FieldLabel htmlFor="role">Role</FieldLabel>
              <Controller
                name="role"
                control={control}
                rules={{ required: 'Role is required' }}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={UserRole.DEVELOPER}>Developer</SelectItem>
                      <SelectItem value={UserRole.TEAM_LEAD}>Team Lead</SelectItem>
                      <SelectItem value={UserRole.COMPANY_ADMIN}>Company Admin</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.role && (
                <p className="text-sm text-red-500 mt-1">
                  {errors.role.message}
                </p>
              )}
            </Field>

            <div className="rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/20 p-3">
              <p className="text-sm text-blue-900 dark:text-blue-400">
                <strong>Note:</strong> The invitation will be valid for 7 days.
                The user will see this invitation when they try to sign up with
                this email address.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-[#3DCF8E] hover:bg-[#3DCF8E]/90"
              disabled={isCreating}
            >
              {isCreating ? 'Sending...' : 'Send Invite'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
