import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { ProgramForm } from '../components/program-form';
import { useUpskillActions, useUpskillTemplates } from '../hooks/useUpskill';

export const UpskillProgramCreatePage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { templates } = useUpskillTemplates({ company_id: user?.profile?.company_id });
  const { createProgram, isLoading, error } = useUpskillActions();

  const handleCreate = async (data: {
    title?: string;
    description?: string;
    total_effort?: number | null;
    template_id?: string;
  }) => {
    if (!user?.id || !user.profile?.company_id) {
      toast.error('You must be signed in to create a program');
      return;
    }

    const program = await createProgram(user.id, user.profile.company_id, {
      title: data.title || '',
      description: data.description,
      total_effort: data.total_effort ?? undefined,
      template_id: data.template_id,
    });

    if (!program) {
      toast.error(error || 'Failed to create program');
      return;
    }

    toast.success('Up skill program created');
    navigate(`/up-skill/${program.id}`);
  };

  return (
    <div className="space-6">
      <Button variant="ghost" onClick={() => navigate('/up-skill')}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Up Skill
      </Button>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">Create Up Skill Program</h1>
        <p className="mt-1 text-muted-foreground">
          Start from scratch or clone a reusable template with modules included.
        </p>
      </div>

      <ProgramForm
        templates={templates}
        showTemplatePicker
        submitLabel="Create Program"
        isSubmitting={isLoading}
        onSubmit={handleCreate}
      />
    </div>
  );
};
