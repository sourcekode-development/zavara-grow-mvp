import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import type { UpskillProgramWithDetails } from '../types';
import { ModuleStatusBadge } from './module-status-badge';
import { ProgramStatusBadge } from './program-status-badge';

interface ReviewProgramPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  program?: UpskillProgramWithDetails | null;
  onApprove: () => void;
  onRequestChanges: () => void;
}

export const ReviewProgramPreviewDialog = ({
  open,
  onOpenChange,
  program,
  onApprove,
  onRequestChanges,
}: ReviewProgramPreviewDialogProps) => {
  if (!program) {
    return null;
  }

  const modules = program.modules || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-7xl overflow-y-auto">
        <DialogHeader>
          <div className="flex flex-wrap items-center gap-2">
            <DialogTitle className="text-xl">{program.title}</DialogTitle>
            <ProgramStatusBadge status={program.status} />
          </div>
          <DialogDescription>
            Review the full program structure, content, and modules before making a decision.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-xs text-muted-foreground">Creator</div>
                <div className="mt-2 font-medium">
                  {program.creator?.full_name || 'Unknown'}
                </div>
                <div className="text-xs text-muted-foreground">
                  {program.creator?.email || 'No email'}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-xs text-muted-foreground">Estimated Effort</div>
                <div className="mt-2 text-lg font-semibold">
                  {Number(program.total_effort || 0).toFixed(1)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-xs text-muted-foreground">Modules</div>
                <div className="mt-2 text-lg font-semibold">{modules.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-xs text-muted-foreground">Review Round</div>
                <div className="mt-2 text-lg font-semibold">{program.review_round}</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="p-5">
              <h3 className="text-sm font-semibold text-muted-foreground">
                Program Description
              </h3>
              <p className="mt-3 whitespace-pre-wrap text-sm">
                {program.description || 'No description provided.'}
              </p>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <div>
              <h3 className="text-base font-semibold">Modules</h3>
              <p className="text-sm text-muted-foreground">
                Full module breakdown with effort estimate and learning content.
              </p>
            </div>

            {modules.length === 0 && (
              <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                No modules were added to this program yet.
              </div>
            )}

            {modules
              .slice()
              .sort((a, b) => a.order_index - b.order_index)
              .map((module, index) => (
                <Card key={module.id}>
                  <CardContent className="space-y-4 p-5">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="font-semibold">
                            {index + 1}. {module.title}
                          </h4>
                          <ModuleStatusBadge status={module.status} />
                        </div>
                        <p className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap">
                          {module.description || 'No description provided.'}
                        </p>
                      </div>

                      <div className="rounded-lg bg-muted/50 px-3 py-2 text-sm">
                        <div className="text-xs text-muted-foreground">Estimated Effort</div>
                        <div className="font-semibold">
                          {Number(module.effort || 0).toFixed(1)}
                        </div>
                      </div>
                    </div>

                    <div className="rounded-xl border border-border/60 bg-muted/25 p-4">
                      <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Content
                      </div>
                      <div className="mt-3 whitespace-pre-wrap text-sm">
                        {module.content?.text || 'No content added yet.'}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button variant="outline" onClick={onRequestChanges}>
            Request Changes
          </Button>
          <Button className="bg-[#3DCF8E] hover:bg-[#2fb577]" onClick={onApprove}>
            Approve
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
