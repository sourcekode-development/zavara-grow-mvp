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
import { Textarea } from '@/components/ui/textarea';
import type { CreateDimensionRequest, KpiDimension } from '../types';

interface DimensionDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialDimension?: KpiDimension | null;
  companyId: string;
  onSubmit: (request: CreateDimensionRequest) => Promise<void>;
}

export const DimensionDrawer = ({
  open,
  onOpenChange,
  initialDimension,
  companyId,
  onSubmit,
}: DimensionDrawerProps) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [scope, setScope] = useState<'COMPANY' | 'PLATFORM'>('COMPANY');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setName(initialDimension?.name || '');
    setDescription(initialDimension?.description || '');
    setScope(initialDimension?.scope || 'COMPANY');
    setError(null);
  }, [initialDimension, open]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('Dimension name is required');
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
      });
      onOpenChange(false);
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : 'Failed to save dimension'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="right">
      <DrawerContent className="!w-full !max-w-3xl overflow-y-auto p-6">
        <DrawerHeader className="flex flex-row items-start justify-between gap-4">
          <div className="space-y-2">
            <DrawerTitle className="text-2xl">
              {initialDimension ? 'Edit Dimension' : 'Create Dimension'}
            </DrawerTitle>
            <p className="text-sm text-muted-foreground">
              Define the category buckets that organize KPI metrics.
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
              <Label htmlFor="dimension-name">Dimension Name</Label>
              <Input
                id="dimension-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="e.g. Technical Excellence"
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
            <Label htmlFor="dimension-description">Description</Label>
            <Textarea
              id="dimension-description"
              rows={5}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Describe what this dimension should capture."
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
              {isSubmitting ? 'Saving...' : initialDimension ? 'Save Changes' : 'Create Dimension'}
            </Button>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};
