import { format } from 'date-fns';
import { Calendar, Clock, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import type { UpskillModuleEffortLog } from '@/shared/types';
import type { UpskillProgramModuleWithMetrics } from '../types';

interface ModuleLogsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  module?: UpskillProgramModuleWithMetrics | null;
  logs?: UpskillModuleEffortLog[];
  isLoading?: boolean;
}

export const ModuleLogsDialog = ({
  open,
  onOpenChange,
  module,
  logs = [],
  isLoading = false,
}: ModuleLogsDialogProps) => {
  const moduleLogs = logs.filter((log) => log.module_id === module?.id) || [];

  const totalEffort = moduleLogs.reduce((sum, log) => sum + Number(log.effort_used || 0), 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Effort Logs - {module?.title}</DialogTitle>
          <DialogDescription>
            Viewing all effort logs recorded for this module
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-muted/50">
            <div>
              <div className="text-sm text-muted-foreground">Total Logs</div>
              <div className="text-2xl font-bold">{moduleLogs.length}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Total Effort</div>
              <div className="text-2xl font-bold">{totalEffort.toFixed(1)}</div>
            </div>
          </div>

          {/* Logs List */}
          {isLoading && (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-35 rounded-lg" />
              ))}
            </div>
          )}

          {!isLoading && moduleLogs.length === 0 && (
            <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
              No effort logs recorded yet for this module.
            </div>
          )}

          {!isLoading && moduleLogs.length > 0 && (
            <div className="space-y-3">
              {moduleLogs
                .sort(
                  (a, b) =>
                    new Date(b.logged_on).getTime() - new Date(a.logged_on).getTime()
                )
                .map((log) => (
                  <div
                    key={log.id}
                    className="rounded-lg border border-border/60 p-4 space-y-3 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-[#3DCF8E]" />
                        <div>
                          <div className="font-semibold">{Number(log.effort_used).toFixed(1)} hours</div>
                          <div className="text-xs text-muted-foreground">Effort logged</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div className="text-right">
                          <div className="text-sm font-medium">
                            {format(new Date(log.logged_on), 'MMM dd, yyyy')}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {format(new Date(log.created_at), 'HH:mm')}
                          </div>
                        </div>
                      </div>
                    </div>

                    {log.notes && (
                      <div className="flex gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                        <div className="flex-1">
                          <div className="text-xs text-muted-foreground mb-1">Notes</div>
                          <p className="text-sm text-foreground whitespace-pre-wrap wrap-break-word">
                            {log.notes}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          )}
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
