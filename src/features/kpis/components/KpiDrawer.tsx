import type { ReactNode } from 'react';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KpiDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  onSave?: () => void;
  onCancel?: () => void;
  saveLabel?: string;
  cancelLabel?: string;
  isLoading?: boolean;
  size?: 'default' | 'large';
}

/**
 * Reusable drawer component for KPI-related forms and views
 * Can be used for creating/editing categories, templates, developer KPIs, etc.
 */
export const KpiDrawer = ({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  onSave,
  onCancel,
  saveLabel = 'Save',
  cancelLabel = 'Cancel',
  isLoading = false,
  size = 'default',
}: KpiDrawerProps) => {
  const handleCancel = () => {
    onCancel?.();
    onOpenChange(false);
  };

  const handleSave = () => {
    onSave?.();
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="right">
      <DrawerContent
        className={cn(
          size === 'large' && 'sm:max-w-2xl'
        )}
      >
        <DrawerHeader className="border-b">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DrawerTitle>{title}</DrawerTitle>
              {description && (
                <DrawerDescription className="mt-1">{description}</DrawerDescription>
              )}
            </div>
            <DrawerClose className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none">
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </DrawerClose>
          </div>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto p-6">{children}</div>

        {(footer || onSave || onCancel) && (
          <DrawerFooter className="border-t">
            {footer || (
              <div className="flex gap-2 justify-end w-full">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isLoading}
                >
                  {cancelLabel}
                </Button>
                {onSave && (
                  <Button
                    type="button"
                    onClick={handleSave}
                    disabled={isLoading}
                    className="bg-[#3DCF8E] hover:bg-[#3DCF8E]/90"
                  >
                    {isLoading ? 'Saving...' : saveLabel}
                  </Button>
                )}
              </div>
            )}
          </DrawerFooter>
        )}
      </DrawerContent>
    </Drawer>
  );
};
