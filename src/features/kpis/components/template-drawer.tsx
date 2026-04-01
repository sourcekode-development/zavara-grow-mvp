import { useEffect, useMemo, useState } from 'react';
import { Plus, Sparkles, Target, Trash2, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import type {
  CreateKpiTemplateRequest,
  KpiDimension,
  KpiMetric,
  KpiTemplate,
} from '../types';

interface TemplateDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template?: KpiTemplate | null;
  dimensions: KpiDimension[];
  metrics: KpiMetric[];
  companyId: string;
  onSubmit?: (request: CreateKpiTemplateRequest) => Promise<void>;
  mode?: 'edit' | 'view';
}

type MetricDraft = {
  localId: string;
  metric_id: string;
  max_points: string;
};

type DimensionDraft = {
  localId: string;
  dimension_id: string;
  weight_percentage: string;
  metrics: MetricDraft[];
};

const createMetricDraft = (metric?: { metric_id: string; max_points: number }) => ({
  localId: crypto.randomUUID(),
  metric_id: metric?.metric_id || '',
  max_points: metric?.max_points?.toString() || '',
});

const createDimensionDraft = (dimension?: {
  dimension_id: string;
  weight_percentage: number;
  metrics?: MetricDraft[];
}) => ({
  localId: crypto.randomUUID(),
  dimension_id: dimension?.dimension_id || '',
  weight_percentage: dimension?.weight_percentage?.toString() || '',
  metrics: dimension?.metrics || [],
});

