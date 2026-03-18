import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { Plus, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { useUpskillPrograms } from '../hooks/useUpskill';
import { ProgramCard } from '../components/program-card';

export const UpskillProgramsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const { programs, isLoading, error } = useUpskillPrograms({
    user_id: user?.id,
  });

  const filteredPrograms = useMemo(() => {
    return programs.filter((program) => {
      const matchesSearch =
        !search.trim() ||
        program.title.toLowerCase().includes(search.toLowerCase()) ||
        program.description?.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = status === 'all' || program.status === status;

      return matchesSearch && matchesStatus;
    });
  }, [programs, search, status]);

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div> 
          <h1 className="text-3xl font-bold tracking-tight">Up Skill</h1>
          <p className="mt-1 text-muted-foreground">
            Build structured learning programs, log effort, and keep momentum visible.
          </p>
        </div>
        <Button
          className="bg-[#3DCF8E] hover:bg-[#2fb577]"
          onClick={() => navigate('/up-skill/create')}
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Program
        </Button>
      </div>

      <div className="grid gap-4 rounded-xl border border-border/60 bg-card p-4 md:grid-cols-[1fr_220px]">
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search your programs"
        />
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="DRAFT">Draft</SelectItem>
            <SelectItem value="PENDING_REVIEW">Pending Review</SelectItem>
            <SelectItem value="APPROVED">Approved</SelectItem>
            <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700 dark:bg-red-900/10 dark:text-red-300">
          {error}
        </div>
      )}

      {isLoading && (
        <div className="grid gap-4 xl:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-[280px] rounded-xl" />
          ))}
        </div>
      )}

      {!isLoading && filteredPrograms.length > 0 && (
        <div className="grid gap-4 xl:grid-cols-2">
          {filteredPrograms.map((program) => (
            <ProgramCard key={program.id} program={program} />
          ))}
        </div>
      )}

      {!isLoading && filteredPrograms.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border/80 bg-muted/30 px-6 py-14 text-center">
          <Sparkles className="mx-auto h-10 w-10 text-[#3DCF8E]" />
          <h2 className="mt-4 text-xl font-semibold">No programs yet</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Create your first up skill program or start from a reusable template.
          </p>
          <Button
            className="mt-6 bg-[#3DCF8E] hover:bg-[#2fb577]"
            onClick={() => navigate('/up-skill/create')}
          >
            Create Program
          </Button>
        </div>
      )}
    </div>
  );
};

