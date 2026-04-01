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
import { DimensionDetailDrawer } from '../components/dimension-detail-drawer';
import { DimensionDrawer } from '../components/dimension-drawer';
import { ScopeBadge } from '../components/scope-badge';
import { useKpisStore } from '../store/kpis.store';
import { useKpiActions, useKpiDimensions } from '../hooks/useKpis';
import type { KpiDimension } from '../types';

export const KpiDimensionsPage = () => {
  const { user } = useAuthStore();
  const canManage = useMemo(
    () =>
      user?.profile?.role === UserRole.COMPANY_ADMIN ||
      user?.profile?.role === UserRole.TEAM_LEAD,
    [user?.profile?.role]
  );
  const { dimensionsSearch, setDimensionsSearch } = useKpisStore();
  const { dimensions, isLoading, refetch } = useKpiDimensions({
    company_id: user?.profile?.company_id,
    scope: 'ALL',
    search: dimensionsSearch,
  });
  const { createDimension, updateDimension, deleteDimension } = useKpiActions();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedDimension, setSelectedDimension] = useState<KpiDimension | null>(null);
  const [dimensionToDelete, setDimensionToDelete] = useState<KpiDimension | null>(null);

  const handleSubmit = async (request: { name: string; description?: string; scope: 'COMPANY' | 'PLATFORM'; company_id?: string | null }) => {
    if (!user?.id || !user.profile?.company_id) return;
    if (selectedDimension) {
      await updateDimension(user.profile.role, selectedDimension.id, request);
      toast.success('Dimension updated');
    } else {
      await createDimension(user.id, user.profile.role, request);
      toast.success('Dimension created');
    }
    setSelectedDimension(null);
    await refetch();
  };

  const handleDelete = async () => {
    if (!dimensionToDelete || !user?.profile?.role) return;
    await deleteDimension(user.profile.role, dimensionToDelete.id);
    toast.success('Dimension deleted');
    setDimensionToDelete(null);
    await refetch();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dimensions</h1>
          <p className="mt-1 text-muted-foreground">
            Organize KPI metrics into weighted categories.
          </p>
        </div>
        {canManage ? (
          <Button
            className="bg-[#3DCF8E] hover:bg-[#2fb577]"
            onClick={() => {
              setSelectedDimension(null);
              setDrawerOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Dimension
          </Button>
        ) : null}
      </div>

      <Input
        value={dimensionsSearch}
        onChange={(event) => setDimensionsSearch(event.target.value)}
        placeholder="Search dimensions"
      />

      {isLoading ? <div className="text-sm text-muted-foreground">Loading dimensions...</div> : null}

      {!isLoading && dimensions.length === 0 ? (
        <div className="rounded-2xl border border-dashed px-6 py-14 text-center text-muted-foreground">
          No dimensions available yet.
        </div>
      ) : null}

      {!isLoading ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {dimensions.map((dimension) => (
            <Card key={dimension.id}>
              <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div>
                  <CardTitle>{dimension.name}</CardTitle>
                  <div className="mt-2">
                    <ScopeBadge scope={dimension.scope} />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      setSelectedDimension(dimension);
                      setDetailOpen(true);
                    }}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  {canManage && dimension.scope === 'COMPANY' ? (
                    <>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          setSelectedDimension(dimension);
                          setDrawerOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setDimensionToDelete(dimension)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  ) : null}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  {dimension.description || 'No description provided.'}
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg bg-muted/40 p-3">
                    <div className="text-xs text-muted-foreground">Metrics</div>
                    <div className="text-lg font-semibold">{dimension.metrics_count || 0}</div>
                  </div>
                  <div className="rounded-lg bg-muted/40 p-3">
                    <div className="text-xs text-muted-foreground">Templates</div>
                    <div className="text-lg font-semibold">{dimension.templates_count || 0}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}

      {canManage && user?.profile?.company_id ? (
        <DimensionDrawer
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
          initialDimension={selectedDimension}
          companyId={user.profile.company_id}
          onSubmit={handleSubmit}
        />
      ) : null}

      <DimensionDetailDrawer
        open={detailOpen}
        onOpenChange={setDetailOpen}
        dimension={selectedDimension}
      />

      <AlertDialog open={Boolean(dimensionToDelete)} onOpenChange={(open) => !open && setDimensionToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete dimension</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the selected dimension.
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
