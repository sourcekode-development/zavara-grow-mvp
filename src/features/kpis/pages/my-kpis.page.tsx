import { Link } from 'react-router';
import { ArrowRight, Trophy } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { useAssignedKpis } from '../hooks/useKpis';

export const MyKpisPage = () => {
  const { user } = useAuthStore();
  const { kpis, isLoading } = useAssignedKpis({
    developer_id: user?.id,
    status: 'ALL',
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Your KPI</h1>
        <p className="mt-1 text-muted-foreground">
          Track your active KPI, claims, and bonus points in one place.
        </p>
      </div>

      {isLoading ? <div className="text-sm text-muted-foreground">Loading KPIs...</div> : null}

      {!isLoading && kpis.length === 0 ? (
        <div className="rounded-2xl border border-dashed px-6 py-14 text-center text-muted-foreground">
          No KPI assigned yet.
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-2">
        {kpis.map((kpi) => (
          <Card key={kpi.id}>
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div>
                <CardTitle>{kpi.template?.name || 'Assigned KPI'}</CardTitle>
                <p className="mt-2 text-sm text-muted-foreground">
                  {kpi.start_date} to {kpi.end_date}
                </p>
              </div>
              <Badge variant={kpi.status === 'ACTIVE' ? 'default' : 'secondary'}>
                {kpi.status.toLowerCase()}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg bg-muted/40 p-3">
                  <div className="text-xs text-muted-foreground">Baseline</div>
                  <div className="text-lg font-semibold">
                    {kpi.baseline_progress}/{kpi.total_target_points}
                  </div>
                </div>
                <div className="rounded-lg bg-muted/40 p-3">
                  <div className="text-xs text-muted-foreground">Bonus</div>
                  <div className="text-lg font-semibold">{kpi.bonus_progress}</div>
                </div>
                <div className="rounded-lg bg-muted/40 p-3">
                  <div className="text-xs text-muted-foreground">Display</div>
                  <div className="flex items-center gap-2 text-lg font-semibold">
                    <Trophy className="h-4 w-4 text-[#3DCF8E]" />
                    {kpi.display_score}
                  </div>
                </div>
              </div>

              <Button asChild className="bg-[#3DCF8E] text-white hover:bg-[#2fb577]">
                <Link to={`/kpis/my/${kpi.id}`}>
                  Open KPI
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
