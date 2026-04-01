import { useMemo, useState } from 'react';
import { Eye, Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { UserRole } from '@/shared/types';
import { MetricDetailDrawer } from '../components/metric-detail-drawer';
import { MetricDrawer } from '../components/metric-drawer';
import { ScopeBadge } from '../components/scope-badge';
import { useKpisStore } from '../store/kpis.store';
import { useKpiActions, useKpiDimensions, useKpiMetrics } from '../hooks/useKpis';
import type { KpiMetric } from '../types';

export const KpiMetricsPage = () => {
  const { user } = useAuthStore();
  const canManage = useMemo(
    () =>
      user?.profile?.role === UserRole.COMPANY_ADMIN ||
      user?.profile?.role === UserRole.TEAM_LEAD,
    [user?.profile?.role]
  );
  const { metricsSearch, setMetricsSearch } = useKpisStore();
  const { dimensions } = useKpiDimensions({
    company_id: user?.profile?.company_id,
    scope: 'ALL',
  });
  const { metrics, isLoading, refetch } = useKpiMetrics({
    company_id: user?.profile?.company_id,
    scope: 'ALL',
    search: metricsSearch,
  });
  const { createMetric, updateMetric, deleteMetric } = useKpiActions();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<KpiMetric | null>(null);
  const [metricToDelete, setMetricToDelete] = useState<KpiMetric | null>(null);

  const handleSubmit = async (request: {
    dimension_id: string;
    name: string;
    description?: string;
    how_to_measure?: string;
    scope: 'COMPANY' | 'PLATFORM';
    company_id?: string | null;
  }) => {
    if (!user?.id || !user.profile?.company_id) return;
    if (selectedMetric) {
      await updateMetric(user.profile.role, selectedMetric.id, request);
      toast.success('Metric updated');
    } else {
      await createMetric(user.id, user.profile.role, request);
      toast.success('Metric created');
    }
    setSelectedMetric(null);
    await refetch();
  };

  const handleDelete = async () => {
    if (!metricToDelete || !user?.profile?.role) return;
    await deleteMetric(user.profile.role, metricToDelete.id);
    toast.success('Metric deleted');
    setMetricToDelete(null);
    await refetch();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Metrics</h1>
          <p className="mt-1 text-muted-foreground">
            Build the reusable KPI metric library for standard and impact claims.
          </p>
        </div>
        {canManage ? (
          <Button
            className="bg-[#3DCF8E] hover:bg-[#2fb577]"
            onClick={() => {
              setSelectedMetric(null);
              setDrawerOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Metric
          </Button>
        ) : null}
      </div>

      <Input
        value={metricsSearch}
        onChange={(event) => setMetricsSearch(event.target.value)}
        placeholder="Search metrics"
      />

      {isLoading ? <div className="text-sm text-muted-foreground">Loading metrics...</div> : null}

      {!isLoading ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {metrics.map((metric) => (
            <Card key={metric.id}>
              <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div>
                  <CardTitle>{metric.name}</CardTitle>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <ScopeBadge scope={metric.scope} />
                    {metric.dimension ? (
                      <span className="text-xs text-muted-foreground">
                        {metric.dimension.name}
                      </span>
                    ) : null}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      setSelectedMetric(metric);
                      setDetailOpen(true);
                    }}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  {canManage && metric.scope === 'COMPANY' ? (
                    <>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          setSelectedMetric(metric);
                          setDrawerOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setMetricToDelete(metric)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  ) : null}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  {metric.description || 'No description provided.'}
                </p>
                <div className="rounded-lg bg-muted/30 p-3 text-sm text-muted-foreground">
                  {metric.how_to_measure || 'No measurement guidance provided.'}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}

      {canManage && user?.profile?.company_id ? (
        <MetricDrawer
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
          initialMetric={selectedMetric}
          dimensions={dimensions}
          companyId={user.profile.company_id}
          onSubmit={handleSubmit}
        />
      ) : null}

      <MetricDetailDrawer
        open={detailOpen}
        onOpenChange={setDetailOpen}
        metric={selectedMetric}
      />

      <AlertDialog open={Boolean(metricToDelete)} onOpenChange={(open) => !open && setMetricToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete metric</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the selected metric.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
