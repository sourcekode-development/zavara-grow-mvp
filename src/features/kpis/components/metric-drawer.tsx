import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { Textarea } from '@/components/ui/textarea';
import type { CreateMetricRequest, KpiDimension, KpiMetric } from '../types';

interface MetricDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialMetric?: KpiMetric | null;
  dimensions: KpiDimension[];
  companyId: string;
  onSubmit: (request: CreateMetricRequest) => Promise<void>;
}

export const MetricDrawer = ({
  open,
  onOpenChange,
  initialMetric,
  dimensions,
  companyId,
  onSubmit,
}: MetricDrawerProps) => {
  const [dimensionId, setDimensionId] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [howToMeasure, setHowToMeasure] = useState('');
  const [scope, setScope] = useState<'COMPANY' | 'PLATFORM'>('COMPANY');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setDimensionId(initialMetric?.dimension_id || dimensions[0]?.id || '');
    setName(initialMetric?.name || '');
    setDescription(initialMetric?.description || '');
    setHowToMeasure(initialMetric?.how_to_measure || '');
    setScope(initialMetric?.scope || 'COMPANY');
    setError(null);
  }, [initialMetric, open, dimensions]);

  const handleSubmit = async () => {
    if (!name.trim() || !dimensionId) {
      setError('Metric name and dimension are required');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        dimension_id: dimensionId,
        name: name.trim(),
        description: description.trim() || undefined,
        how_to_measure: howToMeasure.trim() || undefined,
        scope,
        company_id: scope === 'COMPANY' ? companyId : null,
      });
      onOpenChange(false);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Failed to save metric');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="right">
      <DrawerContent className="!w-full !max-w-4xl overflow-y-auto p-6">
        <DrawerHeader className="flex flex-row items-start justify-between gap-4">
          <div className="space-y-2">
            <DrawerTitle className="text-2xl">
              {initialMetric ? 'Edit Metric' : 'Create Metric'}
            </DrawerTitle>
            <p className="text-sm text-muted-foreground">
              Define measurable KPI signals that reviewers can award points against.
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
              <Label htmlFor="metric-name">Metric Name</Label>
              <Input
                id="metric-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="e.g. Code Review Quality"
              />
            </div>

            <div className="space-y-2">
              <Label>Scope</Label>
              <div className="rounded-lg border bg-muted/30 px-3 py-2 text-sm">
                Company
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="metric-dimension">Dimension</Label>
            <Select value={dimensionId} onValueChange={setDimensionId}>
              <SelectTrigger id="metric-dimension">
                <SelectValue placeholder="Select a dimension" />
              </SelectTrigger>
              <SelectContent>
                {dimensions.map((dimension) => (
                  <SelectItem key={dimension.id} value={dimension.id}>
                    {dimension.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="metric-description">Description</Label>
            <Textarea
              id="metric-description"
              rows={4}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="metric-measurement">How To Measure</Label>
            <Textarea
              id="metric-measurement"
              rows={4}
              value={howToMeasure}
              onChange={(event) => setHowToMeasure(event.target.value)}
              placeholder="Describe the evidence or signals reviewers should look for."
            />
          </div>

          {error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300">
              {error}
            </div>
          ) : null}
        </div>

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
              {isSubmitting ? 'Saving...' : initialMetric ? 'Save Changes' : 'Create Metric'}
            </Button>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};
