import { BookOpen, Clock, Layers3, X } from 'lucide-react';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import type { UpskillTemplateWithModules } from '../types';

interface TemplateDetailDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: UpskillTemplateWithModules | null;
}

export const TemplateDetailDrawer = ({
  open,
  onOpenChange,
  template,
}: TemplateDetailDrawerProps) => {
  if (!template) return null;

  const modules = template.modules || [];

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="right">
      <DrawerContent className="!w-full !max-w-5xl">
        <DrawerHeader className="flex flex-row items-start justify-between">
          <div className="flex-1">
            <DrawerTitle className="text-2xl">{template.title}</DrawerTitle>
            <p className="mt-2 text-sm text-muted-foreground">
              {template.description || 'No description provided'}
            </p>
          </div>
          <DrawerClose asChild>
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </DrawerClose>
        </DrawerHeader>

        <div className="max-h-[calc(100vh-200px)] overflow-y-auto px-4 pb-6">
          <div className="space-y-6">
            {/* Template Stats */}
            <div className="grid gap-3 sm:grid-cols-3">
              <Card className="bg-muted/50">
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

              <Card className="bg-muted/50">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-[#3DCF8E]" />
                    <div>
                      <p className="text-xs text-muted-foreground">Est. Effort</p>
                      <p className="text-lg font-semibold">
                        {Number(template.total_effort || 0).toFixed(1)} hrs
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-muted/50">
                <CardContent className="pt-4">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Status</p>
                    <div className="flex gap-2">
                      <Badge
                        variant={
                          template.is_active ? 'default' : 'secondary'
                        }
                        className={
                          template.is_active
                            ? 'bg-[#3DCF8E] text-black hover:bg-[#2fb577]'
                            : ''
                        }
                      >
                        {template.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                      {template.is_published && (
                        <Badge variant="outline">Published</Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Separator />

            {/* Modules Section */}
            <div>
              <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                <BookOpen className="h-5 w-5 text-[#3DCF8E]" />
                Included Modules ({modules.length})
              </h3>

              {modules.length === 0 ? (
                <div className="rounded-lg border border-dashed bg-muted/30 px-4 py-8 text-center">
                  <p className="text-sm text-muted-foreground">
                    No modules in this template yet
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {modules.map((module, index) => (
                    <Card key={module.id} className="overflow-hidden">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <Badge
                                variant="outline"
                                className="bg-muted/50"
                              >
                                {index + 1}
                              </Badge>
                              <CardTitle className="text-base">
                                {module.title}
                              </CardTitle>
                            </div>
                            {module.description && (
                              <p className="mt-2 text-sm text-muted-foreground">
                                {module.description}
                              </p>
                            )}
                          </div>
                          {module.effort && (
                            <div className="whitespace-nowrap rounded-lg bg-[#3DCF8E]/10 px-3 py-2 text-right">
                              <p className="text-xs text-muted-foreground">
                                Effort
                              </p>
                              <p className="font-semibold text-[#3DCF8E]">
                                {Number(module.effort).toFixed(1)} hrs
                              </p>
                            </div>
                          )}
                        </div>
                      </CardHeader>

                      {(module.content_plain_text || module.content) && (
                        <>
                          <Separator />
                          <CardContent className="pt-3">
                            <div className="rounded-lg bg-muted/30 p-3">
                              <p className="text-xs font-medium text-muted-foreground">
                                Content
                              </p>
                              <div className="mt-2 text-sm leading-relaxed text-foreground">
                                {module.content_plain_text ||
                                  (module.content?.type === 'plain_text'
                                    ? module.content.text
                                    : 'No content details')}
                              </div>
                            </div>
                          </CardContent>
                        </>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};
