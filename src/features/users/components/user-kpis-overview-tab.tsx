import { useNavigate } from 'react-router';
import { ArrowRight, Sparkles, Target, Trophy } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import type { AssignedKpi } from '@/features/kpis/types';

interface UserKpisOverviewTabProps {
  kpis: AssignedKpi[];
}

const formatDateRange = (startDate: string, endDate: string) => {
  const start = new Date(startDate).toLocaleDateString();
  const end = new Date(endDate).toLocaleDateString();
  return `${start} - ${end}`;
};

export const UserKpisOverviewTab = ({ kpis }: UserKpisOverviewTabProps) => {
  const navigate = useNavigate();

  if (kpis.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          No KPI assignments found for this user yet.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      {kpis.map((kpi) => {
        const progressPercentage =
          kpi.total_target_points > 0
            ? Math.min((kpi.baseline_progress / kpi.total_target_points) * 100, 100)
            : 0;

        return (
          <Card key={kpi.id} className="border-border/70">
            <CardHeader className="gap-3">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <CardTitle>{kpi.template?.name || 'Assigned KPI'}</CardTitle>
                    <Badge variant={kpi.status === 'ACTIVE' ? 'default' : 'secondary'}>
                      {kpi.status.replaceAll('_', ' ')}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {formatDateRange(kpi.start_date, kpi.end_date)}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(`/kpis/assigned/${kpi.id}`)}
                >
                  Open KPI
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="space-y-5">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-xl border bg-muted/30 p-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    Baseline
                  </p>
                  <p className="mt-2 flex items-center gap-2 text-2xl font-semibold">
                    <Target className="h-5 w-5 text-[#3DCF8E]" />
                    {kpi.baseline_progress}/{kpi.total_target_points}
                  </p>
                </div>

                <div className="rounded-xl border bg-muted/30 p-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    Bonus
                  </p>
                  <p className="mt-2 flex items-center gap-2 text-2xl font-semibold">
                    <Sparkles className="h-5 w-5 text-[#3DCF8E]" />
                    {kpi.bonus_progress}
                  </p>
                </div>

                <div className="rounded-xl border bg-muted/30 p-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    Display Score
                  </p>
                  <p className="mt-2 flex items-center gap-2 text-2xl font-semibold">
                    <Trophy className="h-5 w-5 text-[#3DCF8E]" />
                    {kpi.display_score}
                  </p>
                </div>

                <div className="rounded-xl border bg-muted/30 p-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    Reviewers
                  </p>
                  <p className="mt-2 text-2xl font-semibold">{kpi.reviewers.length}</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">Baseline Progress</span>
                  <span className="text-muted-foreground">
                    {progressPercentage.toFixed(0)}%
                  </span>
                </div>
                <Progress value={progressPercentage} className="h-2" />
              </div>

              <div className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-3">
                <div>{kpi.dimensions.length} dimensions</div>
                <div>
                  {kpi.dimensions.reduce(
                    (sum, dimension) => sum + dimension.metrics.length,
                    0
                  )} metrics
                </div>
                <div>
                  {kpi.reviewers.map((reviewer) => reviewer.full_name).join(', ') || 'No reviewers'}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
