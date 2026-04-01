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
import type { KpiMetric } from '../types';
import { ScopeBadge } from './scope-badge';

interface MetricDetailDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  metric: KpiMetric | null;
}

export const MetricDetailDrawer = ({
  open,
  onOpenChange,
  metric,
}: MetricDetailDrawerProps) => {
  if (!metric) return null;

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="right">
      <DrawerContent className="!w-full !max-w-4xl overflow-y-auto p-6">
        <DrawerHeader className="flex flex-row items-start justify-between gap-4">
          <div className="space-y-2">
            <DrawerTitle className="text-2xl">{metric.name}</DrawerTitle>
            <div className="flex flex-wrap items-center gap-2">
              <ScopeBadge scope={metric.scope} />
              {metric.dimension ? (
                <span className="text-sm text-muted-foreground">
                  Dimension: {metric.dimension.name}
                </span>
              ) : null}
            </div>
          </div>
          <DrawerClose asChild>
            <Button variant="ghost" size="icon">
              <X className="h-4 w-4" />
            </Button>
          </DrawerClose>
        </DrawerHeader>

        <div className="space-y-4">
          <Card>
            <CardContent className="space-y-3 pt-6">
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground">Description</h3>
                <p className="mt-2 whitespace-pre-wrap text-sm">
                  {metric.description || 'No description provided.'}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-3 pt-6">
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground">How To Measure</h3>
                <p className="mt-2 whitespace-pre-wrap text-sm">
                  {metric.how_to_measure || 'No measurement notes provided.'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </DrawerContent>
    </Drawer>
  );
};
