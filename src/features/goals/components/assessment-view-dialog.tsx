import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { AssessmentCard } from './assessment-card';
import type { Assessment } from '../types';

interface AssessmentViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assessment: Assessment | null;
}

export const AssessmentViewDialog = ({
  open,
  onOpenChange,
  assessment,
}: AssessmentViewDialogProps) => {
  if (!assessment) return null;

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="right">
      <DrawerContent className="h-full overflow-y-auto">
        <DrawerHeader>
          <div className="flex items-center justify-between">
            <DrawerTitle>Checkpoint Assessment Results</DrawerTitle>
            <DrawerClose asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </DrawerClose>
          </div>
        </DrawerHeader>

        <div className="p-4 pb-8">
          <AssessmentCard assessment={assessment} showActionItems={true} />
        </div>
      </DrawerContent>
    </Drawer>
  );
};
