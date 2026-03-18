import { ArrowLeft } from 'lucide-react';
import { useNavigate, useParams } from 'react-router';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ProgramForm } from '../components/program-form';
import { useUpskillActions, useUpskillProgram } from '../hooks/useUpskill';

export const UpskillProgramEditPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { program, isLoading } = useUpskillProgram(id);
  const { updateProgram, isLoading: isSaving, error } = useUpskillActions();

  if (!id) {
    return null;
  }

  const handleUpdate = async (data: {
    title?: string;
    description?: string;
    total_effort?: number | null;
  }) => {
    const updated = await updateProgram(id, {
      title: data.title,
      description: data.description,
      total_effort: data.total_effort,
    });

    if (!updated) {
      toast.error(error || 'Failed to update program');
      return;
    }

    toast.success('Program updated');
    navigate(`/up-skill/${id}`);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Button variant="ghost" onClick={() => navigate(`/up-skill/${id}`)}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Program
      </Button>

      {isLoading && <Skeleton className="h-[320px] rounded-xl" />}

      {!isLoading && program && (
        <>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Edit Program</h1>
            <p className="mt-1 text-muted-foreground">
              Estimates and descriptions are intentionally flexible until completion.
            </p>
          </div>

          <ProgramForm
            initialValues={{
              title: program.title,
              description: program.description,
              total_effort: program.total_effort,
            }}
            submitLabel="Save Changes"
            isSubmitting={isSaving}
            onSubmit={handleUpdate}
          />
        </>
      )}
    </div>
  );
};

