import { useNavigate } from 'react-router';
import { ArrowRight, BookOpen, Flame, ListChecks } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import type { UpskillProgramWithDetails } from '@/features/upskill/types';

interface UserUpskillOverviewTabProps {
  programs: UpskillProgramWithDetails[];
}

const formatDate = (value?: string | null) =>
  value ? new Date(value).toLocaleDateString() : 'No activity yet';

const toCompletionPercentage = (program: UpskillProgramWithDetails) => {
  if (program.stats?.completion_percentage !== undefined) {
    return program.stats.completion_percentage;
  }

  const totalModules = program.total_modules || program.modules?.length || 0;
  const completedModules = program.completed_modules || 0;

  if (!totalModules) {
    return 0;
  }

  return Math.round((completedModules / totalModules) * 100);
};

export const UserUpskillOverviewTab = ({ programs }: UserUpskillOverviewTabProps) => {
  const navigate = useNavigate();

  if (programs.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          No up skill programs found for this user yet.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      {programs.map((program) => {
        const completionPercentage = toCompletionPercentage(program);
        const totalModules = program.total_modules || program.modules?.length || 0;
        const completedModules = program.completed_modules || 0;
        const totalLoggedEffort = program.stats?.total_logged_effort || 0;

        return (
          <Card key={program.id} className="border-border/70">
            <CardHeader className="gap-3">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <CardTitle>{program.title}</CardTitle>
                    <Badge variant="outline">{program.status.replaceAll('_', ' ')}</Badge>
                  </div>
                  <p className="max-w-3xl text-sm text-muted-foreground">
                    {program.description || 'No description added yet.'}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(`/up-skill/${program.id}`)}
                >
                  Open Program
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-xl border bg-muted/30 p-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    Estimated Effort
                  </p>
                  <p className="mt-2 text-2xl font-semibold">
                    {program.total_effort ?? 0}
                  </p>
                </div>
                <div className="rounded-xl border bg-muted/30 p-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    Logged Effort
                  </p>
                  <p className="mt-2 text-2xl font-semibold">{totalLoggedEffort}</p>
                </div>
                <div className="rounded-xl border bg-muted/30 p-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    Modules
                  </p>
                  <p className="mt-2 text-2xl font-semibold">
                    {completedModules}/{totalModules}
                  </p>
                </div>
                <div className="rounded-xl border bg-muted/30 p-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    Current Streak
                  </p>
                  <p className="mt-2 text-2xl font-semibold">{program.current_streak}</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">Overall Progress</span>
                  <span className="text-muted-foreground">{completionPercentage}%</span>
                </div>
                <Progress value={completionPercentage} className="h-2" />
              </div>

              <div className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-3">
                <div className="flex items-center gap-2">
                  <ListChecks className="h-4 w-4 text-[#3DCF8E]" />
                  <span>{completedModules} modules completed</span>
                </div>
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-[#3DCF8E]" />
                  <span>{totalModules} total modules</span>
                </div>
                <div className="flex items-center gap-2">
                  <Flame className="h-4 w-4 text-[#3DCF8E]" />
                  <span>Last activity {formatDate(program.last_activity_date)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
