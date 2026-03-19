import { useState } from 'react';
import { Layers3, Pencil, Plus, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { TemplateFormDialog } from '../components/template-form-dialog';
import { TemplateDetailDrawer } from '../components/template-detail-drawer';
import { useUpskillActions, useUpskillTemplates } from '../hooks/useUpskill';
import type { UpskillTemplateWithModules } from '../types';

export const UpskillTemplatesPage = () => {
  const { user } = useAuthStore();
  const { templates, isLoading, refetch } = useUpskillTemplates({
    company_id: user?.profile?.company_id,
  });
  const { createTemplate, updateTemplate, error } = useUpskillActions();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<UpskillTemplateWithModules | null>(
    null
  );
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [selectedDetailTemplate, setSelectedDetailTemplate] =
    useState<UpskillTemplateWithModules | null>(null);

  const handleCreate = async (request: {
    title: string;
    description?: string;
    total_effort?: number | null;
    is_active?: boolean;
    is_published?: boolean;
    modules?: Array<{
      title: string;
      description?: string;
      effort?: number | null;
      order_index?: number;
      content?: { type: 'plain_text'; text: string } | null;
    }>;
  }) => {
    if (!user?.id || !user.profile?.company_id) {
      toast.error('You must be signed in');
      return;
    }

    if (selectedTemplate) {
      await updateTemplate(selectedTemplate.id, request);
    } else {
      await createTemplate(user.id, user.profile.company_id, request);
    }

    if (error) {
      toast.error(error);
      return;
    }

    toast.success(selectedTemplate ? 'Template updated' : 'Template created');
    setSelectedTemplate(null);
    await refetch();
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Up Skill Templates</h1>
          <p className="mt-1 text-muted-foreground">
            Reusable blueprints with modules included, ready for the team to clone.
          </p>
        </div>
        <Button
          className="bg-[#3DCF8E] hover:bg-[#2fb577]"
          onClick={() => {
            setSelectedTemplate(null);
            setDialogOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Template
        </Button>
      </div>

      {isLoading && <div className="text-sm text-muted-foreground">Loading templates...</div>}

      {!isLoading && templates.length === 0 && (
        <div className="rounded-2xl border border-dashed px-6 py-14 text-center">
          <Layers3 className="mx-auto h-10 w-10 text-[#3DCF8E]" />
          <h2 className="mt-4 text-xl font-semibold">No templates yet</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Capture a good program structure once, then let others duplicate it.
          </p>
        </div>
      )}

      {!isLoading && templates.length > 0 && (
        <div className="grid gap-4 xl:grid-cols-2">
          {templates.map((template) => (
            <Card key={template.id}>
              <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div>
                  <CardTitle>{template.title}</CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {template.description || 'No description yet.'}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedDetailTemplate(template);
                      setDetailDrawerOpen(true);
                    }}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    View
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedTemplate(template);
                      setDialogOpen(true);
                    }}
                  >
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-lg bg-muted/50 p-3">
                    <div className="text-xs text-muted-foreground">Modules</div>
                    <div className="text-lg font-semibold">
                      {template.modules?.length || 0}
                    </div>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-3">
                    <div className="text-xs text-muted-foreground">Est. Effort</div>
                    <div className="text-lg font-semibold">
                      {Number(template.total_effort || 0).toFixed(1)}
                    </div>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-3">
                    <div className="text-xs text-muted-foreground">State</div>
                    <div className="text-lg font-semibold">
                      {template.is_active ? 'Active' : 'Inactive'}
                    </div>
                  </div>
                </div>

                <div className="rounded-lg bg-muted/30 p-3">
                  <div className="text-xs font-medium text-muted-foreground">
                    Included modules
                  </div>
                  <div className="mt-2 space-y-1">
                    {(template.modules || []).slice(0, 4).map((module) => (
                      <div key={module.id} className="text-sm">
                        {module.title}
                      </div>
                    ))}
                    {(template.modules?.length || 0) > 4 && (
                      <div className="text-xs text-muted-foreground">
                        +{(template.modules?.length || 0) - 4} more modules
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <TemplateFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initialTemplate={selectedTemplate}
        onSubmit={handleCreate}
      />

      <TemplateDetailDrawer
        open={detailDrawerOpen}
        onOpenChange={setDetailDrawerOpen}
        template={selectedDetailTemplate}
      />
    </div>
  );
};
