import { useMemo, useState } from 'react';
import { CalendarRange, Target } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { KpiDrawer } from '@/features/kpis/components/KpiDrawer';
import { KpiProgressCard } from '@/features/kpis/components/KpiProgressCard';
import type { DeveloperKpiWithMetrics } from '@/features/kpis/types';

interface UserKpisOverviewTabProps {
  kpis: DeveloperKpiWithMetrics[];
}

const calculateProgress = (kpi: DeveloperKpiWithMetrics) => {
  const totalTarget = kpi.metrics.reduce((sum, metric) => sum + metric.target_points, 0);
  const totalAccumulated = kpi.metrics.reduce(
    (sum, metric) => sum + metric.accumulated_points,
    0
  );

  return {
    totalTarget,
    totalAccumulated,
    percentage:
      totalTarget > 0 ? Math.round((totalAccumulated / totalTarget) * 100) : 0,
  };
};

export const UserKpisOverviewTab = ({ kpis }: UserKpisOverviewTabProps) => {
  const [selectedKpi, setSelectedKpi] = useState<DeveloperKpiWithMetrics | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const activeKpis = useMemo(
    () => kpis.filter((kpi) => kpi.status === 'ACTIVE').length,
    [kpis]
  );

  if (kpis.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          No KPIs have been assigned to this user yet.
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Total KPIs
              </p>
              <p className="mt-2 text-3xl font-semibold">{kpis.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Active KPIs
              </p>
              <p className="mt-2 text-3xl font-semibold">{activeKpis}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Completed KPIs
              </p>
              <p className="mt-2 text-3xl font-semibold">
                {kpis.filter((kpi) => kpi.status === 'COMPLETED').length}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4">
          {kpis.map((kpi) => {
            const progress = calculateProgress(kpi);

            return (
              <Card key={kpi.id}>
                <CardHeader className="gap-3">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <CardTitle>{kpi.title}</CardTitle>
                        <Badge variant="outline">{kpi.status}</Badge>
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <span className="inline-flex items-center gap-1.5">
                          <Target className="h-4 w-4 text-[#3DCF8E]" />
                          {progress.totalAccumulated} / {progress.totalTarget} points
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <CalendarRange className="h-4 w-4 text-[#3DCF8E]" />
                          Started {new Date(kpi.start_date).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setSelectedKpi(kpi);
                        setDrawerOpen(true);
                      }}
                    >
                      View KPI
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">Progress</span>
                      <span className="text-muted-foreground">{progress.percentage}%</span>
                    </div>
                    <Progress value={progress.percentage} className="h-2" />
                  </div>
                  <div className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-3">
                    <div>{kpi.metrics.length} metrics</div>
                    <div>Assigned by {kpi.assigner?.full_name || 'Unknown'}</div>
                    <div>
                      Ends{' '}
                      {kpi.end_date
                        ? new Date(kpi.end_date).toLocaleDateString()
                        : 'No end date'}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <KpiDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        title={selectedKpi?.title || 'KPI Details'}
        size="large"
      >
        {selectedKpi && <KpiProgressCard kpi={selectedKpi} />}
      </KpiDrawer>
    </>
  );
};
