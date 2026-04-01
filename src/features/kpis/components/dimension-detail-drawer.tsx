import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Card, CardContent } from '@/components/ui/card';
import type { KpiDimension } from '../types';
import { ScopeBadge } from './scope-badge';

interface DimensionDetailDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dimension: KpiDimension | null;
}

export const DimensionDetailDrawer = ({
  open,
  onOpenChange,
  dimension,
}: DimensionDetailDrawerProps) => {
  if (!dimension) return null;

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="right">
      <DrawerContent className="!w-full !max-w-4xl overflow-y-auto p-6">
        <DrawerHeader className="flex flex-row items-start justify-between gap-4">
          <div className="space-y-2">
            <DrawerTitle className="text-2xl">{dimension.name}</DrawerTitle>
            <div className="flex flex-wrap items-center gap-2">
              <ScopeBadge scope={dimension.scope} />
            </div>
          </div>
          <DrawerClose asChild>
            <Button variant="ghost" size="icon">
              <X className="h-4 w-4" />
            </Button>
          </DrawerClose>
        </DrawerHeader>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="bg-muted/40">
            <CardContent className="pt-4">
              <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Metrics
              </div>
              <div className="mt-2 text-2xl font-semibold">{dimension.metrics_count || 0}</div>
            </CardContent>
          </Card>

          <Card className="bg-muted/40">
            <CardContent className="pt-4">
              <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Templates
              </div>
              <div className="mt-2 text-2xl font-semibold">{dimension.templates_count || 0}</div>
            </CardContent>
          </Card>

          <Card className="bg-muted/40">
            <CardContent className="pt-4">
              <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Scope
              </div>
              <div className="mt-2 text-lg font-semibold">
                {dimension.scope === 'PLATFORM' ? 'Platform-wide' : 'Company'}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-4">
          <CardContent className="space-y-3 pt-6">
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground">Description</h3>
              <p className="mt-2 whitespace-pre-wrap text-sm">
                {dimension.description || 'No description provided.'}
              </p>
            </div>
          </CardContent>
        </Card>
      </DrawerContent>
    </Drawer>
  );
};
