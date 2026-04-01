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
import { ScopeBadge } from '../components/scope-badge';
import { TemplateDrawer } from '../components/template-drawer';
import { useKpisStore } from '../store/kpis.store';
import { useKpiActions, useKpiDimensions, useKpiMetrics, useKpiTemplates } from '../hooks/useKpis';
import type { KpiTemplate } from '../types';

export const KpiTemplatesPage = () => {
  const { user } = useAuthStore();
  const canManage = useMemo(
    () =>
      user?.profile?.role === UserRole.COMPANY_ADMIN ||
      user?.profile?.role === UserRole.TEAM_LEAD,
    [user?.profile?.role]
  );
  const { templatesSearch, setTemplatesSearch } = useKpisStore();
  const { dimensions } = useKpiDimensions({
    company_id: user?.profile?.company_id,
    scope: 'ALL',
  });
  const { metrics } = useKpiMetrics({
    company_id: user?.profile?.company_id,
    scope: 'ALL',
  });
  const { templates, isLoading, refetch } = useKpiTemplates({
    company_id: user?.profile?.company_id,
    scope: 'ALL',
    search: templatesSearch,
  });
  const { createTemplate, updateTemplate, deleteTemplate } = useKpiActions();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<'edit' | 'view'>('edit');
  const [selectedTemplate, setSelectedTemplate] = useState<KpiTemplate | null>(null);
  const [templateToDelete, setTemplateToDelete] = useState<KpiTemplate | null>(null);

  const handleSubmit = async (request: Parameters<typeof createTemplate>[2]) => {
    if (!user?.id || !user.profile?.company_id) return;
    if (selectedTemplate) {
      await updateTemplate(user.profile.role, selectedTemplate.id, request);
      toast.success('Template updated');
    } else {
      await createTemplate(user.id, user.profile.role, request);
      toast.success('Template created');
    }
    setSelectedTemplate(null);
    await refetch();
  };

  const handleDelete = async () => {
    if (!templateToDelete || !user?.profile?.role) return;
    await deleteTemplate(user.profile.role, templateToDelete.id);
    toast.success('Template deleted');
    setTemplateToDelete(null);
    await refetch();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">KPI Templates</h1>
          <p className="mt-1 text-muted-foreground">
            Create reusable KPI blueprints with validated 100% and 1000-point math.
          </p>
        </div>
        {canManage ? (
          <Button
            className="bg-[#3DCF8E] hover:bg-[#2fb577]"
            onClick={() => {
              setSelectedTemplate(null);
              setDrawerMode('edit');
              setDrawerOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Template
          </Button>
        ) : null}
      </div>

      <Input
        value={templatesSearch}
        onChange={(event) => setTemplatesSearch(event.target.value)}
        placeholder="Search templates"
      />

      {isLoading ? <div className="text-sm text-muted-foreground">Loading templates...</div> : null}

      {!isLoading ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {templates.map((template) => {
            const dimensionTotal =
              template.dimensions?.reduce(
                (sum, item) => sum + Number(item.weight_percentage),
                0
              ) || 0;
            const metricTotal =
              template.metrics?.reduce((sum, item) => sum + Number(item.max_points), 0) || 0;

            return (
              <Card key={template.id}>
                <CardHeader className="flex flex-row items-start justify-between gap-4">
                  <div>
                    <CardTitle>{template.name}</CardTitle>
                    <div className="mt-2">
                      <ScopeBadge scope={template.scope} />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        setSelectedTemplate(template);
                        setDrawerMode('view');
                        setDrawerOpen(true);
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    {canManage && template.scope === 'COMPANY' ? (
                      <>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            setSelectedTemplate(template);
                            setDrawerMode('edit');
                            setDrawerOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setTemplateToDelete(template)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    ) : null}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    {template.description || 'No description provided.'}
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-lg bg-muted/40 p-3">
                      <div className="text-xs text-muted-foreground">Dimension total</div>
                      <div className="text-lg font-semibold">{dimensionTotal}%</div>
                    </div>
                    <div className="rounded-lg bg-muted/40 p-3">
                      <div className="text-xs text-muted-foreground">Metric total</div>
                      <div className="text-lg font-semibold">{metricTotal}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : null}

      {user?.profile?.company_id ? (
        <TemplateDrawer
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
          template={selectedTemplate}
          dimensions={dimensions}
          metrics={metrics}
          companyId={user.profile.company_id}
          onSubmit={drawerMode === 'edit' ? handleSubmit : undefined}
          mode={drawerMode}
        />
      ) : null}

      <AlertDialog open={Boolean(templateToDelete)} onOpenChange={(open) => !open && setTemplateToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete template</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the selected template and its mappings.
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
