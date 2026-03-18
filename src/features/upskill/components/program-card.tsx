import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ArrowRight, Flame, Layers3, ListChecks } from 'lucide-react';
import { useNavigate } from 'react-router';
import type { UpskillProgramWithDetails } from '../types';
import { ProgramStatusBadge } from './program-status-badge';

export const ProgramCard = ({ program }: { program: UpskillProgramWithDetails }) => {
  const navigate = useNavigate();
  const totalModules = program.total_modules || 0;
  const completedModules = program.completed_modules || 0;
  const moduleCompletion =
    totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;

  return (
    <Card className="border-border/60 hover:border-[#3DCF8E]/40 transition-colors">
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="text-xl">{program.title}</CardTitle>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {program.description || 'No description yet.'}
            </p>
          </div>
          <ProgramStatusBadge status={program.status} />
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-muted/50 p-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <ListChecks className="h-4 w-4" />
              Modules
            </div>
            <div className="mt-2 text-lg font-semibold">
              {completedModules}/{totalModules}
            </div>
          </div>
          <div className="rounded-xl bg-muted/50 p-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Layers3 className="h-4 w-4" />
              Est. Effort
            </div>
            <div className="mt-2 text-lg font-semibold">
              {Number(program.total_effort || 0).toFixed(
                Number.isInteger(Number(program.total_effort || 0)) ? 0 : 1
              )}
            </div>
          </div>
          <div className="rounded-xl bg-muted/50 p-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Flame className="h-4 w-4" />
              Streak
            </div>
            <div className="mt-2 text-lg font-semibold">{program.current_streak}</div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Module completion</span>
            <span className="font-medium">{moduleCompletion}%</span>
          </div>
          <Progress value={moduleCompletion} className="h-2" />
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Updated {new Date(program.updated_at).toLocaleDateString()}</span>
          <Button
            variant="ghost"
            className="px-0 text-[#3DCF8E] hover:text-[#3DCF8E]"
            onClick={() => navigate(`/up-skill/${program.id}`)}
          >
            Open Program
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

