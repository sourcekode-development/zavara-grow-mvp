import {
  BookOpen,
  ChevronDown,
  Clock3,
  FileText,
  Layers3,
  ListChecks,
  UserRound,
  X,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Separator } from '@/components/ui/separator';
import { ModuleStatusBadge } from './module-status-badge';
import { ProgramStatusBadge } from './program-status-badge';
import { useUpskillProgramDetails } from '../hooks/useUpskill';

interface TeamProgramDetailDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  programId: string | null;
}

const formatDate = (value: string | null) =>
  value ? new Date(value).toLocaleDateString() : 'Not available';

export const TeamProgramDetailDrawer = ({
  open,
  onOpenChange,
  programId,
}: TeamProgramDetailDrawerProps) => {
  const { program, isLoading, error } = useUpskillProgramDetails(open ? programId || undefined : undefined);

  if (!programId) return null;

  const modules = program?.modules || [];
  const logs = program?.effort_logs || [];

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="right">
      <DrawerContent className="!w-full !max-w-6xl">
        <DrawerHeader className="flex flex-row items-start justify-between gap-4 border-b border-border/60">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <DrawerTitle className="text-2xl">
                {program?.title || 'Loading program...'}
              </DrawerTitle>
              {program && <ProgramStatusBadge status={program.status} />}
            </div>
            <DrawerDescription className="mt-2 max-w-3xl">
              {program?.description || 'No description provided for this program.'}
            </DrawerDescription>
          </div>
          <DrawerClose asChild>
            <Button variant="ghost" size="icon" className="shrink-0">
              <X className="h-4 w-4" />
            </Button>
          </DrawerClose>
        </DrawerHeader>

        <div className="max-h-[calc(100vh-120px)] overflow-y-auto px-4 pb-6 pt-4">
          {isLoading && (
            <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
              Loading program details...
            </div>
          )}

          {!isLoading && error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
              {error}
            </div>
          )}

          {!isLoading && program && (
            <div className="space-y-6">
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <Card className="bg-muted/40">
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-3">
                      <Layers3 className="h-5 w-5 text-[#3DCF8E]" />
                      <div>
                        <p className="text-xs text-muted-foreground">Modules</p>
                        <p className="text-lg font-semibold">{modules.length}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-muted/40">
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-3">
                      <Clock3 className="h-5 w-5 text-[#3DCF8E]" />
                      <div>
                        <p className="text-xs text-muted-foreground">Est. Effort</p>
                        <p className="text-lg font-semibold">
                          {Number(program.total_effort || 0).toFixed(1)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-muted/40">
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-3">
                      <BookOpen className="h-5 w-5 text-[#3DCF8E]" />
                      <div>
                        <p className="text-xs text-muted-foreground">Logged Effort</p>
                        <p className="text-lg font-semibold">
                          {Number(program.stats?.total_logged_effort || 0).toFixed(1)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-muted/40">
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-3">
                      <ListChecks className="h-5 w-5 text-[#3DCF8E]" />
                      <div>
                        <p className="text-xs text-muted-foreground">Completion</p>
                        <p className="text-lg font-semibold">
                          {program.completed_modules}/{program.total_modules || modules.length}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Program Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-xl bg-muted/35 p-3">
                        <div className="text-xs text-muted-foreground">Developer</div>
                        <div className="mt-1 font-medium">
                          {program.assignee?.full_name || 'Unknown developer'}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {program.assignee?.email || 'No email available'}
                        </div>
                      </div>
                      <div className="rounded-xl bg-muted/35 p-3">
                        <div className="text-xs text-muted-foreground">Created By</div>
                        <div className="mt-1 font-medium">
                          {program.creator?.full_name || 'Unknown creator'}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {program.creator?.email || 'No email available'}
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-xl bg-muted/35 p-3">
                        <div className="text-xs text-muted-foreground">Started</div>
                        <div className="mt-1 font-medium">{formatDate(program.started_at)}</div>
                      </div>
                      <div className="rounded-xl bg-muted/35 p-3">
                        <div className="text-xs text-muted-foreground">Last Activity</div>
                        <div className="mt-1 font-medium">
                          {formatDate(program.last_activity_date)}
                        </div>
                      </div>
                    </div>

                    <div className="rounded-xl bg-muted/35 p-3">
                      <div className="text-xs text-muted-foreground">Reviewers</div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {(program.reviews || []).length > 0 ? (
                          (program.reviews || []).map((review) => (
                            <Badge key={review.id} variant="outline" className="gap-1 px-2 py-1">
                              <UserRound className="h-3 w-3" />
                              {review.reviewer?.full_name || 'Reviewer'}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            No reviewers assigned yet.
                          </span>
                        )}
                      </div>
                    </div>

                    {program.template && (
                      <div className="rounded-xl border border-[#3DCF8E]/20 bg-[#3DCF8E]/5 p-4">
                        <div className="text-xs text-muted-foreground">Source template</div>
                        <div className="mt-1 font-medium">{program.template.title}</div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {program.template.description || 'No template description.'}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Modules</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {modules.length === 0 && (
                      <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                        No modules added to this program yet.
                      </div>
                    )}

                    {modules.map((module, index) => {
                      const moduleLogs = logs.filter((log) => log.module_id === module.id);

                      return (
                        <div key={module.id} className="rounded-2xl border border-border/60 bg-card">
                          <div className="flex flex-col gap-3 p-4">
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                              <div className="space-y-2">
                                <div className="flex flex-wrap items-center gap-2">
                                  <Badge variant="outline" className="bg-muted/50">
                                    {index + 1}
                                  </Badge>
                                  <div className="font-semibold">{module.title}</div>
                                  <ModuleStatusBadge status={module.status} />
                                </div>
                                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                                  <span className="rounded-full bg-muted px-3 py-1">
                                    Est. effort {Number(module.effort || 0).toFixed(1)}
                                  </span>
                                  <span className="rounded-full bg-muted px-3 py-1">
                                    Logged {Number(module.logged_effort || 0).toFixed(1)}
                                  </span>
                                  <span className="rounded-full bg-muted px-3 py-1">
                                    Logs {module.log_count}
                                  </span>
                                  <span className="rounded-full bg-muted px-3 py-1">
                                    Last log {formatDate(module.last_logged_on)}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <Separator />

                            {module.description && (
                              <Collapsible defaultOpen={index === 0}>
                                <CollapsibleTrigger asChild>
                                  <Button variant="ghost" className="justify-between px-0 text-left">
                                    <span className="flex items-center gap-2">
                                      <FileText className="h-4 w-4 text-[#3DCF8E]" />
                                      Description
                                    </span>
                                    <ChevronDown className="h-4 w-4" />
                                  </Button>
                                </CollapsibleTrigger>
                                <CollapsibleContent className="pt-2 text-sm whitespace-pre-wrap text-muted-foreground">
                                  {module.description}
                                </CollapsibleContent>
                              </Collapsible>
                            )}

                            {module.content?.text && (
                              <Collapsible>
                                <CollapsibleTrigger asChild>
                                  <Button variant="ghost" className="justify-between px-0 text-left">
                                    <span className="flex items-center gap-2">
                                      <BookOpen className="h-4 w-4 text-[#3DCF8E]" />
                                      Content
                                    </span>
                                    <ChevronDown className="h-4 w-4" />
                                  </Button>
                                </CollapsibleTrigger>
                                <CollapsibleContent className="pt-2">
                                  <div className="rounded-xl bg-muted/35 p-3 text-sm whitespace-pre-wrap text-muted-foreground">
                                    {module.content.text}
                                  </div>
                                </CollapsibleContent>
                              </Collapsible>
                            )}

                            <Collapsible>
                              <CollapsibleTrigger asChild>
                                <Button variant="ghost" className="justify-between px-0 text-left">
                                  <span className="flex items-center gap-2">
                                    <Clock3 className="h-4 w-4 text-[#3DCF8E]" />
                                    Effort Logs ({moduleLogs.length})
                                  </span>
                                  <ChevronDown className="h-4 w-4" />
                                </Button>
                              </CollapsibleTrigger>
                              <CollapsibleContent className="pt-2">
                                {moduleLogs.length === 0 ? (
                                  <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
                                    No effort logs recorded for this module yet.
                                  </div>
                                ) : (
                                  <div className="space-y-2">
                                    {moduleLogs.map((log) => (
                                      <div
                                        key={log.id}
                                        className="rounded-xl border border-border/60 bg-muted/20 p-3"
                                      >
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                          <div className="text-sm font-medium">
                                            {Number(log.effort_used || 0).toFixed(1)} effort
                                          </div>
                                          <div className="text-xs text-muted-foreground">
                                            {new Date(log.logged_on).toLocaleDateString()}
                                          </div>
                                        </div>
                                        <div className="mt-1 text-xs text-muted-foreground">
                                          Logged by {program.assignee?.full_name || 'developer'}
                                        </div>
                                        {log.notes && (
                                          <p className="mt-2 text-sm whitespace-pre-wrap text-muted-foreground">
                                            {log.notes}
                                          </p>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </CollapsibleContent>
                            </Collapsible>
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
};
