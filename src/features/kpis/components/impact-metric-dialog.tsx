import { useEffect, useMemo, useState } from 'react';
import { Search, Sparkles, Target, X } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import type { AvailableImpactMetric, SubmitImpactClaimRequest } from '../types';

interface ImpactMetricDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kpiId: string;
  metrics: AvailableImpactMetric[];
  onSubmit: (request: SubmitImpactClaimRequest) => Promise<void>;
}

export const ImpactMetricDialog = ({
  open,
  onOpenChange,
  kpiId,
  metrics,
  onSubmit,
}: ImpactMetricDialogProps) => {
  const [search, setSearch] = useState('');
  const [selectedMetricId, setSelectedMetricId] = useState<string | null>(null);
  const [evidenceText, setEvidenceText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSearch('');
    setSelectedMetricId(null);
    setEvidenceText('');
    setError(null);
  }, [open]);

  const filteredMetrics = useMemo(
    () =>
      metrics.filter((metric) =>
        [metric.name, metric.description, metric.dimension?.name]
          .filter(Boolean)
          .some((value) =>
            value?.toLowerCase().includes(search.trim().toLowerCase())
          )
      ),
    [metrics, search]
  );

  const selectedMetric = metrics.find((metric) => metric.id === selectedMetricId) || null;

  const handleSubmit = async () => {
    if (!selectedMetricId || !evidenceText.trim()) {
      setError('Select a metric and provide evidence');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        kpi_id: kpiId,
        source_metric_id: selectedMetricId,
        evidence_text: evidenceText.trim(),
      });
      onOpenChange(false);
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : 'Failed to add impact metric'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="right">
      <DrawerContent className="!w-full !max-w-6xl overflow-y-auto overflow-x-clip p-6">
        <DrawerHeader className="flex flex-row items-start justify-between gap-4">
          <div className="space-y-2">
            <DrawerTitle className="text-2xl">Add Impact Metric</DrawerTitle>
            <p className="text-sm text-muted-foreground">
              Pick an out-of-band metric, review how it should be measured, then attach the
              supporting evidence for this exceptional contribution.
            </p>
          </div>
          <DrawerClose asChild>
            <Button variant="ghost" size="icon">
              <X className="h-4 w-4" />
            </Button>
          </DrawerClose>
        </DrawerHeader>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-4">
            <div className="rounded-2xl border bg-muted/20 p-4">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search platform and company metrics"
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-3 rounded-2xl border p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="font-semibold">Available Metrics</h3>
                  <p className="text-sm text-muted-foreground">
                    Browse more comfortably with the full-height drawer layout.
                  </p>
                </div>
                <div className="rounded-lg bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
                  {filteredMetrics.length} found
                </div>
              </div>

              <div className="max-h-[65vh] space-y-2 overflow-y-auto pr-1">
                {filteredMetrics.length === 0 ? (
                  <div className="rounded-xl border border-dashed px-4 py-12 text-center text-sm text-muted-foreground">
                    No metrics match your search yet.
                  </div>
                ) : (
                  filteredMetrics.map((metric) => (
                    <button
                      key={metric.id}
                      type="button"
                      onClick={() => setSelectedMetricId(metric.id)}
                      className={`w-full rounded-xl border p-4 text-left transition ${
                        metric.id === selectedMetricId
                          ? 'border-[#3DCF8E] bg-[#3DCF8E]/10 shadow-[0_0_0_1px_rgba(61,207,142,0.18)]'
                          : 'hover:border-border/80 hover:bg-muted/20'
                      }`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="font-medium">{metric.name}</div>
                          <div className="mt-1 text-xs text-muted-foreground">
                            {metric.dimension?.name || 'No dimension'} • Default cap{' '}
                            {metric.default_max_points}
                          </div>
                        </div>
                        {metric.id === selectedMetricId ? (
                          <div className="rounded-full bg-[#3DCF8E] px-2.5 py-1 text-xs font-medium text-white">
                            Selected
                          </div>
                        ) : null}
                      </div>
                      {metric.description ? (
                        <p className="mt-3 text-sm text-muted-foreground">{metric.description}</p>
                      ) : null}
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <Card className="border-[#3DCF8E]/20 bg-gradient-to-br from-[#3DCF8E]/8 via-background to-background">
              <CardContent className="space-y-4 pt-6">
                <div className="flex items-start gap-3">
                  <div className="rounded-xl bg-[#3DCF8E]/15 p-2 text-[#208d61] dark:text-[#79e8b4]">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Selected Impact Metric</h3>
                    <p className="text-sm text-muted-foreground">
                      Choose a metric to inspect its intent before submitting the claim.
                    </p>
                  </div>
                </div>

                {selectedMetric ? (
                  <div className="space-y-4">
                    <div>
                      <div className="text-lg font-semibold">{selectedMetric.name}</div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        {selectedMetric.dimension?.name || 'No dimension'}
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-xl bg-muted/40 p-4">
                        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                          <Target className="h-3.5 w-3.5" />
                          Default Cap
                        </div>
                        <div className="mt-2 text-2xl font-semibold">
                          {selectedMetric.default_max_points}
                        </div>
                      </div>
                      <div className="rounded-xl bg-muted/40 p-4">
                        <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                          Scope
                        </div>
                        <div className="mt-2 text-sm font-medium">
                          {selectedMetric.scope === 'PLATFORM' ? 'Platform metric' : 'Company metric'}
                        </div>
                      </div>
                    </div>

                    {selectedMetric.description ? (
                      <div className="rounded-xl border bg-background/80 p-4 text-sm text-muted-foreground">
                        {selectedMetric.description}
                      </div>
                    ) : null}

                    <div className="rounded-xl border bg-muted/30 p-4 text-sm text-muted-foreground">
                      {selectedMetric.how_to_measure || 'No measurement notes for this metric.'}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
                    Select a metric from the left to review its details.
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="space-y-2 rounded-2xl border p-4">
              <div>
                <h3 className="font-semibold">Evidence</h3>
                <p className="text-sm text-muted-foreground">
                  Explain the exceptional work and why it deserves bonus recognition.
                </p>
              </div>
              <Textarea
                rows={10}
                value={evidenceText}
                onChange={(event) => setEvidenceText(event.target.value)}
                placeholder="Describe the exceptional contribution and why it deserves recognition."
              />
            </div>

            {error ? (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300">
                {error}
              </div>
            ) : null}
          </div>
        </div>

        <DrawerFooter className="px-0">
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-[#3DCF8E] text-white hover:bg-[#2fb577]"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Impact Claim'}
            </Button>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};