export const TemplateDrawer = ({
  open,
  onOpenChange,
  template,
  dimensions,
  metrics,
  companyId,
  onSubmit,
  mode = 'edit',
}: TemplateDrawerProps) => {
  const isReadOnly = mode === 'view';
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [scope, setScope] = useState<'COMPANY' | 'PLATFORM'>('COMPANY');
  const [dimensionDrafts, setDimensionDrafts] = useState<DimensionDraft[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const metricsByDimension =
      template?.metrics?.reduce<Record<string, MetricDraft[]>>((accumulator, metric) => {
        const dimensionId = metric.metric?.dimension_id;
        if (!dimensionId) return accumulator;

        accumulator[dimensionId] = accumulator[dimensionId] || [];
        accumulator[dimensionId].push(createMetricDraft(metric));
        return accumulator;
      }, {}) || {};

    setName(template?.name || '');
    setDescription(template?.description || '');
    setScope(template?.scope || 'COMPANY');
    setDimensionDrafts(
      template?.dimensions?.map((dimension) =>
        createDimensionDraft({
          dimension_id: dimension.dimension_id,
          weight_percentage: dimension.weight_percentage,
          metrics: metricsByDimension[dimension.dimension_id] || [],
        })
      ) || [createDimensionDraft()]
    );
    setError(null);
  }, [template, open]);

  const dimensionTotal = useMemo(
    () =>
      dimensionDrafts.reduce(
        (sum, dimension) => sum + Number(dimension.weight_percentage || 0),
        0
      ),
    [dimensionDrafts]
  );

  const metricTotal = useMemo(
    () =>
      dimensionDrafts.reduce(
        (sum, dimension) =>
          sum +
          dimension.metrics.reduce(
            (metricSum, metric) => metricSum + Number(metric.max_points || 0),
            0
          ),
        0
      ),
    [dimensionDrafts]
  );

  const availableWeight = Math.max(100 - dimensionTotal, 0);
  const availablePoints = Math.max(1000 - metricTotal, 0);

  const selectedDimensionIds = useMemo(
    () => dimensionDrafts.map((draft) => draft.dimension_id).filter(Boolean),
    [dimensionDrafts]
  );

  const selectedMetricIds = useMemo(
    () =>
      dimensionDrafts.flatMap((dimension) =>
        dimension.metrics.map((metric) => metric.metric_id).filter(Boolean)
      ),
    [dimensionDrafts]
  );

  const totalMetricCount = useMemo(
    () => dimensionDrafts.reduce((sum, dimension) => sum + dimension.metrics.length, 0),
    [dimensionDrafts]
  );

  const handleSubmit = async () => {
    if (!onSubmit) return;
    if (!name.trim()) {
      setError('Template name is required');
      return;
    }

    const normalizedDimensions = dimensionDrafts
      .filter((dimension) => dimension.dimension_id)
      .map((dimension) => ({
        dimension_id: dimension.dimension_id,
        weight_percentage: Number(dimension.weight_percentage),
      }));

    const normalizedMetrics = dimensionDrafts.flatMap((dimension) =>
      dimension.metrics
        .filter((metric) => metric.metric_id)
        .map((metric) => ({
          metric_id: metric.metric_id,
          max_points: Number(metric.max_points),
        }))
    );

    if (dimensionTotal !== 100) {
      setError('Dimension weights must add up to exactly 100');
      return;
    }

    if (metricTotal !== 1000) {
      setError('Metric points must add up to exactly 1000');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        name: name.trim(),
        description: description.trim() || undefined,
        scope,
        company_id: scope === 'COMPANY' ? companyId : null,
        dimensions: normalizedDimensions,
        metrics: normalizedMetrics,
      });
      onOpenChange(false);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Failed to save template');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="right">
      <DrawerContent className="!w-full !max-w-6xl overflow-y-auto overflow-x-clip p-6">
        <DrawerHeader className="flex flex-row items-start justify-between gap-4">
          <div className="space-y-2">
            <DrawerTitle className="text-2xl">
              {template ? (isReadOnly ? 'Template Details' : 'Edit Template') : 'Create Template'}
            </DrawerTitle>
            <p className="text-sm text-muted-foreground">
              Build your KPI template dimension by dimension, then add only the matching metrics inside each card.
            </p>
          </div>
          <DrawerClose asChild>
            <Button variant="ghost" size="icon">
              <X className="h-4 w-4" />
            </Button>
          </DrawerClose>
        </DrawerHeader>

        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="template-name">Template Name</Label>
              <Input
                id="template-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                disabled={isReadOnly}
                placeholder="e.g. Senior Developer Growth KPI"
              />
            </div>
            <div className="space-y-2">
              <Label>Scope</Label>
              <div className="rounded-lg border bg-muted/30 px-3 py-2 text-sm">
                {scope === 'PLATFORM' ? 'Platform' : 'Company'}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="template-description">Description</Label>
            <Textarea
              id="template-description"
              rows={3}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              disabled={isReadOnly}
              placeholder="Describe what this KPI template is designed to reward."
            />
          </div>

          <div className="grid gap-4 xl:grid-cols-[300px_minmax(0,1fr)]">
            <div className="space-y-4">
              <Card className="border-border/70 bg-gradient-to-br from-background via-background to-[#3DCF8E]/5">
                <CardContent className="space-y-4 pt-6">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-[#3DCF8E]" />
                    <h3 className="font-semibold">Realtime Totals</h3>
                  </div>

                  <div className="grid gap-3">
                    <div className="rounded-xl border bg-background/80 p-4">
                      <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                        Weight Used
                      </div>
                      <div className="mt-2 text-2xl font-semibold">{dimensionTotal}%</div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        {availableWeight}% remaining
                      </div>
                    </div>

                    <div className="rounded-xl border bg-background/80 p-4">
                      <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                        Points Used
                      </div>
                      <div className="mt-2 text-2xl font-semibold">{metricTotal}</div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        {availablePoints} points remaining
                      </div>
                    </div>

                    <div className="rounded-xl border bg-background/80 p-4">
                      <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                        Structure
                      </div>
                      <div className="mt-2 text-2xl font-semibold">
                        {dimensionDrafts.filter((draft) => draft.dimension_id).length}
                      </div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        {totalMetricCount} metrics added
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border bg-muted/30 p-4 text-sm text-muted-foreground">
                    Aim for exactly <span className="font-semibold text-foreground">100%</span> weight and <span className="font-semibold text-foreground">1000</span> points before saving.
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="space-y-4 pt-6">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="font-semibold">Dimension Outline</h3>
                      <p className="text-sm text-muted-foreground">
                        Quick overview of the template structure.
                      </p>
                    </div>
                    {!isReadOnly ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setDimensionDrafts((current) => [...current, createDimensionDraft()])
                        }
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add
                      </Button>
                    ) : null}
                  </div>

                  <div className="space-y-2">
                    {dimensionDrafts.map((draft, index) => {
                      const dimension = dimensions.find((item) => item.id === draft.dimension_id);
                      const localMetricTotal = draft.metrics.reduce(
                        (sum, metric) => sum + Number(metric.max_points || 0),
                        0
                      );

                      return (
                        <div
                          key={draft.localId}
                          className="rounded-xl border bg-muted/20 px-3 py-3"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <div className="font-medium">
                                {dimension?.name || `Dimension ${index + 1}`}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {draft.weight_percentage || 0}% • {localMetricTotal} points
                              </div>
                            </div>
                            <Badge variant="outline">{draft.metrics.length} metrics</Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              {dimensionDrafts.map((draft, index) => {
                const selectedDimension = dimensions.find(
                  (dimension) => dimension.id === draft.dimension_id
                );
                const dimensionMetricTotal = draft.metrics.reduce(
                  (sum, metric) => sum + Number(metric.max_points || 0),
                  0
                );
                const allowedDimensions = dimensions.filter(
                  (dimension) =>
                    dimension.id === draft.dimension_id ||
                    !selectedDimensionIds.includes(dimension.id)
                );
                const metricsForDimension = metrics.filter(
                  (metric) => metric.dimension_id === draft.dimension_id
                );

                return (
                  <div
                    key={draft.localId}
                    className="rounded-2xl border border-border/70 bg-gradient-to-br from-background via-background to-[#3DCF8E]/5 p-5"
                  >
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                      <div className="space-y-3 flex-1">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-[#3DCF8E]/15 text-[#208d61] dark:text-[#3DCF8E]">
                            Dimension {index + 1}
                          </Badge>
                          {selectedDimension ? (
                            <span className="text-sm text-muted-foreground">
                              {selectedDimension.metrics_count || 0} library metrics
                            </span>
                          ) : null}
                        </div>

                        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_140px_auto]">
                          <Select
                            value={draft.dimension_id}
                            onValueChange={(value) =>
                              setDimensionDrafts((current) =>
                                current.map((item) =>
                                  item.localId === draft.localId
                                    ? {
                                        ...item,
                                        dimension_id: value,
                                        metrics: item.dimension_id === value ? item.metrics : [],
                                      }
                                    : item
                                )
                              )
                            }
                            disabled={isReadOnly}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select dimension" />
                            </SelectTrigger>
                            <SelectContent>
                              {allowedDimensions.map((dimension) => (
                                <SelectItem key={dimension.id} value={dimension.id}>
                                  {dimension.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          <div className="space-y-2">
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              step="0.01"
                              value={draft.weight_percentage}
                              onChange={(event) =>
                                setDimensionDrafts((current) =>
                                  current.map((item) =>
                                    item.localId === draft.localId
                                      ? { ...item, weight_percentage: event.target.value }
                                      : item
                                  )
                                )
                              }
                              disabled={isReadOnly}
                            />
                            <p className="text-xs text-muted-foreground">Weight %</p>
                          </div>

                          {!isReadOnly ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                setDimensionDrafts((current) =>
                                  current.filter((item) => item.localId !== draft.localId)
                                )
                              }
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          ) : null}
                        </div>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-xl border bg-background/80 p-4">
                          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                            <Target className="h-3.5 w-3.5" />
                            Weight
                          </div>
                          <div className="mt-2 text-xl font-semibold">
                            {draft.weight_percentage || 0}%
                          </div>
                        </div>

                        <div className="rounded-xl border bg-background/80 p-4">
                          <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                            Points Inside
                          </div>
                          <div className="mt-2 text-xl font-semibold">{dimensionMetricTotal}</div>
                        </div>
                      </div>
                    </div>

                    <Separator className="my-5" />

                    <div className="space-y-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <h3 className="font-semibold">Metrics In This Dimension</h3>
                          <p className="text-sm text-muted-foreground">
                            Only metrics from this selected dimension appear here.
                          </p>
                        </div>
                        {!isReadOnly ? (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={!draft.dimension_id}
                            onClick={() =>
                              setDimensionDrafts((current) =>
                                current.map((item) =>
                                  item.localId === draft.localId
                                    ? {
                                        ...item,
                                        metrics: [...item.metrics, createMetricDraft()],
                                      }
                                    : item
                                )
                              )
                            }
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Add Metric
                          </Button>
                        ) : null}
                      </div>

                      {!draft.dimension_id ? (
                        <div className="rounded-xl border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
                          Select a dimension first to unlock its metric list.
                        </div>
                      ) : draft.metrics.length === 0 ? (
                        <div className="rounded-xl border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
                          No metrics added in this dimension yet.
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {draft.metrics.map((metricDraft) => {
                            const currentMetric = metrics.find(
                              (metric) => metric.id === metricDraft.metric_id
                            );
                            const allowedMetrics = metricsForDimension.filter(
                              (metric) =>
                                metric.id === metricDraft.metric_id ||
                                !selectedMetricIds.includes(metric.id)
                            );

                            return (
                              <div
                                key={metricDraft.localId}
                                className="rounded-xl border bg-background/80 p-4"
                              >
                                <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_140px_auto]">
                                  <Select
                                    value={metricDraft.metric_id}
                                    onValueChange={(value) =>
                                      setDimensionDrafts((current) =>
                                        current.map((item) =>
                                          item.localId === draft.localId
                                            ? {
                                                ...item,
                                                metrics: item.metrics.map((metric) =>
                                                  metric.localId === metricDraft.localId
                                                    ? { ...metric, metric_id: value }
                                                    : metric
                                                ),
                                              }
                                            : item
                                        )
                                      )
                                    }
                                    disabled={isReadOnly}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select metric" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {allowedMetrics.map((metric) => (
                                        <SelectItem key={metric.id} value={metric.id}>
                                          {metric.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>

                                  <div className="space-y-2">
                                    <Input
                                      type="number"
                                      min="0"
                                      step="1"
                                      value={metricDraft.max_points}
                                      onChange={(event) =>
                                        setDimensionDrafts((current) =>
                                          current.map((item) =>
                                            item.localId === draft.localId
                                              ? {
                                                  ...item,
                                                  metrics: item.metrics.map((metric) =>
                                                    metric.localId === metricDraft.localId
                                                      ? {
                                                          ...metric,
                                                          max_points: event.target.value,
                                                        }
                                                      : metric
                                                  ),
                                                }
                                              : item
                                          )
                                        )
                                      }
                                      disabled={isReadOnly}
                                    />
                                    <p className="text-xs text-muted-foreground">Points</p>
                                  </div>

                                  {!isReadOnly ? (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() =>
                                        setDimensionDrafts((current) =>
                                          current.map((item) =>
                                            item.localId === draft.localId
                                              ? {
                                                  ...item,
                                                  metrics: item.metrics.filter(
                                                    (metric) =>
                                                      metric.localId !== metricDraft.localId
                                                  ),
                                                }
                                              : item
                                          )
                                        )
                                      }
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  ) : null}
                                </div>

                                {currentMetric?.how_to_measure ? (
                                  <div className="mt-3 rounded-lg bg-muted/30 p-3 text-sm text-muted-foreground">
                                    {currentMetric.how_to_measure}
                                  </div>
                                ) : null}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300">
              {error}
            </div>
          ) : null}
        </div>

        {!isReadOnly ? (
          <DrawerFooter>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="bg-[#3DCF8E] text-white hover:bg-[#2fb577]"
              >
                {isSubmitting ? 'Saving...' : template ? 'Save Changes' : 'Create Template'}
              </Button>
            </div>
          </DrawerFooter>
        ) : null}
      </DrawerContent>
    </Drawer>
  );
};
